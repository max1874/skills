#!/usr/bin/env node
const usage = `Coverage ledger for reading a repository: one row per file in it, recording its group, whether it was read, and why.

Usage (every path is an argument; keep the script out of the repository being read and run it with node):
  ledger.ts init    <repo dir> <work dir>                        list every file and its line count; binaries, lockfiles and generated files start as "skip"
  ledger.ts assign  <work dir> <rules.json>                      by the rules, put "unassigned" files into groups or mark them "skip"
  ledger.ts lists   <work dir>                                   write one file list groups/<group>.txt per group; print each group's file and line counts
  ledger.ts mark    <work dir> <group> <status> <reason> [path…]  change the status of a group (or some of its files), e.g. to "read"
  ledger.ts summary <work dir>                                   totals for the coverage statement; exits 1 while any file is "unassigned" or "to-read"

The rules file is a list; the first rule that matches, from the top, wins; patterns use fnmatch (* can cross directories):
  [{"pattern": "agent/src/backtest/*", "group": "G1", "status": "to-read"},
   {"pattern": "frontend/*", "status": "skip", "reason": "frontend UI, not relevant to us"}]
`;
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

type Row = Record<(typeof FIELDS)[number], string>;
type Rule = { pattern: string; group?: string; status?: string; reason?: string };

const FIELDS = ["path", "lines", "bytes", "group", "status", "reason"] as const;
const SKIP_DIRS = new Set([".git", "node_modules", ".venv", "venv", "__pycache__", "dist", "build", "vendor", ".next", "target"]);
const LOCKFILES = new Set(["package-lock.json", "pnpm-lock.yaml", "yarn.lock", "uv.lock", "poetry.lock", "Cargo.lock",
  "Gemfile.lock", "composer.lock", "go.sum", "Pipfile.lock", "bun.lockb"]);

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

const ledgerPath = (work: string) => join(work, "ledger.csv");
const sum = (rows: Row[]) => rows.reduce((total, r) => total + Number(r.lines), 0);
const commas = (n: number) => n.toLocaleString("en-US");
const repr = (s: string) => s.includes("'") && !s.includes('"')
  ? `"${s.replace(/\\/g, "\\\\")}"` : `'${s.replace(/[\\']/g, "\\$&")}'`;

/** Python's `.0%`: the float rounds half to even. */
function percent(fraction: number) {
  const p = fraction * 100, n = Math.round(p);
  return `${p % 1 === 0.5 && n % 2 ? n - 1 : n}%`;
}

/** The ledger as Python's csv module writes it: \r\n rows, fields quoted only when needed. */
function load(work: string): Row[] {
  const records: string[][] = [];
  let record: string[] = [], field = "", quoted = false;
  const text = readFileSync(ledgerPath(work), "utf8");
  for (let i = 0; i < text.length; i++) {
    const c = text[i]!;
    if (quoted) {
      if (c !== '"') field += c;
      else if (text[i + 1] === '"') field += c, i++;
      else quoted = false;
    } else if (c === '"') quoted = true;
    else if (c === ",") record.push(field), field = "";
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      records.push([...record, field]);
      record = [], field = "";
    } else field += c;
  }
  const [header, ...rest] = records;
  return rest.map((values) => Object.fromEntries(header!.map((key, i) => [key, values[i]])) as Row);
}

