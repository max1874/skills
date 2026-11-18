---
name: handoff
description: Write or resume a handoff so a session with zero context continues the work without re-asking or relitigating. Carries why the work exists, every request still open, and settled decisions with their reasons, traced to the original conversation rather than to the last summary. Use when the user says "handoff", "交接", "write this up for a fresh session", when the user's instructions call for one (a long thread, a compaction), and when a session starts from a handoff file.
argument-hint: "What will the next session do?"
---

# Handoff

The next session starts with nothing but what you write and what it can open. It cannot ask you what you meant. A handoff fails quietly: the reader sees how the work was built and not why, and treats a side effect as the goal. Each later handoff then copies a summary of a summary, and the original purpose drops out a little at a time.

Standing facts belong in the project. Work that is still moving belongs in the handoff. Write in the language the project's documents use.

## 1. Go back to the primary source

Do not write from memory or from a compaction summary. Before writing:

- Find where this work began. It may be earlier in this thread, in an older session, or in another harness. Read the user's own messages from the start, and quote them exactly where wording matters. Session logs are JSONL: Claude Code keeps them under `~/.claude/projects/<project-slug>/`, Codex under `~/.codex/sessions/YYYY/MM/DD/`. Search them for words the user used, such as the project name.
- List every request the user made, including asides ("also…", "later we should…") and anything set aside for later. This list is the checklist for step 4.
- Read the previous handoff, if any, as a claim to check, not as the source.

## 2. Promote what will still be true next month

Ask of each fact: would it still hold if this task were finished today? If so, it is standing context. Put it in the project's instructions (`AGENTS.md`, `CLAUDE.md`), README or design docs, where every session loads or finds it. At minimum that covers:

- why the project exists: the problem or frustration that started it, in the user's terms;
- the one or two outcomes it must deliver, and how to observe them;
- settled design decisions, each with its reason.

If you may not edit those files, put the text in the handoff under **Purpose** and flag it as missing from the project. The handoff then points to the standing context instead of repeating it.

## 3. Write the handoff

Rewrite the whole file to describe the current state; do not append to it. Git keeps the history. Keep to these sections, in this order, and leave none out. A section with nothing in it says so in one line.

1. **Purpose.** What the user is trying to achieve, and why, in their words. Link the original conversation. Say where success shows up for the user, not where the process reports done.
2. **Next.** The single next step, the check that shows it worked, and what it waits on. Name the item it comes from in Open requests, unless it is a fix found while working.
3. **Open requests.** Every request from step 1 that is not delivered. Give each a status: not started, in progress, deferred by the user (with date), or blocked (on what). A request the user dropped is listed once, with the date and their reason, so nobody revives it.
4. **Decisions.** What is settled, why, and who decided. Include options the user rejected. Without the reasons, the next session reopens them.
5. **State.** What exists now. Mark each claim *verified* (and where the evidence is) or *believed*. Never write an assumption as a fact; the reader will build on it.
6. **Constraints and authority.** What is already approved, what needs a fresh yes, and spending limits. Never include secrets. Name the place a credential comes from instead.
7. **Sources.** Paths and URLs: original conversations, specs, commits, transcripts, evidence. Point to them; do not copy them.
8. **Suggested skills.** Which skills the next session should load, and for what.

Use concrete paths, never "the file we discussed". Explain every coined term or drop it.

## 4. Check it against the source

- **Coverage.** Every request from step 1 appears in Open requests, in Decisions, or as delivered in State. Fix any gap before going on.
- **Cold read.** Give a reader with no context only the handoff and the repository: a subagent, or a fresh session if you have no subagents. Ask it three things: what the project is for and why, what to do next, and what it would need to ask. Its answer on purpose has to match the user's own words from step 1. If it gets the purpose wrong, or asks something the handoff should answer, revise and repeat.

Tell the user where the file is and give a one-line opener for the new session.

## When you start from a handoff

1. Read the handoff, then the standing context it points to.
2. Open the original conversation under Sources. Read the user's first messages before the rest of the trail, because a summary loses purpose first.
3. Before you build on a claim marked *verified*, check it against the code or product when it matters for your next step. Re-check anything marked *believed* before you rely on it.
4. Restate the purpose and the next step to the user in two lines before you start. If the handoff did not carry them, say so, fix the handoff, and promote the missing facts as in step 2.
