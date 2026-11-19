---
name: retro
description: >-
  Runs a systematic retrospective of an agent incident or a session that went off course: reads the raw
  session record instead of anyone's memory of it, finds the essential variable and the sensor that was
  missing, maps the failure to classic problems (open-loop control, surrogate endpoints, espoused theory vs
  theory-in-use, drift, fixes that fail), and proposes a structural change up the hierarchy of controls
  rather than another rule. Bundles a script that reads Claude Code and Codex session logs. Use when the
  user says "retro", "postmortem", "systematic retrospective", "what classic problem is this a variant of",
  "why did this happen again", "it must not keep getting worse", "go through this session from the start"
  ("复盘", "系统性复盘", "这是什么经典问题的变体", "为什么又"), or names a Codex or Claude Code session that
  went wrong.
---

# Retro: from an incident to a structural change

## Why this skill exists

After an app crashed again and again for 27 hours, the first draft of its retrospective proposed "add sensors, add rules", and the user called it shallow; the second draft started from classic problems and found the real structural one.
Even so, the only structural change that landed was a release gate in that app's repository, while the global rules file grew by 13 lines.
Over the following week the user said the same sentence in sessions in five different repositories: "This isn't a new problem, it's a variant of some classic problem; we need a systematic retro."
Each time the retro was improvised, and each produced either a file or a few new rules.
Later runs showed the other half: a retro that ends as a document nobody rereads changes nothing. Across fourteen retros, twelve matched "lesson identified, not learned"; the gates they added held, and the practices they asked for lapsed after one context compaction.

This skill fixes the retro's input and output: **the input is the raw record; the output is a structural change.**
When no structural change is possible, it says "only a rule is possible, because ___" instead of quietly adding one.

## Rules

- **Read the raw record, not a summary.** Export the session's dialogue with `scripts/sessions.ts dump` and read all of it. The agent's own closing report is what is under review, not evidence.
- **Keep facts and judgments apart.** Every fact carries a timestamp or a file path; every judgment is labelled as one.
- **Don't end by adding a rule.** Section 5 must contain a structural change (a script gate, a type or fixed layout, a generated file, removing the hazardous operation itself), or say outright "only a rule is possible, because ___". Follow the user's own view of what counts; some users rule out agent-tool hooks.
- **Every conclusion needs a landing place.** Each item in section 5 names where it lands: a check script, the standing instructions every session loads (the root `AGENTS.md` or `CLAUDE.md`), a folder's or repository's own `AGENTS.md`, or "no landing place, because ___". Sum them up in one line in the report's frontmatter `landed:`; for what has not landed yet write "unverified" or "waiting on <user>".
- **Call each change a gate or a practice.** A gate is code on the path the next change must pass; a practice depends on someone remembering it. A practice does not close the item: it stays open, and the report says which level of control it moves up to if it fails again.
- **Analyse, don't act.** Whether a structural change is made, and by whom, is the user's decision; make it once they say go.
- **One incident at a time.** When the same pattern shows up in several sessions, take the one with the most complete record as the main case and list the others as corroboration.

## Workflow

### Step 1: Get the record

The script runs from this skill's folder on Node.js 22.18+, with no packages to install.

