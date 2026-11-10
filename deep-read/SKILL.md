---
name: deep-read
description: Understands a long source (course, podcast or speech transcript, SRT/VTT subtitles, long article, meeting notes, long PDF). Reads every line to the end without skimming or sampling, works out what the author is saying, how they say it and what it means for the reader, then checks facts only as far as the kind of source calls for. Use when the user says "read it all", "really understand this", "don't skip anything", "go through it properly", or hands over tens of thousands of words to distill, take notes on, or answer detailed questions about.
---

# Deep read

## The goal

Understand the source: what the author is saying, how they say it, where it is strong and where it does not hold, and what it means for the reader.
Reading every line is the floor, not the goal. Finding errors is a tool, not the output.

Real case: notes on Steve Jobs' 2005 Stanford commencement address came back as an errata sheet (the Mac was not the first computer with fine typography, Pixar was bought rather than founded, the cancer timeline was compressed) with one line on what the speech was about. The user asked why the read was stuck on trivia instead of understanding what the speech meant, and whether nitpicking was the point. The rewritten reading: all three stories are about losing something and finding it had been in the way; each story removes one reason not to follow your heart; and the whole speech is a farewell from a man who had recently believed he was dying, passing the baton on. The cause was the old version of this skill: every step asked for proof of reading or for errors, and none asked for understanding.

## First, what kind of source is it

| Kind | Examples | Focus | Fact-checking |
|---|---|---|---|
| Ideas, a life, a person | Speeches, essays, profile interviews, stories | The main point, how the argument or story unfolds, how this person thinks, where the feeling lands | In an appendix; raised in the reply only when a discrepancy changes the meaning |
| Methods, experience | Courses, tutorials, build write-ups | The method, the conditions it depends on, whether it transfers to the reader's work | Only the premises the method relies on |
| Factual claims the reader may act on | Investing, products, news, technical judgments | Claims and their evidence | The main job: check numbers, dates and events one by one |

When a source mixes kinds, go by the one that carries the most weight.

## The floor: nothing goes unread

When an agent reads a long source, it often misses content without noticing:
- Read errors once a single call returns more than ~25k tokens, so the agent falls back to grep or the first screen.
- Transcripts often put a whole paragraph on one line; one line over the limit cannot be split.
- Read returns the first 2000 lines by default.
- Head, tail and a few grep hits get passed off as reading.
- A subagent reads it and returns its own summary.
- Reading everything first and recalling later loses early details, and context compaction erases even the impressions.

So:

- **Read it yourself.** Subagents do only two things: look up outside facts, and Step 4's independent reading.
- **No conclusions until every line is read.** grep, head/tail and "picking the key paragraphs" never substitute.
- **Write notes after every chunk**, so progress survives context compaction.
- **Keep every line of the reading copy short**, so the source can always be split into chunks under the limit.

## Workflow

### Step 0: Is a decision already waiting on it?

Check whether the conversation has a **decision already waiting on this source**: a rule about to change, a product choice, a device just bought.
If so, add a line `- Question going in: <that decision>` above the "Read:" line at the end of the notes, and take notes with it in mind. If not, write nothing and don't ask. Asking first about an exploratory source forces a guess, and the guessed purpose becomes a filter on the reading.

### Step 1: Prepare a reading copy

Run the script in this skill's directory (Python 3 standard library only):

```bash
python3 scripts/prepare.py <file> --out <scratch dir>
```

- `.srt` / `.vtt`: strips cue numbers and timestamps, merges the repeated lines of rolling captions, writes `transcript.txt` as paragraphs each starting with `[HH:MM:SS]`, then builds `read.txt` from it.
- Other plain text: builds `read.txt` directly, keeping blank lines.
- The script prints the longest original line, line count, estimated tokens, and the Read parameters for each chunk.
- Defaults: lines of at most 200 characters, chunks of about 15k tokens (about 4 English characters or 1 CJK character per token, with margin). If Read still reports the limit, lower `--chunk-tokens` and rerun.
- PDF: with a text layer, convert with `pdftotext -layout` first (poppler: `brew install poppler`, `apt install poppler-utils`). Scanned PDFs: Read's `pages` parameter, up to 20 pages per call, in page order.
- Web pages / HTML: extract plain text first.

Keep the reading copy in a scratch directory, not in the repo.

### Step 2: Read chunk by chunk, noting as you go