function save(work: string, rows: Row[]) {
  const quote = (v: string) => /[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  const lines = [FIELDS, ...rows.map((r) => FIELDS.map((f) => r[f]))].map((values) => values.map(quote).join(","));
  writeFileSync(ledgerPath(work), lines.map((line) => line + "\r\n").join(""));
}

/** fnmatch.translate: `*` crosses directories, `[...]` follows Python's rules for `!`, `]` and ranges. */
function matcher(pattern: string) {
  const pat = [...pattern], n = pat.length;
  let re = "";
  for (let i = 0; i < n;) {
    const c = pat[i++]!;
    if (c === "*") {
      re += ".*";
      while (pat[i] === "*") i++;
    } else if (c === "?") re += ".";
    else if (c === "[") {
      let j = i;
      if (pat[j] === "!") j++;
      if (pat[j] === "]") j++;
      while (j < n && pat[j] !== "]") j++;
      if (j >= n) {
        re += "\\[";
        continue;
      }
      const chunks: string[] = [];
      let k = pat[i] === "!" ? i + 2 : i + 1;
      while ((k = pat.indexOf("-", k)) >= 0 && k < j) {
        chunks.push(pat.slice(i, k).join(""));
        i = k + 1;
        k += 3;
      }
      const last = pat.slice(i, j).join("");
      if (last) chunks.push(last);
      else chunks[chunks.length - 1] += "-";
      for (let m = chunks.length - 1; m > 0; m--) {
        if (chunks[m - 1]!.at(-1)! > chunks[m]![0]!) {
          chunks[m - 1] = chunks[m - 1]!.slice(0, -1) + chunks[m]!.slice(1);
          chunks.splice(m, 1);
        }
      }
      const stuff = chunks.map((s) => s.replace(/[\\-]/g, "\\$&")).join("-").replace(/]/g, "\\]");
      i = j + 1;
      if (!stuff) re += "(?!)";
      else if (stuff === "!") re += ".";
      else re += `[${stuff[0] === "!" ? "^" + stuff.slice(1) : "^[".includes(stuff[0]!) ? "\\" + stuff : stuff}]`;
    } else re += c.replace(/[\\^$.*+?()[\]{}|]/g, "\\$&");
  }
  const regex = new RegExp(`^(?:${re})$`, "su");
  return (path: string) => regex.test(path);
}

/** Default rules: binaries, lockfiles and minified output are skipped outright; everything else waits to be grouped. */
function classify(file: string, name: string): [number, number, string, string] {
  const data = readFileSync(file);
  if (data.subarray(0, 8192).includes(0)) return [0, data.length, "skip", "binary"];
  let lines = data.length && data.at(-1) !== 10 ? 1 : 0;
  for (let i = data.indexOf(10); i >= 0; i = data.indexOf(10, i + 1)) lines++;
  if (LOCKFILES.has(name)) return [lines, data.length, "skip", "dependency lockfile"];
  if ([".min.js", ".min.css", ".map"].some((ext) => name.endsWith(ext))) return [lines, data.length, "skip", "minified or generated output"];
  return [lines, data.length, "unassigned", ""];
}

/** Regular files under dir, not following symlinks or entering SKIP_DIRS; like pathlib's glob, skips what cannot be listed. */
function* walk(dir: string, rel = ""): Generator<[string, string]> {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const path = rel + entry.name;
    if (entry.isDirectory() && !SKIP_DIRS.has(entry.name)) yield* walk(join(dir, entry.name), path + "/");
    else if (entry.isFile()) yield [path, entry.name];
  }
}

function cmdInit(repo: string, work: string) {
  repo = resolve(repo);
  if (!statSync(repo, { throwIfNoEntry: false })?.isDirectory()) fail(`not a directory: ${repo}`);
  mkdirSync(work, { recursive: true });
  // Python sorts paths component by component; NUL sorts below every character a file name can hold.
  const key = (path: string) => path.replaceAll("/", "\0");
  const files = [...walk(repo)].sort(([a], [b]) => key(a) < key(b) ? -1 : 1);
  const rows = files.map(([path, name]): Row => {
    const [lines, size, status, reason] = classify(join(repo, path), name);
    return { path, lines: String(lines), bytes: String(size), group: "", status, reason };
  });
  save(work, rows);
  console.log(`${rows.length} files → ${ledgerPath(work)} (skipped directories: ${[...SKIP_DIRS].sort().join(", ")})`);
  cmdSummary(work, true);
}

