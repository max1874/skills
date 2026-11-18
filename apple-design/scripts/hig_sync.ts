#!/usr/bin/env node
/*
Mirror Apple's Human Interface Guidelines as Markdown into a local cache.

The HIG pages on developer.apple.com are rendered from DocC JSON at
https://developer.apple.com/tutorials/data/design/human-interface-guidelines/<path>.json.
This walks every page reachable from the root, converts each to Markdown and writes
  <out>/<path>.md       one file per page, with its URL and last-change note on top
  <out>/INDEX.md        the tree, with each page's one-line abstract
Apple's text is not ours to redistribute, so the cache lives outside any repository
(default ~/.cache/apple-design/hig).

Usage: node hig_sync.ts [--out DIR]   (Node.js 22.18+ built-ins only; one request per page)
*/
import { mkdirSync, writeFileSync, writeSync } from "node:fs";
import { STATUS_CODES } from "node:http";
import { homedir } from "node:os";
import { basename, dirname, join } from "node:path";

const BASE = "https://developer.apple.com/tutorials/data";
const SITE = "https://developer.apple.com";
const ROOT = "/design/human-interface-guidelines";

const sleep = (s: number) => new Promise((r) => setTimeout(r, s * 1000));
// Python's str.strip(): its whitespace set differs from String.prototype.trim (no U+FEFF; adds U+001C–U+001F, U+0085).
const strip = (s: string) => s.replace(/^[\t-\r\x1c-\x20\x85\xa0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]+|[\t-\r\x1c-\x20\x85\xa0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]+$/g, "");
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

async function fetchPage(path: string) {
  const url = `${BASE}${path}.json`;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 hig-sync" }, signal: AbortSignal.timeout(30_000) });
      // HTTP/2 responses carry no reason phrase; Python (always HTTP/1.1) reports the standard one.
      if (!r.ok) throw new Error(`HTTP Error ${r.status}: ${r.statusText || STATUS_CODES[r.status] || ""}`);
      return await r.json();
    } catch (e) { // network hiccups: retry, then give up on this page
      if (attempt === 3) {
        writeSync(2, `skip ${path}: ${(e as Error).message}\n`);
        return null;
      }
      await sleep(1.5 * (attempt + 1));
    }
  }
}

const absolute = (url: string) => (url.startsWith("/") ? SITE + url : url);

function inline(nodes: any[] | undefined, refs: any): string {
  const out: string[] = [];
  for (const n of nodes ?? []) {
    const t = n.type;
    if (t === "text") out.push(n.text ?? "");
    else if (t === "emphasis") out.push(`*${inline(n.inlineContent, refs)}*`);
    else if (t === "strong") out.push(`**${inline(n.inlineContent, refs)}**`);
    else if (t === "codeVoice") out.push(`\`${n.code ?? ""}\``);
    else if (t === "reference") {
      const r = refs[n.identifier] ?? {};
      const title = inline(n.overridingTitleInlineContent, refs) || r.title || (n.identifier ?? "");
      const url = absolute(r.url ?? "");
      out.push(url ? `[${title}](${url})` : title);
    } else if (t === "link") out.push(`[${n.title || n.destination}](${n.destination ?? "None"})`);
    else if (t === "image") {
      const alt = refs[n.identifier]?.alt || "";
      out.push(alt ? `[image: ${alt}]` : "");
    } else if (t === "newTerm") out.push(inline(n.inlineContent, refs));
    else if ("inlineContent" in n) out.push(inline(n.inlineContent, refs));
    else if ("text" in n) out.push(n.text);
  }
  return out.join("");
}

function blocks(nodes: any[] | undefined, refs: any, depth = 0): string {
  const lines: string[] = [];
  const pad = "  ".repeat(depth);
  for (const n of nodes ?? []) {
    const t = n.type;
    if (t === "heading") lines.push(`\n${"#".repeat(Math.min((n.level ?? 2) + 1, 6))} ${n.text ?? ""}\n`);
    else if (t === "paragraph") lines.push(pad + inline(n.inlineContent, refs) + "\n");
    else if (t === "unorderedList" || t === "orderedList") {
      (n.items ?? []).forEach((item: any, i: number) => {
        const body = strip(blocks(item.content, refs, depth + 1));
        lines.push(`${pad}${t === "orderedList" ? `${i + 1}.` : "-"} ${body}`);
      });
      lines.push("");
    } else if (t === "aside") {
      const name = n.name || capitalize(n.style ?? "note");
      const body = strip(blocks(n.content, refs)).replaceAll("\n", "\n> ");
      lines.push(`> **${name}:** ${body}\n`);
    } else if (t === "table") {
      const rows: any[][] = n.rows ?? [];
      if (rows.length) {
        let cells = rows.map((row) => row.map((c) => strip(blocks(c, refs)).replaceAll("\n", " ")));
        const width = Math.max(...cells.map((r) => r.length));
        cells = cells.map((r) => [...r, ...Array(width - r.length).fill("")]);
        lines.push("| " + cells[0].join(" | ") + " |");
        lines.push("|" + " --- |".repeat(width));
        for (const r of cells.slice(1)) lines.push("| " + r.join(" | ") + " |");
        lines.push("");
      }
    } else if (t === "row") {
      for (const col of n.columns ?? []) lines.push(blocks(col.content, refs, depth));
    } else if (t === "tabNavigator") {
      for (const tab of n.tabs ?? []) {
        lines.push(`\n**${tab.title ?? ""}**\n`);
        lines.push(blocks(tab.content, refs, depth));
      }
    } else if (t === "links") {
      for (const i of n.items ?? []) {
        const r = refs[i] ?? {};
        lines.push(`${pad}- [${r.title ?? i}](${absolute(r.url ?? "")})`);
      }
      lines.push("");
    } else if (t === "codeListing") lines.push("```\n" + (n.code ?? []).join("\n") + "\n```\n");
    else if (t === "termList") {
      for (const item of n.items ?? []) {
        const term = inline(item.term?.inlineContent, refs);
        lines.push(`${pad}- **${term}**: ${strip(blocks(item.definition?.content, refs))}`);
      }
      lines.push("");
    } else if (t === "small") lines.push(pad + inline(n.inlineContent, refs) + "\n");
    else if ("inlineContent" in n) lines.push(pad + inline(n.inlineContent, refs) + "\n");
    else if ("content" in n) lines.push(blocks(n.content, refs, depth));
  }
  return lines.join("\n");
}

