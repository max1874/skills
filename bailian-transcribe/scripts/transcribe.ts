#!/usr/bin/env node
const usage = `Transcribe an audio or video file with Alibaba Cloud Model Studio (Bailian) Qwen-Audio file transcription.

Usage:
  node transcribe.ts <file> [-o DIR] [-l LANG] [--hotwords FILE] [--terms FILE]... [--model MODEL]

  -o, --out DIR      where <name>.txt, .srt and .json go (default: beside the input); existing files are never overwritten
  -l, --lang LANG    language hint such as zh or en; zh also keeps English hotwords working
  --hotwords FILE    one term per line (# starts a comment): biases recognition toward these names
  --terms FILE       wrong<TAB>right per line: replaced after recognition; repeatable, applied in order
  --model MODEL      default qwen-audio-3.1-asr-flash-filetrans

Needs ffmpeg, Node.js 22.18+ and DASHSCOPE_API_KEY. DASHSCOPE_BASE_URL overrides the endpoint
(default https://dashscope.aliyuncs.com; a workspace's own domain also works).
`;
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, extname, join, resolve } from "node:path";
import { parseArgs } from "node:util";

type Segment = { start: number; end: number; text: string; speaker?: number };

// The service's hotword limits: at most 15 characters with any non-ASCII, else at most 7 words.
const tooLong = (w: string) => /^[\x00-\x7f]*$/.test(w) ? w.split(/\s+/).length > 7 : [...w].length > 15;
const HOTWORD_WEIGHT = 4; // the documentation suggests 4 on its 1–5 scale
const POLL_MS = 5000, MAX_WAIT_MS = 3600_000; // 51 minutes of audio took 77 s

function fail(message: string): never {
  console.error(`bailian-transcribe: ${message}`);
  process.exit(1);
}

const { values: opt, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    out: { type: "string", short: "o" }, lang: { type: "string", short: "l" },
    hotwords: { type: "string" }, terms: { type: "string", multiple: true, default: [] },
    model: { type: "string", default: "qwen-audio-3.1-asr-flash-filetrans" }, help: { type: "boolean", short: "h" },
  },
});
if (opt.help) console.log(usage), process.exit(0);
if (positionals.length !== 1) fail(`give one file\n\n${usage}`);

const input = resolve(positionals[0]!);
if (!existsSync(input)) fail(`no such file: ${input}`);
const key = process.env.DASHSCOPE_API_KEY || fail("set DASHSCOPE_API_KEY");
const base = (process.env.DASHSCOPE_BASE_URL || "https://dashscope.aliyuncs.com").replace(/\/$/, "");
const stem = join(resolve(opt.out ?? dirname(input)), basename(input, extname(input)));
const outputs = ["txt", "srt", "json"].map((ext) => `${stem}.${ext}`);
const taken = outputs.filter(existsSync);
if (taken.length) fail(`would overwrite ${taken.join(", ")}; pass another -o`);
try {
  mkdirSync(dirname(stem), { recursive: true }); // before anything is billed
} catch (e: any) {
  fail(`cannot create ${dirname(stem)}: ${e.code}`);
}

const lines = (file: string) => readFileSync(file, "utf8").split(/\r?\n/);
const hotwords = opt.hotwords ? lines(opt.hotwords).map((l) => l.split("#")[0]!.trim()).filter(Boolean) : [];
const skipped = hotwords.filter(tooLong);
// A third column (`wrong<TAB>right<TAB># why`) is a comment.
const rules = opt.terms.flatMap((file) => lines(file).flatMap((l) => {
  const [wrong, right] = l.split("\t");
  return l.trimStart().startsWith("#") || !wrong || !right || right.startsWith("#") ? [] : [[wrong, right] as const];
}));

async function api(path: string, body?: object, headers: Record<string, string> = {}) {
  const res = await fetch(base + path, {
    method: body ? "POST" : "GET", body: body && JSON.stringify(body),
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...headers },
  });
  if (!res.ok) fail(`${path.split("?")[0]} → ${res.status} ${(await res.text()).slice(0, 600)}`);
  return res.json();
}

// The service transcribes one channel, and the model takes 16 kHz: send a small mono clip, not the video.
const tmp = mkdtempSync(join(tmpdir(), "bailian-transcribe-"));
const clip = join(tmp, "audio.m4a");
try {
  execFileSync("ffmpeg", ["-nostdin", "-v", "error", "-y", "-i", input, "-vn", "-ac", "1", "-ar", "16000",
    "-c:a", "aac", "-b:a", "48k", clip], { stdio: ["ignore", "ignore", "pipe"] });
} catch (e: any) {
  rmSync(tmp, { recursive: true });
  fail(e.code === "ENOENT" ? "ffmpeg is not installed" : `ffmpeg: ${String(e.stderr).trim().slice(-400)}`);
}

