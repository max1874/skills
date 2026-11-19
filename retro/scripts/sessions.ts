#!/usr/bin/env node
const usage = `Read Claude Code and Codex session logs as plain dialogue (user and assistant text; tool calls with --tools).

Usage:
  node sessions.ts list [--since 7d] [--until WHEN]
  node sessions.ts dump --codex <thread name, substring or id prefix> [--since WHEN] [--tools] [--out FILE]
  node sessions.ts dump --claude <session id prefix or jsonl path> [--since WHEN] [--tools] [--out FILE]

  WHEN is 7d, 36h, 2026-10-01 or 2026-10-01T08:00 (local time).
  --tools adds each tool call as one line between the messages: the tool, its main argument, the start of its result.

Where the logs live:
  Claude Code  ~/.claude/projects/<cwd slug>/<session id>.jsonl
  Codex        ~/.codex/sessions/YYYY/MM/DD/rollout-<ts>-<thread id>[_<fork>].jsonl
               ~/.codex/session_index.jsonl maps thread id to thread_name

Needs Node.js 22.18+. Other scripts can import the readers (claudeSessions, codexSessions) instead of running it.
`;
import { closeSync, globSync, openSync, readSync, realpathSync, statSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

type Json = Record<string, any>;
export type Msg = { ts: number; role: string; text: string };
/** kind: "interactive" (a person in the loop), "exec" (codex exec or claude -p, prompted by a script or another
 * agent) or "subagent" (Codex guardian, review and spawned threads). */
export type Session = { host: string; sid: string; name: string; path: string; kind: "interactive" | "exec" | "subagent"; msgs: Msg[] };
export type Window = { since?: number; until?: number };

const home = homedir();
const claudeRoot = join(home, ".claude", "projects");
const codexRoot = join(home, ".codex", "sessions");
const codexIndex = join(home, ".codex", "session_index.jsonl");

function fail(message: string, code = 1): never {
  console.error(message);
  process.exit(code);
}

// Lengths and cuts count code points (an emoji is one character), and strip removes what Python's str.strip
// does (\s without U+FEFF, plus U+001C-U+001F and U+0085): the output matches the Python reader this replaced.
const chars = (s: string) => s.length - (s.match(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g)?.length ?? 0);
const head = (s: string, n: number) => Array.from(s.slice(0, 2 * n)).slice(0, n).join("");
const pad = (s: string, n: number) => s + " ".repeat(Math.max(0, n - chars(s)));
const space = String.raw`(?:(?!${String.fromCharCode(0xfeff)})\s|[\x1C-\x1F\x85])+`;
const edges = new RegExp(`^${space}|${space}$`, "g");
const strip = (s: string) => s.replace(edges, "");
const isObject = (x: unknown): x is Json => typeof x === "object" && x !== null && !Array.isArray(x);

function record(line: string): Json | undefined {
  try {
    const d = JSON.parse(line);
    return isObject(d) ? d : undefined;
  } catch {
    return undefined;
  }
}

/** Lines of a file read in chunks, so a log of any size takes little memory. */
function* lines(path: string) {
  const fd = openSync(path, "r"), chunk = Buffer.allocUnsafe(1 << 24);
  let rest: Buffer[] = [];
  try {
    for (let n; (n = readSync(fd, chunk)) > 0; ) {
      const b = chunk.subarray(0, n);
      let start = 0;
      for (let end; (end = b.indexOf(10, start)) >= 0; start = end + 1) {
        yield Buffer.concat([...rest, b.subarray(start, end)]).toString();
        rest = [];
      }
      rest.push(Buffer.from(b.subarray(start)));
    }
    if (rest.some((part) => part.length)) yield Buffer.concat(rest).toString();
  } finally {
    closeSync(fd);
  }
}

function parseTs(s: unknown) {
  const t = typeof s === "string" ? Date.parse(s) : NaN;
  return Number.isNaN(t) ? undefined : t;
}

export function parseSince(s: string) {
  const m = /^(\d+)([dh])$/.exec(s);
  if (m) return Date.now() - Number(m[1]) * (m[2] === "d" ? 86_400_000 : 3_600_000);
  const t = Date.parse(/^\d{4}-\d{2}-\d{2}$/.test(s) ? `${s}T00:00` : s); // a bare date is local midnight
  return Number.isNaN(t) ? fail(`cannot read the time ${s}; use 7d, 36h, 2026-10-01 or 2026-10-01T08:00`, 2) : t;
}

export function local(ts: number, withYear = false) {
  const d = new Date(ts), p = (n: number) => String(n).padStart(2, "0");
  return `${withYear ? `${d.getFullYear()}-` : ""}${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

const inWindow = (ts: number | undefined, w: Window): ts is number =>
  ts !== undefined && !(w.since !== undefined && ts < w.since) && !(w.until !== undefined && ts > w.until);
const stale = (path: string, w: Window) => w.since !== undefined && statSync(path).mtimeMs < w.since;
const byTime = (a: Msg, b: Msg) => a.ts - b.ts;

// --- Tool calls (dump --tools) --------------------------------------------------

let withTools = false;
const oneLine = (s: string, n: number) => {
  const t = s.replace(/\s+/g, " ").trim();
  return chars(t) <= n ? t : `${head(t, n)}…`;
};
const mainArgs = ["command", "cmd", "file_path", "path", "pattern", "url", "query", "description"];
const outputText = (c: unknown): string =>
  typeof c === "string" ? c : Array.isArray(c) ? c.map((x) => (isObject(x) ? outputText(x.text ?? x.content) : "")).join(" ") : "";

/** Tool calls as one-line messages, each completed by its result when that arrives. */
function toolLog(msgs: Msg[]) {
  const open = new Map<string, Msg>();
  return {
    call(id: string, ts: number, name: string, input: unknown) {
      const args = (typeof input === "string" && record(input)) || input;
      const arg = isObject(args) ? mainArgs.map((k) => args[k]).find((v) => typeof v === "string") ?? JSON.stringify(args) : String(args ?? "");
      const m = { ts, role: "tool", text: `${name} ${oneLine(arg, 300)}` };
      msgs.push(m);
      open.set(id, m);
    },
    result(id: string, output: unknown, failed = false) {
      const m = open.get(id);
      if (m) m.text += ` → ${failed ? "✗ " : ""}${oneLine(outputText(output), 200)}`;
      open.delete(id);
    },
  };
}

// --- Claude Code -------------------------------------------------------------

const claudeText = (c: unknown) =>
  strip(typeof c === "string" ? c : Array.isArray(c) ? c.filter((x) => isObject(x) && x.type === "text").map((x) => x.text ?? "").join("\n") : "");

/** Text of a real user message, or nothing for tool results and injected turns. */
function claudeUserText(d: Json) {
  const c = d.message?.content;
  if (d.isMeta || (Array.isArray(c) && c.some((x) => isObject(x) && x.type === "tool_result"))) return;
  const txt = claudeText(c), start = head(txt, 200);
  if (!txt || txt.startsWith("<") || start.includes("<command-name>") || start.includes("<local-command")) return;
  return txt;
}

/** Every session under ~/.claude/projects (symlinked project folders are not followed), or only the given files. */
export function* claudeSessions(w: Window, paths = globSync(join(claudeRoot, "*", "*.jsonl")).sort()) {
  const seen = new Set<string>();
  for (const path of paths) {
    const sid = basename(path).slice(0, -".jsonl".length);
    if (seen.has(sid)) continue;
    seen.add(sid);
    if (stale(path, w)) continue;
    const s: Session = { host: "claude", sid, name: basename(dirname(path)), path, kind: "interactive", msgs: [] };
    const log = withTools ? toolLog(s.msgs) : undefined;
    let cwd = "";
    for (const line of lines(path)) {
      if (!line.includes('"type":"user"') && !line.includes('"type":"assistant"')) continue;
      const d = record(line);
      if (!d || (d.type !== "user" && d.type !== "assistant")) continue;
      const ts = parseTs(d.timestamp);
      if (!inWindow(ts, w)) continue;
      if (!cwd && d.cwd) cwd = d.cwd;
      if (String(d.entrypoint ?? "").startsWith("sdk")) s.kind = "exec";
      const text = d.type === "user" ? claudeUserText(d) : claudeText(d.message?.content);
      if (text) s.msgs.push({ ts, role: d.type, text });
      const parts = d.message?.content;
      if (log && Array.isArray(parts))
        for (const c of parts.filter(isObject)) {
          if (c.type === "tool_use") log.call(c.id, ts, c.name, c.input);
          else if (c.type === "tool_result") log.result(c.tool_use_id, c.content, c.is_error === true);
        }
    }
    if (!s.msgs.length) continue;
    s.msgs.sort(byTime);
    if (cwd) s.name = cwd.replaceAll(home, "~");
    yield s;
  }
}

// --- Codex -------------------------------------------------------------------

function codexThreadNames() {
  const names = new Map<string, string>();
  try {
    for (const line of lines(codexIndex)) {
      const d = record(line);
      if (d?.id && d.thread_name) names.set(d.id, d.thread_name);
    }
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
  }
  return names;
}

const request = "## My request:";

function codexUserText(raw: string) {
  const txt = strip(raw);
  if (txt.includes(request)) return strip(txt.slice(txt.indexOf(request) + request.length)) || undefined;
  return txt && !txt.startsWith("<") && !txt.startsWith("# AGENTS.md") ? txt : undefined;
}

/** Every rollout under ~/.codex/sessions, or only the given files. */
export function* codexSessions(w: Window, paths = globSync(join(codexRoot, "*", "*", "*", "*.jsonl")).sort()) {
  const names = codexThreadNames();
  for (const path of paths) {
    if (stale(path, w)) continue;
    const base = basename(path);
    const sid = /-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/.exec(base)?.[1] ?? base;
    const s: Session = { host: "codex", sid, name: names.get(sid) ?? base, path, kind: "interactive", msgs: [] };
    const log = withTools ? toolLog(s.msgs) : undefined;
    let meta = false;
    for (const line of lines(path)) {
      if (!line.includes('"response_item"') && !line.includes('"session_meta"')) continue;
      const d = record(line), p = d?.payload;
      if (!d || !isObject(p)) continue;
      if (d.type === "session_meta") {
        // a spawned thread also carries its parent's meta later on; the first one is its own
        if (!meta) s.kind = typeof p.source !== "string" ? "subagent" : p.source === "exec" ? "exec" : "interactive";
        meta = true;
        continue;
      }
      const ts = parseTs(d.timestamp);
      if (!inWindow(ts, w)) continue;
      if (log && d.type === "response_item") {
        if (p.type === "function_call" || p.type === "custom_tool_call") log.call(p.call_id, ts, p.name, p.arguments ?? p.input);
        else if (p.type === "function_call_output" || p.type === "custom_tool_call_output") log.result(p.call_id, p.output);
        else if (p.type === "web_search_call") log.call(p.id, ts, "web_search", p.action ?? {});
      }
      if (p.type !== "message" || (p.role !== "user" && p.role !== "assistant")) continue;
      const raw = (Array.isArray(p.content) ? p.content : []).filter(isObject).map((c: Json) => c.text ?? "").join("\n");
      const text = p.role === "user" ? codexUserText(raw) : strip(raw) || undefined;
      if (text) s.msgs.push({ ts, role: p.role, text });
    }
    if (!s.msgs.length) continue;
    s.msgs.sort(byTime);
    yield s;
  }
}

// --- CLI ---------------------------------------------------------------------

function findCodex(key: string) {
  const names = [...codexThreadNames()];
  let ids = names.filter(([id, name]) => name === key || id.startsWith(key));
  if (!ids.length) ids = names.filter(([, name]) => name.includes(key));
  return ids.map(([id]) => id).sort();
}

function findClaude(key: string) {
  if (statSync(key, { throwIfNoEntry: false })?.isFile()) return [key];
  return globSync(join(claudeRoot, "*", `${key}*.jsonl`)).sort();
}

function dumpMarkdown(sessions: Session[], maxChars = 6000) {
  const cut = (t: string) => (chars(t) <= maxChars ? t : `${head(t, maxChars)}\n...[truncated, ${chars(t)} chars]`);
  return sessions
    .map((s) =>
      `\n# [${s.host}] ${s.name}  (${s.sid.slice(0, 8)}, ${s.path.replaceAll(home, "~")})\n` +
      s.msgs.map((m) => m.role === "tool"
        ? `\n- ${local(m.ts).slice(6)} ${m.text}\n`
        : `\n---\n## [${m.role}] ${local(m.ts, true)}\n${cut(m.text)}\n`).join(""))
    .join("");
}

