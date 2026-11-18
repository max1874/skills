---
name: find-skills
description: Finds similar agent skills through fixed channels (skills.sh, GitHub, mattpocock/skills, Anthropic's official skills, the Claude Code plugin marketplace, the user's own list of collected skills), benchmarks how a skill is written, and prepares a skill for sharing. Use before building a new skill, when improving an existing one, when looking at how others wrote theirs, or when getting ready to share a skill publicly. Use when the user says "is there a skill like this", "make a skill", "look at other people's skills", "share this skill" ("找找有没有类似的 skill", "做个 skill", "分享这个 skill").
---

# Find skills: reference, benchmark, share

## First decide: should this be a skill

These criteria come from the judgment used when a global skill set was cut from 47 to 40, written down afterwards.

- **Don't create a skill the user didn't ask for.** When one seems worthwhile, propose it in the conversation first and say which of the conditions below it meets.
- **Conditions for a skill of its own**: it has a real working method or scripts, or personal knowledge only the user has (accounts, paths, devices, pitfalls in their workflow).
- **General methods don't become skills**: working principles like "a review should check the news" or "read the call chain first" go into the global or repository AGENTS.md; if already covered, write nothing.
- **Archive skills that are rarely used**, and bring them back when needed.
- **Keep each lesson in one maintained place**: if an existing skill or file can hold it, add it there instead of starting a new one.
- A skill is documentation and takes effect only when invoked, so it does not count as "changing structure". To keep a failure from recurring, first see whether the guard can hang on the action itself (a script gate, a check in the tool).

Once it is decided, pick one of three uses as needed, or run them in sequence:

- **A. Reference and duplicate check**: before making a new skill, see whether someone has done it and how far they got.
- **B. Benchmark the writing**: when writing or revising a skill, compare against the official guidelines and well-written examples.
- **C. Prepare to share**: before going public, remove private content, and confirm others can install it and the name doesn't collide.

## Channels

| Channel | Used for | How to search |
|---|---|---|
| **skills.sh** (Vercel's skill package manager and directory) | A, C | Command line `npx -y skills@latest find "<keywords>"`; detail pages `https://skills.sh/<owner>/<repo>/<skill>` can be fetched directly |
| **GitHub** | A, C | WebSearch: `"<keywords>" SKILL.md claude skill github`; read the README of what you find |
| **mattpocock/skills** (270k stars, 37 skills) | A, B | `npx -y skills@latest add mattpocock/skills --list` lists names and descriptions without installing |
| **Anthropic official**: `anthropics/skills` and the [authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices) | B | Fetch the docs and review your skill with the checklist at the end |
| **Claude Code plugin marketplace**: the official `anthropics/claude-plugins-official`, and the "Anthropic Directory" on claude.ai | A, C | Browse with `/plugin` in the interactive UI; `claude plugin marketplace list` lists the configured sources. A marketplace is itself a GitHub repository, so you can look in the repository directly. Skills can also be packaged as plugins and distributed from here (that is how Matt does it) |
| **The user's own list of collected skills**, if they keep one | A, B | Collections gathered earlier, parts libraries, and directory sites (LobeHub, awesome lists, etc.) |

## A. Reference and duplicate check

1. **Search skills.sh**: search 2–3 sets of keywords by function, one search each, then **search once more for the name you plan to use** to check for collisions. Append `</dev/null` to the command, or it waits for interactive input. Results are ranked semantically and the top is often filled with popular skills; pick only the ones that are actually relevant.
2. **Read the candidates in full**: `npx -y skills@latest use <owner>/<repo>@<skill> </dev/null` prints the full SKILL.md without installing. One at a time; a repository that is too large hangs on cloning (openclaw hung for 4 minutes), so stop after 2 minutes and fetch the detail page instead.
3. **Search GitHub**: projects skills.sh hasn't indexed can only be found here.
4. **Check Matt's repository, the plugin marketplace and the user's own list** for similar skills.
5. **Output a comparison table**:

   | Similar skill | Installs or stars | What it does | Relation to ours |
   |---|---|---|---|

   The conclusion can only be one of three: **install it as is**, **adapt someone else's**, or **build our own**. When choosing "build our own", state clearly how we differ from the closest one.

## B. Benchmark the writing

Compare against the official checklist, focusing on these:

- `name` uses only lowercase letters, digits and hyphens, at most 64 characters; `description` is in the third person, says both what it does and when to use it, at most 1024 characters.
- The SKILL.md body is at most 500 lines; referenced files are linked only one level deep from SKILL.md.
- Scripts use **paths relative to the skill directory**; dependencies are stated (and how to install them if missing); parameter defaults state why they were chosen.
- For style, follow Matt: one skill does one thing and composes with others; keep manual and automatic triggering distinct.
- Where it lives: follow the user's instructions; by default, the current repository's skills directory (`.agents/skills/<name>/`); when several repositories need it, promote it to a global skill in the user-level skills directory.

## C. Prepare to share

1. **Keep one copy**: the public version is the skill itself; don't keep a separate private copy. Move private content (personal paths, your own repository rules, links to private notes) into the owning repository's `AGENTS.md`, and have the skill say only "follow the current repository's conventions"; write the body in English.
2. **Put it in the public repository** the user publishes skills from. A skill that still lives in a project repository is first promoted to a global skill.
3. **Confirm it installs**: before pushing, check with `npx -y skills@latest add <local dir> --list` that the skill is recognized; after pushing, run `git init` in a new empty directory, then `npx -y skills@latest add <owner>/<repo> --skill <name> -a claude-code -y`, then start a new session in that directory and confirm the skill is recognized.
4. **Check the name again**: search for the name as in A step 1. A collision can stay, but the README and posts must state the difference clearly.
5. **README**: what problem it solves, how it differs from the closest similar skill, how to install it, and one real usage example.
6. **Post drafts** (X, Xiaohongshu): start from what actually happened: the problem met, what was done, how well it worked, rather than listing features. Give the drafts to the user, who publishes them.

## Wrap-up

- If the user keeps a list of collected skills, record the valuable entries found this time: mark the ones you verified yourself with ✓, and write "unverified" on the rest. Then follow that list's own steps for refreshing indexes and committing.
