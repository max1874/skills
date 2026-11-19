---
name: stt
description: >-
  Transcribes a local audio or video file (Chinese first; mixed Chinese and English works) into text, SRT
  subtitles and JSON with sentence timestamps and speaker labels through a cloud speech-to-text provider
  (Alibaba Cloud Bailian's Qwen-Audio today; providers are pluggable), then proofreads it. Needs ffmpeg and
  the provider's API key; Bailian costs about 0.06 CNY for 50 minutes. Use when the user hands over a
  recording, podcast, meeting or video and wants a transcript or subtitles, asks "what does this recording
  say", or wants to maintain hotword or correction lists for transcripts.
---

# Speech to text

`scripts/stt.ts` cuts a 16 kHz mono clip with ffmpeg, sends it to a provider, and writes `<name>.txt`
(one sentence per line), `<name>.srt` and `<name>.json` (timestamps, speakers, the provider's task id
and billing). With Bailian, fifty-one minutes of audio took 77 seconds.

## Before running

- **It uploads the audio to the provider and is billed.** Follow the user's rules for paid calls and
  private recordings; if there are none, say what will be uploaded and the rough cost first.
- Needs Node.js 22.18+ (it runs the `.ts` file directly, no packages), ffmpeg, and the provider's key
  in the environment (`node scripts/stt.ts --help` lists each provider's variables). Inject the key
  with the user's secret tool rather than pasting it. Paths are relative to this skill's folder.

## Run

```bash
node scripts/stt.ts <file> -l zh -o <dir> [--hotwords names.txt] [--terms fixes.txt]... [--provider bailian]
```

- `-l zh` for Chinese. With Bailian it also keeps English hotwords active, which matters when Chinese
  speakers name English terms.
- Existing outputs are never overwritten; pick another `-o`. Where transcripts go follows the
  current repository's or the user's conventions.
- A run is not reproducible: the same audio twice gives slightly different wording. Don't rerun
  hoping a specific mistake goes away; fix it in proofreading.

## Providers

| `--provider` | Service | Key |
|---|---|---|
| `bailian` (default) | Alibaba Cloud Model Studio, Qwen-Audio file transcription, with speaker separation | `DASHSCOPE_API_KEY`; a workspace-bound `sk-ws-` key also needs `DASHSCOPE_BASE_URL` set to its workspace's domain |

To add one, write a function in `scripts/stt.ts` that takes the clip, language, hotwords and model and
returns sentences (`start`, `end`, `text`, optional `speaker`), then register it with its key's
variable in `providers`. Everything else (checks before billing, term replacement, output files)
is shared.

## Two lists for proper nouns

| | `--hotwords` | `--terms` |
|---|---|---|
| When | during recognition, passed to the provider | after recognition, as plain string replacement |
| Format | one term per line, `#` starts a comment | `wrong<TAB>right`, optional third column `# note` |
| For | mishearings that produce a **real word**, where replacing would damage other sentences | mishearings that produce **no real word**, so replacing is safe |
| Risk | a long list or short, common words pull the model off course | a short or common key rewrites the whole transcript |

- Keep lists per domain: a cooking list must not touch a trading talk.
- A `terms` key carries context (`是一个公寓 → 是一个公域`, never `公寓 → 公域`). Single characters and
  anything already common in the transcript are dangerous keys.
- Hotwords: only names that recur and that the model gets wrong without help. Short, frequent words
  get forced into unrelated speech; words it already gets right only dilute the list. Bailian skips
  hotwords over 15 characters (7 words for ASCII), and the run says which.

## Proofread

Mistakes cluster in two places: proper nouns heard as homophones (company and person names), and
English jargon written as Chinese sound-alikes. For each suspect:

1. Search the transcript first. The right spelling often appears elsewhere in it; that is evidence.
2. Change only what that evidence or the surrounding context settles, and list what you left doubtful.
3. A mistake that recurs across recordings and produces no real word goes into a `terms` list; one
   that produces a real word is a hotword candidate.

Speaker labels (`S0`, `S1`) come from the provider's speaker separation: confirm who is who from what
they say before naming them. Keep the raw transcript beside the corrected one, so the corrections stay
reviewable.