function topicLinks(ids: string[] | undefined, refs: any) {
  return (ids ?? []).map((i) => `- [${refs[i]?.title ?? i}](${SITE}${refs[i]?.url ?? ""})`);
}

function pageMarkdown(path: string, d: any) {
  const refs = d.references ?? {};
  const md = [`# ${d.metadata?.title ?? path}\n`, `Source: ${SITE}${path}\n`];
  const abstract = inline(d.abstract, refs);
  if (abstract) md.push(`_${abstract}_\n`);
  for (const sec of d.primaryContentSections ?? []) md.push(blocks(sec.content, refs));
  for (const ts of d.topicSections ?? []) {
    if (ts.title) md.push(`\n## ${ts.title}\n`);
    md.push(...topicLinks(ts.identifiers, refs));
  }
  for (const s of d.seeAlsoSections ?? []) {
    md.push(`\n## ${s.title ?? "See also"}\n`);
    md.push(...topicLinks(s.identifiers, refs));
  }
  return strip(md.join("\n").replaceAll("\n\n\n", "\n\n")) + "\n";
}

function* children(d: any) {
  const refs = d.references ?? {};
  for (const ts of d.topicSections ?? [])
    for (const i of ts.identifiers ?? []) {
      const url: string = refs[i]?.url ?? "";
      if (url.startsWith(ROOT)) yield url;
    }
}

// How argparse reads one argument: null for a value, else the options it can name and its "=value".
function optionOf(a: string, options: string[]) {
  if (!/^-./.test(a)) return null;
  const long = a.startsWith("--");
  const eq = long ? a.indexOf("=") : a[2] === "=" ? 2 : -1;
  const name = eq < 0 ? a : a.slice(0, eq), value = eq < 0 ? null : a.slice(eq + 1);
  const found = !long ? (a.startsWith("-h") ? ["--help"] : []) : options.includes(name) ? [name] : options.filter((o) => o.startsWith(name));
  // Unmatched "-1" and strings with spaces are values.
  if (!found.length && (/^-(\d+|\d*\.\d+)$/.test(a) || a.includes(" "))) return null;
  return { found, value };
}

const OPTIONS = ["--help", "--out"];

// The command line of the original argparse version, with its messages.
function parseArgs(argv: string[]) {
  const prog = basename(process.argv[1]);
  const usage = `usage: ${prog} [-h] [--out OUT]\n`;
  const fail = (msg: string): never => {
    writeSync(2, `${usage}${prog}: error: ${msg}\n`);
    process.exit(2);
  };
  let out = join(homedir(), ".cache/apple-design/hig");
  const extras: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--") { extras.push(...argv.slice(i + 1)); break; }
    const { found, value } = optionOf(a, OPTIONS) ?? { found: [], value: null };
    if (found.length > 1) fail(`ambiguous option: ${a} could match ${found.join(", ")}`);
    const option = found[0];
    if (option === "--help") {
      if (value !== null) fail(`argument -h/--help: ignored explicit argument '${value}'`);
      writeSync(1, `${usage}\noptions:\n  -h, --help  show this help message and exit\n  --out OUT\n`);
      process.exit(0);
    } else if (option === "--out") {
      if (value !== null) out = value;
      else if (i + 1 < argv.length && !optionOf(argv[i + 1], OPTIONS)) out = argv[++i];
      else fail("argument --out: expected one argument");
    } else extras.push(a);
  }
  if (extras.length) fail(`unrecognized arguments: ${extras.join(" ")}`);
  return out;
}

const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 10);

async function main() {
  const outDir = parseArgs(process.argv.slice(2));
  const seen = new Set<string>();
  const queue: [string, number][] = [[ROOT, 0]];
  const index: [number, string, string, string][] = [];
  while (queue.length) {
    const [path, depth] = queue.shift()!;
    if (seen.has(path)) continue;
    seen.add(path);
    const d = await fetchPage(path);
    if (d == null) continue;
    // Not "index": on a case-insensitive filesystem INDEX.md would overwrite it.
    const rel = path.slice(ROOT.length).replace(/^\/+|\/+$/g, "") || "human-interface-guidelines";
    const file = join(outDir, rel + ".md");
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, pageMarkdown(path, d));
    index.push([depth, d.metadata?.title ?? rel, rel, inline(d.abstract, d.references ?? {})]);
    for (const child of children(d)) if (!seen.has(child)) queue.push([child, depth + 1]);
    await sleep(0.15);
  }
  index.sort((a, b) => (a[2] < b[2] ? -1 : a[2] > b[2] ? 1 : 0));
  const lines = index.map(([, title, rel, abstract]) => `- \`${rel}.md\` **${title}** — ${abstract}\n`);
  writeFileSync(join(outDir, "INDEX.md"), `# HIG mirror (${today()}, ${index.length} pages)\n\n${lines.join("")}`);
  writeSync(1, `${index.length} pages -> ${outDir}\n`);
}

await main();