const commands = {
  list: { since: { type: "string", default: "7d" }, until: { type: "string" } },
  dump: { codex: { type: "string" }, claude: { type: "string" }, since: { type: "string" }, out: { type: "string" }, tools: { type: "boolean" } },
} as const;

function main([cmd, ...args]: string[]) {
  if (cmd === "-h" || cmd === "--help") console.log(usage), process.exit(0);
  if (cmd !== "list" && cmd !== "dump") fail(usage, 2);
  let opt: Partial<Record<"since" | "until" | "codex" | "claude" | "out", string>> & { help?: boolean; tools?: boolean };
  try {
    opt = parseArgs({ args, options: { ...commands[cmd], help: { type: "boolean", short: "h" } } }).values;
  } catch (e) {
    fail(`${(e as Error).message}\n\n${usage}`, 2);
  }
  if (opt.help) console.log(usage), process.exit(0);
  const since = opt.since ? parseSince(opt.since) : undefined;
  withTools = !!opt.tools;

  if (cmd === "list") {
    const w = { since, until: opt.until ? parseSince(opt.until) : undefined };
    const rows: [number, string, string, string, string, string, number, number][] = [];
    for (const s of [claudeSessions(w), codexSessions(w)].values().flatMap((it) => it)) {
      const user = s.msgs.filter((m) => m.role === "user").length;
      const first = s.msgs[0]!.ts, last = s.msgs.at(-1)!.ts;
      rows.push([first, s.host, s.name, s.sid.slice(0, 8), local(first), local(last), user, s.msgs.length - user]);
    }
    rows.sort((a, b) => {
      for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i]! < b[i]! ? -1 : 1;
      return 0;
    });
    console.log(`${pad("host", 6)} ${pad("session", 52)} ${pad("id", 8)} ${pad("first", 11)} ${pad("last", 11)} ${"user".padStart(5)} ${"asst".padStart(5)}`);
    for (const [, host, name, id, first, last, user, asst] of rows)
      console.log(`${pad(host, 6)} ${pad(head(name, 52), 52)} ${pad(id, 8)} ${pad(first, 11)} ${pad(last, 11)} ${String(user).padStart(5)} ${String(asst).padStart(5)}`);
    return;
  }
  const w = { since };
  let sessions: Session[];
  if (opt.codex) {
    const ids = findCodex(opt.codex);
    if (!ids.length) fail(`no Codex thread matches '${opt.codex}'`);
    // the thread id is in the rollout's file name, so only the matching files are read
    sessions = [...codexSessions(w, ids.flatMap((id) => globSync(join(codexRoot, "*", "*", "*", `*${id}*.jsonl`))).sort())];
  } else if (opt.claude) {
    const paths = findClaude(opt.claude);
    if (!paths.length) fail(`no Claude session matches '${opt.claude}'`);
    sessions = [...claudeSessions(w, paths)];
  } else {
    fail(`dump needs --codex or --claude\n\n${usage}`, 2);
  }
  const md = dumpMarkdown(sessions);
  if (opt.out) {
    writeFileSync(opt.out, md);
    console.log(`wrote ${opt.out} (${chars(md)} chars, ${sessions.reduce((n, s) => n + s.msgs.length, 0)} messages)`);
  } else {
    process.stdout.write(md);
  }
}

// Run as a command, not when imported (argv[1] keeps the path it was run by, which may be a link).
if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) main(process.argv.slice(2));