- Codex: `node scripts/sessions.ts dump --codex "<thread name>" --out <scratch>/<name>.md`. The thread name is the title in Codex's sidebar; an id prefix or part of the name also works.
- Claude Code: `node scripts/sessions.ts dump --claude <first 8 characters of the session id> --out ...`; a jsonl path also works. If you don't know the id, run `node scripts/sessions.ts list --since 7d` first.
- To find the session, search across sessions and both hosts by meaning, including synonyms of the user's words, not only the word they used this time.
- The dump holds the dialogue only. What the agent read and ran, and when, is in the tool calls: read those in the raw jsonl (the dump's header gives its path) and take durations from their timestamps. When the question is what the agent read, count the files each session and subagent actually opened, by kind.
- Compaction summaries are lossy, cut short in the dump, and slanted toward the agent's own account: take facts only from timestamped original messages. When the session under review is the current one, check every claim against the dump, because that is where an earlier self-report is most likely wrong. When a session is near its usage or context limit, export the record before it is lost.
- For an incident (a crash, a bad release, lost data), also read the product's own records, not only the conversation: crash reports (`~/Library/Logs/DiagnosticReports/<App>-*.ips` on macOS), the product's history and logs, release records, git log.
- Read the exported dialogue chunk by chunk to the end, the `/deep-read` way: no sampling, not only the beginning and the end.

Session logs are private. Keep dumps in a scratch folder, and quote from them only what a fact needs.

### Step 2: Timeline

| Time | Event | Signal readable at that moment |
|---|---|---|

The third column is the point: each row answers "at that moment, what signal could have told the agent it was wrong?" A signal that was there and went unread is a different problem from a signal that did not exist.

### Step 3: The essential variable and the sensors at the time

- What does this product or task exist to deliver? One or two variables, no more.
- During this period, did any loop measure it? Which proxies did the agent actually measure? Would each have turned red if the real endpoint were broken?
- Which observation channels did the user's constraints close at the time (don't disturb, no local tests, test only through a release, don't ask me...)? Did the agent say so, or measure something else and stay quiet?

### Step 4: Match classic problems

| Classic problem | Test question | Classic remedy |
|---|---|---|
| Open-loop control, essential variables (Wiener, Ashby; SRE's CUJ/SLI) | Is any sensor pointed at the essential variable? | Define the SLI before the alert |
| Surrogate endpoints, Goodhart, the streetlight effect, attribute substitution (the CAST trial; Kahneman) | Would each check give a different result if the real endpoint were broken? | Sensitivity before coverage |
| Espoused theory vs theory-in-use (Argyris & Schön) | Are the written rules and the rules inferred from behaviour two different sets? | Change the structure, not the words |
| Drift to the boundary (Rasmussen) | Which invisible line did efficiency pressure push the work across? | Make the boundary visible and crossing it trigger something |
| Fixes that fail (system dynamics) | Did the side effect of fixing the symptom appear at another time and place? | Find the root cause and remove the hazard |
| Lessons identified, not learned (CAIB) | Has this kind of incident happened before? At what level of control did the last lesson land? | Go one level up |
| Inert knowledge; retrieval by confidence; knowledge in the head vs in the world (Whitehead; Norman) | Was the knowledge already recorded but not retrieved when the decision was made? | A forcing function on the path, such as a check that prints the reason |
| Ironies of automation (Bainbridge) | Did the human and the agent each assume the other was checking? | Name who is the check |
| No pilot study | Was the whole batch built or run before a small trial showed the measure can tell good from bad? | A pilot gate: a few runs on known-good and known-bad cases before the batch |
| Shotgun parsing (LangSec) | Did the system act on input it had only partly recognised? | Parse into a complete command first, read it back, then act |
| Specification gaming, sycophancy (AI safety) | Was the agent optimising for "looks done" or "is done"? Did it take a narrow approval, or an unanswered question, as a yes to the whole plan? | Make good news impossible without evidence and bad news cheaper to report |
| Swiss cheese (Reason) | Which layers' holes lined up? | Patching one layer is not enough |

Write only the ones that fit, one sentence of reasoning each. If none fit, don't force one to look systematic: name the pattern that does, outside the table.

### Step 5: Hierarchy of controls

From strongest to weakest: eliminate > substitute > engineering control > administrative control (rules, training, comments) > personal protection. Write three things: the level of the measures already in place after this incident; the highest level reachable this time; and what exactly changes, where, and how to check it turns red at the next incident of the same kind.

Look up the previous retro of the same kind first: what it changed, which gates held and which practices lapsed. That record says which level is worth going to this time.

Put engineering controls into entry points that already exist before creating new ones:

- A "recorded failure classes" section in the repository's `AGENTS.md`, which the next person to change that component must pass.
- The product's own release script: a preflight check there runs on every release.
- A periodic health report, if the user keeps one: a new reading can go into it.

### Step 6: Write the report

Save it where the user keeps retrospectives (follow the repository's conventions; without one, `retros/YYYY-MM-DD-<title>.md`, dated the day it is written), in the user's language. Structure:

```markdown
---
description: "…"
landed: "<where the conclusions landed; for the rest, unverified / waiting on <user>>"
---

# <Title>: retro

Date: YYYY-MM-DD. Source: <session name / incident>. Record: <dump file or session id>.

## 0. Facts
Verified facts only, each with its time and source.

## 1. Timeline
Time | Event | Signal readable at that moment

## 2. The essential variable and the sensors at the time

## 3. Which classic problems this is

## 4. Hierarchy of controls: where it is now, how high it can go

## 5. Structural changes (or "only a rule is possible, because ___")
Each: what changes, where, who does it, gate or practice, how to check it turns red next time.

## 6. Decisions for the user
At most three. Each gives a recommendation first (pick a side, with reasons), then leaves a line for the user.
```

### Step 7: Deliver and iterate

- In the reply, give section 5 first, then section 6; the rest is in the file.
- Commit only this report, following the repository's rules.
- Make structural changes only after the user agrees; once one is made, actually run its "how to check it turns red" once, don't just write it down.
- For a conclusion that lands in an instructions file, edit that file once the user agrees (respect any length cap it has: add a line, remove a line), then change `landed:` to where it actually landed.
- If the user keeps an iteration log for this skill, add an entry: date, case, classic problems matched, structural change, and what in this skill was awkward this time. Awkwardness that has come up before is a change to this skill or its script, not another log entry.

## Don't

- Don't treat the agent's closing report as fact.
- Don't end with "be careful next time", "add a reminder" or "update the global rules".
- Don't make an "accept the risk" decision for the user; constraint conflicts go into section 6.
- Don't write an activity log. "It ran 185 commands" is worth writing only when it explains a classic problem.

## The script

`scripts/sessions.ts` reads Claude Code logs (`~/.claude/projects/<cwd slug>/<session id>.jsonl`) and Codex logs (`~/.codex/sessions/YYYY/MM/DD/rollout-*.jsonl`, with thread names from `~/.codex/session_index.jsonl`):

- `list [--since 7d] [--until WHEN]`: sessions on both hosts with messages in the window: folder or thread name, id, first and last message time, user and assistant message counts.
- `dump --codex <name or id prefix> | --claude <id prefix or path> [--since WHEN] [--out FILE]`: one session's user and assistant messages as Markdown, each message cut at 6,000 characters.

`WHEN` is `7d`, `36h`, `2026-10-01` or `2026-10-01T08:00` in local time.