function cmdAssign(work: string, rulesFile: string) {
  const rules: Rule[] = JSON.parse(readFileSync(rulesFile, "utf8"));
  const matches = rules.map((rule) => matcher(rule.pattern));
  const rows = load(work), hit = rules.map(() => 0);
  for (const r of rows) {
    if (r.status !== "unassigned") continue;
    const i = matches.findIndex((match) => match(r.path));
    if (i < 0) continue;
    const rule = rules[i]!;
    r.group = rule.group ?? "";
    r.status = rule.status ?? (rule.group ? "to-read" : "skip");
    r.reason = rule.reason ?? "";
    if (r.status === "skip" && !r.reason) fail(`Rule ${i} (${rule.pattern}) marks files "skip" without a reason`);
    hit[i]!++;
  }
  save(work, rows);
  rules.forEach((rule, i) => console.log(`${String(hit[i]).padStart(6)}  ${rule.pattern}` + (hit[i] ? "" : "    ← matched no files")));
  cmdSummary(work, true);
}

function cmdLists(work: string) {
  const groups = Map.groupBy(load(work).filter((r) => r.group), (r) => r.group);
  const out = join(work, "groups");
  mkdirSync(out, { recursive: true });
  for (const g of [...groups.keys()].sort()) {
    const rs = groups.get(g)!;
    writeFileSync(join(out, `${g}.txt`), rs.map((r) => `${r.path}\t${r.lines}\n`).join(""));
    console.log(`${g.padEnd(12)} ${String(rs.length).padStart(5)} files ${String(sum(rs)).padStart(8)} lines → groups/${g}.txt`);
  }
}

function cmdMark(work: string, group: string, status: string, reason: string, paths: string[]) {
  const rows = load(work), inGroup = rows.filter((r) => r.group === group);
  const targets = inGroup.filter((r) => !paths.length || paths.includes(r.path));
  const missing = [...new Set(paths)].filter((p) => !inGroup.some((r) => r.path === p)).sort();
  if (missing.length) fail(`These paths are not in group ${group}: [${missing.map(repr).join(", ")}]`);
  for (const r of targets) r.status = status, r.reason = reason;
  save(work, rows);
  console.log(`Group ${group}: ${targets.length} files set to "${status}"`);
}

function cmdSummary(work: string, quietExit = false) {
  const rows = load(work);
  const byStatus = Map.groupBy(rows, (r) => r.status);
  const byReason = Map.groupBy(rows.filter((r) => r.status === "skip"), (r) => r.reason);
  const text = sum(rows);
  console.log(`${rows.length} files, ${commas(text)} lines of text`);
  for (const s of [...byStatus.keys()].sort()) {
    const rs = byStatus.get(s)!, l = sum(rs);
    console.log(`  ${s}: ${rs.length} files, ${commas(l)} lines` + (text ? ` (${percent(l / text)} of text)` : ""));
  }
  if (byReason.size) {
    console.log("Reasons for skipping:");
    for (const [reason, rs] of [...byReason].sort(([, a], [, b]) => sum(b) - sum(a))) {
      console.log(`  ${commas(sum(rs)).padStart(9)} lines ${String(rs.length).padStart(5)} files  ${reason}`);
    }
  }
  const open = (byStatus.get("unassigned")?.length ?? 0) + (byStatus.get("to-read")?.length ?? 0);
  if (open && !quietExit) {
    console.log(`${open} files are still unassigned or unread; the coverage statement cannot be written yet`);
    process.exit(1);
  }
}

function main(argv: string[]) {
  const cmds: Record<string, [(...args: string[]) => void, number]> = {
    init: [cmdInit, 2], assign: [cmdAssign, 2], lists: [cmdLists, 1], summary: [(work) => cmdSummary(work), 1],
  };
  if (argv[1] === "mark" && argv.length >= 6) return cmdMark(argv[2]!, argv[3]!, argv[4]!, argv[5]!, argv.slice(6));
  const cmd = Object.hasOwn(cmds, argv[1] ?? "") ? cmds[argv[1]!] : undefined;
  if (!cmd || argv.length - 2 !== cmd[1]) fail(usage);
  cmd[0](...argv.slice(2));
}

main(process.argv.slice(1));
