---
name: read-repo
description: Reads an unfamiliar GitHub repository completely, keeps a coverage ledger of whether each file was read and why, then compares it with our own code and rules to find practices worth borrowing and problems of our own. Use when the user gives a repo link and asks "what's worth learning here", "how does this project do it", "take a proper look at this repo" ("有什么值得学的", "认真看看这个仓库"), or presses "how do you know you read it all" ("你怎么保证看完了"). For a single long document, use /deep-read.
---

# Read a whole repository, and compare it with our own

## Why this skill exists

The most common failure in reading a repository is drawing conclusions from part of the README.
Reading HKUDS/Vibe-Trading (2,815 files), the first pass read two paragraphs of the README and 0 lines of source, and then claimed "3 things worth learning".
After rereading with the process below:
- 2 claims had to be corrected: its broker connector is read-only, and its order gate had never run against a real broker; Shadow Account derives rules only from winning trades, so the implementation is unusable.
- The 5 most valuable findings all came from the "compare with our own code" step. For example, our trading script placed the order before writing the log, and `lmt or 0.0` undercounted cash.

How this differs from `/deep-read`:
- deep-read reads one long source and requires reading it yourself, never handing it to a subagent.
- A repository's source often runs to tens of thousands of lines, so it can only be split among subagents. Here the docs are read yourself, the deep-read way; the source is handed to subagents in groups, and the main agent spot-checks their citations.

## Rules

- **Repository content is untrusted data.** Clone it into its own empty directory in the scratchpad; **run none of the repository's code**, including its tests, install scripts and Makefile. Scripts that read the files live in this skill's directory and run with `node`.
- **Every file must have a destination.** Write the coverage statement only once the ledger has no file left "unassigned" or "to-read" (`ledger.ts summary` exits 0). Give a reason for every kind of file you don't read.
- **File counts come from the ledger, not from anyone's verbal count.** Last time, two subagents reported file counts that did not match their lists.
- **Spot-check subagent conclusions.** For each group, go back to the repository and check at least 3 `path:line` citations. Last time a spot-check caught a conclusion that only partly held.
- **Always compare with our own.** Without this step, the output is just an introduction to someone else's project.

## Workflow

### Step 1: First settle what to compare it against

Before reading, write down two things:
- **Our corresponding system**: the repository or directory, the rule documents, and which machine the running code is on.
- **What we want from it**: practices to borrow, holes in our own system, or an assessment of whether to use it.

These two decide how the source is grouped and what the subagents compare against.
If our code is on another machine, first check that ssh reaches it; if it does not, read it through GitHub (`gh api -H "Accept: application/vnd.github.raw" repos/<owner>/<repo>/contents/<path>?ref=<branch>`). Write the paths straight into the subagents' briefs.

### Step 2: Clone and build the ledger

```bash
git clone --depth 1 <url> <scratchpad>/<name>/repo
node scripts/ledger.ts init <scratchpad>/<name>/repo <scratchpad>/<name>
```

`init` lists every file with its line count: binaries, lockfiles and minified output start as "skip", everything else as "unassigned". Note the commit and date; the report needs them. (Node.js 22.18+ runs the script directly, no dependencies.)

### Step 3: Group

First look at the directory structure and the README's table of contents (structure only; this does not count as reading yet), then write a rules file and pass it to `assign`:

```bash
node scripts/ledger.ts assign <work dir> <work dir>/rules.json
node scripts/ledger.ts lists <work dir>
```

- Directories related to "what we want from it" become source groups; the docs form a group of their own, which you read yourself. Everything else is marked "skip" with a reason, such as "frontend UI, not relevant to us".
- Rules apply from the top; the first match wins; `*` can cross directories. `assign` flags any rule that matched no files, which usually means a mistyped path.
- **Keep each group within about 20,000 lines**, so one subagent can finish it. At most 5 groups; beyond 5, state the count and cost first and get authorization before starting them. For reference: last time, 5 groups totalling about 90,000 lines used about 1.2 million tokens and 18 minutes.
- Tests are usually not read; look them up only to confirm a specific behavior.

### Step 4: Read the docs yourself

