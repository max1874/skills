#!/usr/bin/env node
const usage = `Transcribe an audio or video file through a cloud speech-to-text provider.

Usage:
  node stt.ts <file> [-o DIR] [-l LANG] [--hotwords FILE] [--terms FILE]... [--provider NAME] [--model MODEL]

  -o, --out DIR      where <name>.txt, .srt and .json go (default: beside the input); existing files are never overwritten
  -l, --lang LANG    language hint such as zh or en
  --hotwords FILE    one term per line (# starts a comment): biases recognition toward these names
  --terms FILE       wrong<TAB>right per line: replaced after recognition; repeatable, applied in order
  --provider NAME    default bailian
  --model MODEL      the provider's model; each provider has a default

Providers:
  bailian   Alibaba Cloud Model Studio, Qwen-Audio file transcription (default qwen-audio-3.1-asr-flash-filetrans).
            Needs DASHSCOPE_API_KEY; DASHSCOPE_BASE_URL overrides https://dashscope.aliyuncs.com
            (a workspace-bound sk-ws- key needs its workspace's domain).

Needs ffmpeg and Node.js 22.18+.
`;
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, extname, join, resolve } from "node:path";
import { parseArgs } from "node:util";

type Segment = { start: number; end: number; text: string; speaker?: number };
type Request = { clip: string; lang?: string; hotwords: string[]; model?: string };
type Result = { segments: Segment[]; meta: object; notes: string[] };
/** A provider turns a 16 kHz mono clip into sentences; its notes are printed after the run. */
type Provider = { env: string; run: (req: Request) => Promise<Result> };

const providers: Record<string, Provider> = { bailian: { env: "DASHSCOPE_API_KEY", run: bailian } };

function fail(message: string): never {
  console.error(`stt: ${message}`);
  process.exit(1);
}

const { values: opt, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    out: { type: "string", short: "o" }, lang: { type: "string", short: "l" },
    hotwords: { type: "string" }, terms: { type: "string", multiple: true, default: [] },
    provider: { type: "string", default: "bailian" }, model: { type: "string" }, help: { type: "boolean", short: "h" },
  },
});
if (opt.help) console.log(usage), process.exit(0);
if (positionals.length !== 1) fail(`give one file\n\n${usage}`);

// Everything that can fail here is checked before anything is billed.
const provider = providers[opt.provider] ?? fail(`unknown provider ${opt.provider}; known: ${Object.keys(providers).join(", ")}`);
if (!process.env[provider.env]) fail(`set ${provider.env}`);
const input = resolve(positionals[0]!);
if (!existsSync(input)) fail(`no such file: ${input}`);
const stem = join(resolve(opt.out ?? dirname(input)), basename(input, extname(input)));
const outputs = ["txt", "srt", "json"].map((ext) => `${stem}.${ext}`);
const taken = outputs.filter(existsSync);
if (taken.length) fail(`would overwrite ${taken.join(", ")}; pass another -o`);
try {
  mkdirSync(dirname(stem), { recursive: true });
} catch (e: any) {
  fail(`cannot create ${dirname(stem)}: ${e.code}`);
}

const lines = (file: string) => readFileSync(file, "utf8").split(/\r?\n/);
const hotwords = opt.hotwords ? lines(opt.hotwords).map((l) => l.split("#")[0]!.trim()).filter(Boolean) : [];
// A third column (`wrong<TAB>right<TAB># why`) is a comment.
const rules = opt.terms.flatMap((file) => lines(file).flatMap((l) => {
  const [wrong, right] = l.split("\t");
  return l.trimStart().startsWith("#") || !wrong || !right || right.startsWith("#") ? [] : [[wrong, right] as const];
}));
const lang = opt.lang && ({ chinese: "zh", mandarin: "zh", english: "en" }[opt.lang.toLowerCase()] ?? opt.lang);

// Speech models take 16 kHz and most transcribe one channel: send a small mono clip, not the video.
const tmp = mkdtempSync(join(tmpdir(), "stt-"));
const clip = join(tmp, "audio.m4a");
const started = Date.now();
let result: Result | undefined, error = "";
try {
  execFileSync("ffmpeg", ["-nostdin", "-v", "error", "-y", "-i", input, "-vn", "-ac", "1", "-ar", "16000",
    "-c:a", "aac", "-b:a", "48k", clip], { stdio: ["ignore", "ignore", "pipe"] });
  result = await provider.run({ clip, lang, hotwords, model: opt.model });
} catch (e: any) {
  error = e.code === "ENOENT" ? "ffmpeg is not installed" : e.stderr ? `ffmpeg: ${String(e.stderr).trim().slice(-400)}` : e.message;
} finally {
  rmSync(tmp, { recursive: true });
}
if (!result) fail(error);
const { segments, meta, notes } = result;

const hits = rules.filter(([wrong, right]) =>
  segments.reduce((hit, s) => s.text.includes(wrong) ? (s.text = s.text.replaceAll(wrong, right), true) : hit, false));