- Follow the chunk plan in order with no gaps. If the source is bigger than one session can hold (roughly 150k tokens or more), split it across sessions and note "read up to line N" in the notes.
- After each chunk, write down its content in source order: claims, examples, numbers (as stated), with line numbers or timestamps.
- **Who said it**: in conversations, a host's summary that the guest merely agrees to is the host's view; a guest's guess is recorded as a guess.
- **Recognition errors**: speech-to-text or OCR errors go in a mapping table (`claw` → Claude); never edit the source. A word that recurs and does not fit its context is probably a homophone error: find the real word instead of inventing a meaning for it.
- **Clues to the main point**: words or images the author keeps returning to, turns in the structure, where they lean in, what is set up at the start and picked up at the end. Note them; Step 3 needs them.

### Step 3: Once finished, write "What it is saying"

With everything read, step back from the details and answer:

- **Main point**: what the author most wants the audience to take away, in a sentence or two.
- **How it is said**: how the parts relate (building up, parallel, contrast, one idea from several angles) and where the center of gravity is.
- **Strengths and problems**: why the strong parts persuade or move; for weak parts, only the ones that affect the main point.
- **Worth taking away**: one to three things that change how one thinks or acts.
- **For the reader**: only what genuinely lands on one of their projects, files or decisions; if nothing does, say so instead of forcing it.

Write in paragraphs, not fragments. Where the author's own sentence says it best, quote it with its line number.

### Step 4: Independent reading, then compare

After the notes are written and before replying, start a subagent that reads the same `read.txt` from the start. **It must not read the notes**, and it is not told your conclusions. Do this for every source.
Its job is not to find errors but to understand the source on its own:

- Read every line following the chunk plan and report the coverage.
- State the main point it read, the overall structure and the three most important points, each with line numbers.
- Point out the places most likely to be misread; in conversations, mark who said what (guest claim, guest guess, host).
- Check facts according to the kind of source: for factual sources, check the numbers, dates and events the claims rest on, with links; otherwise only claims that would change the main point.

Then compare three things: what it saw that you did not, what you saw that it did not, and where the two readings of the main point differ.
Check every disagreement against the source lines and correct the notes from the source. Open every link it gives before writing an outside fact into the notes, and cite it. Never merge its conclusions directly; it can be wrong too.

Cost: about 50k tokens of fixed overhead plus about 3x the reading copy's tokens, more with web checks.

Real cases: one independent reading caught a host's four summary lines recorded as the guest's views. In the Jobs speech, it compared the delivery with the prepared text and found that the end of the first story had been changed on stage from "this approach has never let me down" to "believing the dots will connect … will give you the confidence to follow your heart". That was the clearest single clue to the speech's meaning, and the first read had filed it under "differences".

### Step 5: Wrap up

Notes in this order:

```
# Notes: <title>

## What it is saying        Step 3: main point, how it is said, strengths and problems
## Worth taking away        1–3 items; uses for the reader only when real
## The substance (by theme) arguments, methods, examples, numbers worth keeping, with line numbers; the reply's item 3 comes from here
## Content (source order)   Step 2's chunk notes with line numbers, for reference
## Appendix                 recognition-error table; factual discrepancies that don't affect the main point; verification note (what came from the independent reading, which links you opened yourself)

Read: <file>, <N> lines, <K> chunks (<line ranges>).
```

- **Description**: one sentence, first what it is, then its main point, for whatever index the notes live in.
- **Reply** in this order, with no fixed "coverage" or "warnings" sections:
  1. What it is: a sentence or two in plain words.
  2. What I understood: the main point, a few paragraphs.
  3. The substance, by theme: the arguments, methods, examples and numbers worth keeping, each with line numbers. For a dense source this is the bulk of the reply; the main point alone is not a reading. This holds when notes already exist: reply from them instead of pointing at them.
  4. Worth taking away, and what it means for the user: only what genuinely relates.
  5. Worth watching: only when something affects understanding or a decision; otherwise omit.
  6. One closing line: lines read; what the independent reading added (only what changed the understanding).

## Don't

- Don't hand in an errata sheet as the reading. Errors that don't affect the main point stay in the appendix.
- Don't hand in a summary of a partial read, and don't skip Step 1 and read the original file directly (without the chunk plan and line numbers there is nothing to show it was read).
- Don't clean up the source to make it look tidy.
- Don't present your own inferences as the author's words.