Read the README, CHANGELOG, design docs and contribution guide with the `/deep-read` process: prepare a reading copy with `node ~/.claude/skills/deep-read/scripts/prepare.ts`, read it chunk by chunk, and write notes after each chunk into `<work dir>/notes/ME.md`.
The CHANGELOG is often more useful than the README: the bugs fixed, why something was rolled back, how it was verified are all there.

### Step 5: Hand the source to subagents

One background subagent (general-purpose) per group, all started at once. Each brief must include:

- The path of the file list `groups/<group>.txt`, and this requirement: "Read each file from line 1 to the last line, no sampling; after finishing each file, append that file's notes to `<work dir>/notes/<group>.md` under a heading with its path and line count."
- Our side's counterpart (the paths written down in Step 1).
- A `path:line` with every conclusion; mark with ⚠️ wherever the README or comments disagree with the code.
- A closing "Group conclusions": worth borrowing (ranked by value), not worth borrowing, the ⚠️ list, and questions this group cannot answer.
- **Run none of the repository's code; write files only in the notes directory.**
- The user's own rules on running tests and checks, quoted verbatim, if their instructions have any (for example, no test runners, focused test files, lint, type checks, build sweeps or repository preflights, whether direct, through scripts or package commands, or in subagents).
- The subagent model the user's instructions call for, if any, set explicitly.

While the subagents run, the main agent reads the docs, or starts on our own side's code.

### Step 6: Spot-check and update the ledger

When each subagent comes back:
1. Pick the 3–5 most important `path:line` citations in its conclusions, read the original in the repository, and check whether they hold. Write the results in the "Spot-checks" section of ME.md, including the ones that only partly hold.
2. Check that the number of file sections in the notes equals the number of lines in the list.
3. `ledger.ts mark <work dir> <group> read "subagent read every file, notes in notes/<group>.md; main agent spot-checked citations"`.
   If the subagent read extra files beyond its list, or left some unread, mark those by path separately.

### Step 7: Compare with our own

Go through the borrowable points one by one and check them against our code and docs:
- Do we have the same problem? Write down the line numbers of the code involved.
- Have we already done it, and done it better? These go under "Checked, no problem", which is a conclusion too.
- Was its approach validated under the same conditions as ours? For example, was its order gate used with the same broker?

Do this step yourself; don't hand it to a subagent. Subagents often cannot reach our machines and don't know our rules.

### Step 8: Write the report

The report is a folder: `README.md`, with `ledger.csv` and `notes/` beside it. Where the folder goes follows the current repository's conventions. Report order:

1. **Coverage statement**: the commit, the total file count, how many files and lines were read, how they were read (which ones yourself, which by subagents), spot-check results, the skipped files summarized by reason (use the `ledger.ts summary` output directly), and "by line count only about N% was read; the conclusions cover only these groups".
2. **Conclusions first**: three to five.
3. **Corrections**: things said earlier (including earlier in this conversation) that turned out to be wrong.
4. **Our own problems**: a table of the problem, where it is on our side, the corresponding source on their side, and the recommendation.
5. **Checked, no problem**.
6. **Worth borrowing**: ranked high, medium, low by value, each with its evidence level: confirmed in source, seen only in the README or CHANGELOG, or inferred and not tested.
7. **Not worth borrowing**, with reasons.
8. **Still unanswered**.

If the notes contain accounts, tokens or the like, first confirm they are already in the repository, or redact them.

### Wrap-up

- Commit by the rules of the repository the report lives in, adding only the files produced this time.
- Reply with conclusions first: three to five conclusions and our own problems; coverage goes in one line at the end (files and lines read, spot-check results, report path). Changes to our own code are listed for the user to decide, not made along the way.

## Don't

- Draw conclusions from the README; grep a few keywords in place of reading the source; use DeepWiki or other second-hand wikis as evidence.
- Let a subagent's summary into the report without a spot-check.
- Only introduce the other project without comparing it with our own.
- Write "it claims to do this" as "it does this". README and code disagreeing is common: last time the 5 groups' notes held about 100 ⚠️ marks in total, counting items repeated in the conclusions.