const stamp = (t: number) => {
  const ms = Math.round(t * 1000), p = (n: number, w = 2) => String(n).padStart(w, "0");
  return `${p(Math.floor(ms / 3600_000))}:${p(Math.floor(ms / 60_000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`;
};
writeFileSync(outputs[0]!, segments.map((s) => s.text + "\n").join(""));
writeFileSync(outputs[1]!, segments.map((s, i) =>
  `${i + 1}\n${stamp(s.start)} --> ${stamp(s.end)}\n${s.text.replaceAll("-->", "->")}\n\n`).join(""));
writeFileSync(outputs[2]!, JSON.stringify({ provider: opt.provider, ...meta, segments }, null, 1));

const speakers = new Map<number, number>();
for (const s of segments) if (s.speaker !== undefined) speakers.set(s.speaker, (speakers.get(s.speaker) ?? 0) + 1);
console.log([
  `${segments.length} sentences in ${Math.round((Date.now() - started) / 1000)} s`,
  `speakers: ${[...speakers].sort(([a], [b]) => a - b).map(([k, n]) => `S${k} ${n}`).join(", ") || "none returned"}`,
  ...notes,
  ...(rules.length ? [`terms: ${hits.length} of ${rules.length} rules matched`] : []),
  ...outputs,
].join("\n"));

async function bailian({ clip, lang, hotwords, model = "qwen-audio-3.1-asr-flash-filetrans" }: Request): Promise<Result> {
  const base = (process.env.DASHSCOPE_BASE_URL || "https://dashscope.aliyuncs.com").replace(/\/$/, "");
  const api = async (path: string, body?: object, headers: Record<string, string> = {}) => {
    const res = await fetch(base + path, {
      method: body ? "POST" : "GET", body: body && JSON.stringify(body),
      headers: { Authorization: `Bearer ${process.env.DASHSCOPE_API_KEY}`, "Content-Type": "application/json", ...headers },
    });
    if (!res.ok) throw new Error(`${path.split("?")[0]} → ${res.status} ${(await res.text()).slice(0, 600)}`);
    return res.json();
  };

  // Upload to the service's own temporary storage (valid 48 hours), so no bucket of your own is needed.
  const policy = (await api(`/api/v1/uploads?action=getPolicy&model=${model}`)).data;
  const objectKey = `${policy.upload_dir}/${crypto.randomUUID()}.m4a`;
  const form = new FormData();
  for (const [name, value] of Object.entries({
    OSSAccessKeyId: policy.oss_access_key_id, Signature: policy.signature, policy: policy.policy,
    "x-oss-object-acl": policy.x_oss_object_acl, "x-oss-forbid-overwrite": policy.x_oss_forbid_overwrite,
    key: objectKey, success_action_status: "200",
  })) form.append(name, value);
  form.append("file", new Blob([readFileSync(clip)], { type: "audio/mp4" }), "audio.m4a"); // the file must come last
  const upload = await fetch(policy.upload_host, { method: "POST", body: form });
  if (!upload.ok) throw new Error(`upload → ${upload.status} ${(await upload.text()).slice(0, 400)}`);

  // Hotword limits: at most 15 characters with any non-ASCII, else at most 7 words; weight 4 of 1–5, as documented.
  const tooLong = (w: string) => /^[\x00-\x7f]*$/.test(w) ? w.split(/\s+/).length > 7 : [...w].length > 15;
  const skipped = hotwords.filter(tooLong);
  const task = await api("/api/v1/services/audio/asr/transcription", {
    model,
    input: { file_urls: [`oss://${objectKey}`] },
    parameters: {
      channel_id: [0], diarization_enabled: true,
      // With language hints set, only hotwords in those languages apply; Chinese talks name English terms.
      ...(lang && { language_hints: lang === "zh" ? ["zh", "en"] : [lang] }),
      ...(hotwords.length && { vocabulary: Object.fromEntries(hotwords.filter((w) => !tooLong(w)).map((w) => [w, 4])) }),
    },
  }, { "X-DashScope-Async": "enable", "X-DashScope-OssResourceResolve": "enable" });
  const taskId: string = task.output.task_id;

  const deadline = Date.now() + 3600_000; // 51 minutes of audio took 77 s
  let done;
  do {
    if (Date.now() > deadline) throw new Error(`task ${taskId} still unfinished after an hour; check the console`);
    await new Promise((r) => setTimeout(r, 5000));
    done = await api(`/api/v1/tasks/${taskId}`);
  } while (["PENDING", "RUNNING"].includes(done.output.task_status));
  const url = done.output.results?.[0]?.transcription_url;
  if (done.output.task_status !== "SUCCEEDED" || !url) throw new Error(`task ${taskId}: ${JSON.stringify(done.output).slice(0, 600)}`);

  const data = await (await fetch(url)).json();
  return {
    segments: (data.transcripts?.[0]?.sentences ?? []).map((s: any): Segment => ({
      start: s.begin_time / 1000, end: s.end_time / 1000, text: s.text.trim(),
      ...("speaker_id" in s && { speaker: s.speaker_id }),
    })),
    meta: { model, task_id: taskId, usage: done.usage },
    notes: [
      `task ${taskId}; billed ${done.usage?.duration ?? "?"} s of speech`,
      ...(hotwords.length ? [`hotwords: ${hotwords.length - skipped.length} sent${skipped.length ? `; too long, not sent: ${skipped.join(", ")}` : ""}`] : []),
    ],
  };
}
