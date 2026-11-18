#!/usr/bin/env node
/*
Turn a long source into a reading copy that can be read chunk by chunk, plus a chunk plan.

Usage:
  node prepare.ts <input file> [--out DIR] [--width 200] [--chunk-tokens 15000]

- .srt / .vtt: strips cue numbers and timestamps, merges the repeated lines of rolling
  captions, writes transcript.txt as paragraphs each starting with [HH:MM:SS], then
  builds read.txt from it.
- Other plain text (.txt / .md etc.): builds read.txt directly.
- Every line of read.txt is at most --width characters; existing blank lines are kept.
- Finally prints the longest original line, line count, estimated tokens, and the Read
  parameters (offset / limit) for each chunk.

Where the defaults come from:
- width=200: Read can only split by line. Transcripts often put a whole paragraph on one
  line, and a file with no line breaks is a single line; a line that is too long cannot be
  chunked. Wrapping to 200 characters makes any source splittable, and one line holds
  only a sentence or two, so notes can cite the source by line number precisely.
- chunk-tokens=15000: a single Read errors above ~25k tokens (Claude Code). 15k leaves
  margin because the token estimate below is approximate. If Read still reports the
  limit, lower this value and rerun.

Lengths count characters (code points), not UTF-16 units, so CJK and emoji count once.
*/
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";

const time = /^(\d{1,2}):(\d{2}):(\d{2})[,.]\d{3}\s*-->/u;
const tag = /<[^>]+>/gu;
const sentenceEnd = /[.?!。？！]$/u;

const length = (text: string) => [...text].length;

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

function splitLines(text: string) {
  const lines = text.split(/\r\n|[\n\r\v\f\x1c-\x1e\x85\u2028\u2029]/u);
  if (lines.at(-1) === "") lines.pop();
  return lines;
}

/** Rough token estimate: ~4 ASCII characters per token, ~1 CJK (non-ASCII) character per token. */
function estimateTokens(text: string) {
  let ascii = 0, other = 0;
  for (const char of text) char.codePointAt(0)! < 128 ? ascii++ : other++;
  return ascii / 4 + other;
}

/** [start HH:MM:SS, text] per cue, dropping consecutive duplicate lines (rolling captions repeat the previous line). */
function parseSubtitles(raw: string) {
  const cues: [string, string][] = [];
  let start: string | undefined, buffer: string[] = [], last: string | undefined;
  for (let line of [...splitLines(raw), ""]) {
    line = line.trim();
    const match = time.exec(line);
    if (match) {
      start = `${match[1]!.padStart(2, "0")}:${match[2]}:${match[3]}`;
      continue;
    }
    if (!line) {
      if (start && buffer.length) cues.push([start, buffer.join(" ")]);
      start = undefined;
      buffer = [];
      continue;
    }
    if (start === undefined) continue; // cue numbers, WEBVTT header, NOTE, style blocks
    const text = line.replace(tag, "").trim();
    if (text && text !== last) {
      buffer.push(text);
      last = text;
    }
  }
  return cues;
}

/** Break a paragraph once it is long enough (~100 English words) and the last cue ends a sentence. */
function paragraphs(cues: [string, string][], minChars = 600) {
  const out: string[] = [];
  let current: string[] = [], start: string | undefined;
  for (const [stamp, text] of cues) {
    start ??= stamp;
    if (current.length && length(current.join(" ")) >= minChars && sentenceEnd.test(current.at(-1)!.trimEnd())) {
      out.push(`[${start}] ${current.join(" ")}`);
      current = [];
      start = stamp;
    }
    current.push(text);
  }
  if (current.length) out.push(`[${start}] ${current.join(" ")}`);
  return out.join("\n\n") + "\n";
}

/** Greedy wrap on whitespace like Python's textwrap.wrap(break_on_hyphens=False); words longer than width are split. */
function wrap(line: string, width: number) {
  let column = 0, expanded = "";
  for (const char of line) {
    if (char === "\t") {
      const spaces = 8 - column % 8;
      expanded += " ".repeat(spaces);
      column += spaces;
    } else {
      expanded += /[\n\r\v\f]/u.test(char) ? " " : char;
      column = char === "\n" || char === "\r" ? 0 : column + 1;
    }
  }
  const chunks = expanded.split(/(\s+)/u).filter(Boolean).map(chunk => [...chunk]).reverse();
  const lines: string[] = [];
  while (chunks.length) {
    if (lines.length && !chunks.at(-1)!.join("").trim()) chunks.pop();
    const current: string[][] = [];
    let used = 0;
    while (chunks.length && used + chunks.at(-1)!.length <= width) {
      used += chunks.at(-1)!.length;
      current.push(chunks.pop()!);
    }
    if (chunks.length && chunks.at(-1)!.length > width) {
      const word = chunks.at(-1)!;
      const room = Math.max(width - used, 1);
      current.push(word.slice(0, room));
      chunks[chunks.length - 1] = word.slice(room);
    }
    if (current.length && !current.at(-1)!.join("").trim()) current.pop();
    if (current.length) lines.push(current.map(chunk => chunk.join("")).join(""));
  }
  return lines;
}

function fold(text: string, width: number) {
  return splitLines(text).flatMap(line => {
    if (length(line) <= width) return [line];
    const wrapped = wrap(line, width);
    return wrapped.length ? wrapped : [""];
  });
}

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    out: { type: "string", default: "." },
    width: { type: "string", default: "200" },
    "chunk-tokens": { type: "string", default: "15000" },
  },
});
const integer = (name: string, raw: string) => /^\d+$/u.test(raw) ? Number(raw) : fail(`--${name} must be a whole number`);
const width = integer("width", values.width);
const chunkTokens = integer("chunk-tokens", values["chunk-tokens"]);
const [source] = positionals;
if (positionals.length !== 1 || !source) fail("Usage: node prepare.ts <input file> [--out DIR] [--width 200] [--chunk-tokens 15000]");
if (!existsSync(source) || !statSync(source).isFile()) fail(`File not found: ${source}`);
const raw = new TextDecoder().decode(readFileSync(source));
if (!raw.trim()) fail(`File is empty: ${source}`);
mkdirSync(values.out, { recursive: true });
console.log(`Source: ${source}`);
console.log(`Longest original line: ${Math.max(...splitLines(raw).map(length))} characters`);

let text = raw;
if (/\.(?:srt|vtt)$/iu.test(source)) {
  const cues = parseSubtitles(raw);
  if (!cues.length) fail("No subtitle cues parsed; check that the file is standard SRT/VTT");
  text = paragraphs(cues);
  const transcript = join(values.out, "transcript.txt");
  writeFileSync(transcript, text);
  console.log(`${cues.length} cues, last one starts at ${cues.at(-1)![0]} -> ${transcript}`);
}

const lines = fold(text, width);
const reading = join(values.out, "read.txt");
writeFileSync(reading, lines.join("\n") + "\n");
console.log(`Reading copy: ${reading}, ${lines.length} lines, ~${Math.trunc(estimateTokens(lines.join("\n")))} tokens, each line <= ${width} characters`);

console.log("Chunk plan (Read offset starts at 1; read every chunk in order):");
let chunk = 0, start = 1, size = 0;
for (const [index, line] of lines.entries()) {
  const number = index + 1;
  size += estimateTokens(line) + 1; // +1: Read also prefixes each line with its number
  if (size >= chunkTokens || number === lines.length) {
    console.log(`  chunk ${++chunk}: offset=${start} limit=${number - start + 1} (lines ${start}-${number}, ~${Math.trunc(size)} tokens)`);
    start = number + 1;
    size = 0;
  }
}
