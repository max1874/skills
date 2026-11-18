---
name: codex-worker-guide
description: "How to call a Codex CLI worker: dispatch one well-specified implementation, test, refactor, or CI work order to a single leaf Codex worker, then review every line it wrote. Load only AFTER the decision to delegate to Codex is made — the user named Codex or the parent explicitly chose it; never auto-trigger on task size or type. Uses the user's model and effort if given, else the newest Sol model in Codex's own catalog at high; fast and ultrafast modes always off. Not for unresolved design, tiny obvious edits, session-only tools or secrets, releases, pushes, merges, or from inside a routed worker."
---

# Codex Worker Guide

How to call a Codex worker once the decision to delegate is made; it never
argues for delegating. The parent keeps architecture, scope, integration, Git
and GitHub writes, and the review.

## Hard Gates

1. A worker never delegates again. The runner refuses when
   `CODEX_WORKER_GUIDE_DEPTH` is non-zero. Codex 0.166 offers `spawn_agent`
   with no switch to remove it, so the contract forbids it and the runner
   prints `sub_agents_spawned`; a non-zero count fails the review.
2. Freeze design first. If writing the work order still needs an architecture
   or scope choice, that work stays in the parent.
3. One writer per worktree; the runner holds a per-worktree lock. Parallel
   writers need separate worktrees.
4. Model and effort are each the user's exact value when given. Otherwise the
   model is the runner's default — the listed `*-sol` model with the lowest
   `priority` in Codex's catalog `~/.codex/models_cache.json`, so it follows
   Codex releases (`gpt-6.1-sol` if the catalog is unreadable) — and effort is
   `high`. Never choose by task, resolve aliases, upgrade, downgrade, or fall
   back: a CLI rejection fails the dispatch. Fast and ultrafast modes are always
   off. State model and effort before dispatch.
5. The worker does not commit, push, merge, edit PR metadata, touch secrets, or
   run destructive operations.

## Prepare

Delegating is not a reason to restart the repository lifecycle: with design
frozen, dispatch within about five minutes. Do only this:

- a clean feature-branch worktree from the worktree command the user's
  instructions name (otherwise `git worktree add`), never Codex's
  `--worktree` or another host worktree feature
- read the plan, rules, and source needed to fix ownership and invariants
- write the work order to a file outside the worktree
- decide what the parent does meanwhile, outside the worker's write scope

No plan rewrite, full review, local baseline suite, process artifact, or
dispatch-only commit because this guide was loaded; take a baseline from
existing CI when one matters.

The worker loads `~/.codex/AGENTS.md` and the repository's `AGENTS.md`
itself, so the work order carries only what is specific to the task:

```markdown
# Goal
<one concrete implementation outcome>

# Identity
- Worktree: <absolute path>
- Branch: <branch>
- Base: <sha>

# Read First
<source, tests, plans, module docs>

# Ownership
- Owned files: <exact paths>
- Forbidden: <paths and actions>

# Invariants And Counterexamples
<state, temporal, failure, cleanup, retry, and compatibility obligations>

# Verification
- CI: <checks that must pass on the final commit>
- Expected: <observable result; what stays unverified>

# Output
Files changed, commands run, exact results, unresolved risks.
```

## Dispatch

Run the runner in this skill's directory (`<skill-dir>` below) as a background
task; its exit is the completion event, so do not poll.

```bash
"<skill-dir>/scripts/run_codex_worker.sh" \
  start [--model <model>] [--effort <effort>] [--sandbox <mode>] \
  <absolute-worktree> <work-order-file> [run-directory]
```

The worker runs unsandboxed (`danger-full-access`) by default, so it can reach
the network, ssh, and tool caches outside the worktree; ownership and the
forbidden actions bind it through the work order. Pass
`--sandbox workspace-write` to confine writes to the worktree.

The runner:

- refuses a dirty worktree, a protected branch (`main`, `master`, `dev`,
  `stg`), a held or stale writer lock, or nested delegation, naming which;
- runs `codex update` first when npm has a newer CLI, recording the result in
  `request.txt` and continuing on the installed version if the check or update
  fails;
- keeps `request.txt`, `work-order.md`, `events.jsonl`, `stderr.log`,
  `last-message.md`, and `session-id.txt` in
  `~/.local/share/codex-worker-guide/runs/<time>-<repo>-<branch>/` and prints
  the path.

Do not repeat an identical failed dispatch without a state change, and remove
a reported lock only after `ps` shows no writer owns that worktree.

Read `stderr.log`. Two errors are known noise when `events.jsonl` keeps
progressing: `codex_models_manager ... failed to refresh available models:
request timed out` (Codex runs on its cached catalog) and `rmcp::transport ...
chatgpt.com/backend-api/ps/mcp`. Accepted flags prove the requested
configuration only; neither events nor the worker's self-description attest
the resolved one.

To stop a run, SIGTERM the runner (stop its background task): it stops Codex,
records the session ID, and releases the lock. A model or effort change the
user requests mid-run is a stop plus a resume with the new values.

## Review

Codex's code is a draft until the parent has read every line of it. Review it;
do not rewrite it, which spends both sides' tokens.

1. Read the runner's output, `request.txt`, `stderr.log`, and
   `last-message.md`, then confirm
   worktree, branch, HEAD, and changed-file scope with
   `git status --short --branch` and the real diff. The worker's summary is
   not evidence.
2. Bug-free is the precondition: read every changed line, the complete changed
   files and relevant tests, and every coupled reader, writer, and consumer.
3. For a core-path or nontrivial change, also run
   `/code-review high <absolute-worktree>` alongside your own read, as the
   independent reviewer. Always name the level (without one it reuses the last
   level typed) and never pass `--fix` or `--comment`. Confirm its scope matches
   the worker's diff, then verify every finding in the code: a confirmed one is
   handled like your own (step 4); report dropped false positives in one line.
4. Then taste: hold it to the code standard in the user's instructions
   (`AGENTS.md`, `CLAUDE.md`). Accept what meets it as is; edit small shortfalls
   yourself and send larger ones back as a follow-up.
5. Read the specified CI and read-only evidence. A required check that skipped
   or is still pending is unverified.
6. Report what you changed and why, or that it was accepted as is.

A follow-up resumes the exact session with the start run's `requested_model`
and effort passed explicitly, since the catalog default can move between runs:

```bash
"<skill-dir>/scripts/run_codex_worker.sh" \
  resume --model <same-model> --effort <same-effort> \
  <absolute-worktree> <session-id> <follow-up-file> [run-directory]
```

Never `resume --last`; concurrent runs can pick the wrong session. If a
correction reveals a wrong premise, revise the brief or take the work back.
Report real blockers; do not widen scope or switch configuration silently, and
do not abandon solvable work over a round count.

## Closeout

Only the parent stages specific paths, commits, pushes, creates or edits the
PR, and watches CI. Report configuration as:

```text
Requested: <model> / <effort> / fast and ultrafast off
CLI: <cli_version from request.txt> (<cli_update>)
CLI acceptance: accepted | rejected
Resolved model / effort: <attested values> | not_exposed
```