// Upload to the service's own temporary storage (valid 48 hours), so no bucket of your own is needed.
const policy = (await api(`/api/v1/uploads?action=getPolicy&model=${opt.model}`)).data;
const objectKey = `${policy.upload_dir}/${crypto.randomUUID()}.m4a`;
const form = new FormData();
for (const [name, value] of Object.entries({
  OSSAccessKeyId: policy.oss_access_key_id, Signature: policy.signature, policy: policy.policy,
  "x-oss-object-acl": policy.x_oss_object_acl, "x-oss-forbid-overwrite": policy.x_oss_forbid_overwrite,
  key: objectKey, success_action_status: "200",
})) form.append(name, value);
form.append("file", new Blob([readFileSync(clip)], { type: "audio/mp4" }), "audio.m4a"); // the file must come last
rmSync(tmp, { recursive: true });
const upload = await fetch(policy.upload_host, { method: "POST", body: form });
if (!upload.ok) fail(`upload → ${upload.status} ${(await upload.text()).slice(0, 400)}`);

const lang = opt.lang && ({ chinese: "zh", mandarin: "zh", english: "en" }[opt.lang.toLowerCase()] ?? opt.lang);
const started = Date.now();
const task = await api("/api/v1/services/audio/asr/transcription", {
  model: opt.model,
  input: { file_urls: [`oss://${objectKey}`] },
  parameters: {
    channel_id: [0], diarization_enabled: true,
    // With language hints set, only hotwords in those languages apply; Chinese talks name English terms.
    ...(lang && { language_hints: lang === "zh" ? ["zh", "en"] : [lang] }),
    ...(hotwords.length && { vocabulary: Object.fromEntries(hotwords.filter((w) => !tooLong(w)).map((w) => [w, HOTWORD_WEIGHT])) }),
  },
}, { "X-DashScope-Async": "enable", "X-DashScope-OssResourceResolve": "enable" });
const taskId: string = task.output.task_id;

let done;
do {
  if (Date.now() - started > MAX_WAIT_MS) fail(`task ${taskId} still unfinished after an hour; check the console`);
  await new Promise((r) => setTimeout(r, POLL_MS));
  done = await api(`/api/v1/tasks/${taskId}`);
} while (["PENDING", "RUNNING"].includes(done.output.task_status));
const resultUrl = done.output.results?.[0]?.transcription_url;
if (done.output.task_status !== "SUCCEEDED" || !resultUrl) fail(`task ${taskId}: ${JSON.stringify(done.output).slice(0, 600)}`);

const data = await (await fetch(resultUrl)).json();
const segments: Segment[] = (data.transcripts?.[0]?.sentences ?? []).map((s: any) => ({
  start: s.begin_time / 1000, end: s.end_time / 1000, text: s.text.trim(),
  ...("speaker_id" in s && { speaker: s.speaker_id }),
}));
const hits = rules.filter(([wrong, right]) =>
  segments.reduce((hit, s) => s.text.includes(wrong) ? (s.text = s.text.replaceAll(wrong, right), true) : hit, false));

const stamp = (t: number) => {
  const ms = Math.round(t * 1000), p = (n: number, w = 2) => String(n).padStart(w, "0");
  return `${p(Math.floor(ms / 3600_000))}:${p(Math.floor(ms / 60_000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`;
};
writeFileSync(outputs[0]!, segments.map((s) => s.text + "\n").join(""));
writeFileSync(outputs[1]!, segments.map((s, i) =>
  `${i + 1}\n${stamp(s.start)} --> ${stamp(s.end)}\n${s.text.replaceAll("-->", "->")}\n\n`).join(""));
writeFileSync(outputs[2]!, JSON.stringify({ task_id: taskId, model: opt.model, usage: done.usage, segments }, null, 1));

const speakers = new Map<number, number>();
for (const s of segments) if (s.speaker !== undefined) speakers.set(s.speaker, (speakers.get(s.speaker) ?? 0) + 1);
console.log([
  `${segments.length} sentences in ${Math.round((Date.now() - started) / 1000)} s; task ${taskId}`,
  `speakers: ${[...speakers].sort(([a], [b]) => a - b).map(([k, n]) => `S${k} ${n}`).join(", ") || "none returned"}`,
  `billed: ${done.usage?.duration ?? "?"} s of speech`,
  ...(hotwords.length ? [`hotwords: ${hotwords.length - skipped.length} sent${skipped.length ? `; too long, not sent: ${skipped.join(", ")}` : ""}`] : []),
  ...(rules.length ? [`terms: ${hits.length} of ${rules.length} rules matched`] : []),
  ...outputs,
].join("\n"));
