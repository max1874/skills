---
name: diagnose
description: Diagnosis loop for hard bugs, intermittent failures, and performance regressions in a running product. Use when the user says "diagnose", "debug this", "查一下为什么", or reports something broken, failing, wrong, crashing, or slow, and a first glance did not explain it.
---

# Diagnose

Adapted from Matt Pocock's [`diagnosing-bugs`](https://github.com/mattpocock/skills/tree/main/skills/engineering/diagnosing-bugs) (mattpocock/skills, MIT License, Copyright (c) 2026 Matt Pocock). The main change: the loop reads the **running product**, not a local test suite; the product's own readings are the oracle. If the user's instructions keep test runners, lint, and type checks off their machine, the whole loop stays inside that rule.

If the user's instructions point to settings for this skill, read them first.

Work the phases in order. Each one ends on its completion criterion; a skipped phase needs a stated reason.

Before touching a component, read its recorded failure classes (the repository's `AGENTS.md`/`CLAUDE.md`, a "failure classes" or "known issues" section) and the repository's essential variable: the one or two outcomes the product exists to deliver, read from the product itself (a success record, a log line, an endpoint).

Secrets: inject keys from the environment or the user's secret manager, never by pasting values; show `<REDACTED>` wherever a value, auth header, or token would appear in a command or output you quote.

## Phase 1: a tight loop that goes red

This is the skill. With a **tight**, **red** loop the cause will be found; without one, reading code produces guesses.

Build one command that drives the real code path and checks the user's exact symptom. Ways to build it, roughly in this order:

1. **HTTP call** (`curl`, a short script) against the running local service or staging, asserting the wrong field, status, or body.
2. **CLI run** with the real input that failed, diffing output against a known-good result.
3. **Browser automation** script (Playwright, or the browser tool the agent has) that drives the UI and asserts on DOM, console, or network.
4. **Product's own record**: trigger the action, then read the success record, log line, or crash report (on macOS, `~/Library/Logs/DiagnosticReports/<App>-*.ips`) that shows the symptom.
5. **Replay** a captured payload, request, or log through the code path.
6. **Differential**: same input through the last good build or version and the current one, diff the outputs.
7. **Bisection**: the loop scripted so `git bisect run` can drive it between a known-good and a known-bad commit.
8. **The user in the loop**: when only the user can trigger it (a device, a paid account), give them one script that prompts each step and captures what they see. Last resort; their time is the cost.

Start the local services the loop needs within what the user has authorized. A usage-billed call inside the loop (model APIs, cloud jobs) needs the user's yes for that batch first.

**Tighten** it: faster (skip unrelated setup), sharper (assert the symptom, not "didn't crash"), more deterministic (pin time, inputs, network). For intermittent bugs, raise the reproduction rate (repeat 100×, parallelise, add load) until it is high enough to work against.

**Completion criterion.** You can name one command you have already run, show its redacted invocation and output, and it is:

- **red**: it fails on the user's exact symptom, and would pass once fixed;
- **deterministic**: same verdict every run, or a stated, high reproduction rate;
- **fast**: seconds, at most a minute;
- **unattended**: runs without the user, except the phase-1 item 8 case.

If you cannot build one, stop and say so: list what you tried and ask the user for one of: access to the environment that reproduces it, a captured artifact (log dump, screen recording with timestamps, crash report), or permission for temporary instrumentation in staging or production. Phase 2 waits for a red loop.

## Phase 2: reproduce and minimise

Run the loop and watch it go red. Confirm it is the **user's** symptom, not a neighbouring failure, and capture the exact output for later comparison.

Then shrink: cut inputs, steps, config, and data one at a time, re-running after each cut.

**Completion criterion:** every remaining element is load-bearing; removing any one turns the loop green.

## Phase 3: falsifiable hypotheses

Write 3–5 ranked hypotheses before testing any. Each states its prediction: "If X is the cause, then changing Y makes the bug disappear / changing Z makes it worse." A hypothesis without a prediction is discarded or sharpened.

Show the ranked list to the user in one short message; they often re-rank it at once ("we changed #3 yesterday"). Continue with your ranking while they are away.

**Completion criterion:** a ranked list where every item names its prediction.

## Phase 4: instrument

Each probe tests one prediction and changes one variable. Prefer a debugger or REPL; otherwise targeted logs at the boundaries that separate hypotheses. Tag every temporary log with one unique prefix, such as `[DEBUG-a4f2]`, so cleanup is one grep.

For performance regressions, measure first: a baseline timing, profile, or query plan, then bisect.

**Completion criterion:** one hypothesis confirmed by its prediction, the others refuted or ranked below it with evidence.

## Phase 5: fix and re-read

1. Apply the fix.
2. Re-run the phase-1 loop on the **original**, un-minimised scenario: red before, green now.
3. Run one normal successful path in the real product and read the essential variable, following the user's verification rules if they have any.
4. Regression case: add one to the repository's tests only when there is a correct seam (a test that exercises the real bug pattern as it occurs at the call site) and the risk is concrete. CI runs it; if the user's instructions forbid local test runs, it is never run locally. No correct seam is itself a finding: record it with the failure classes in Phase 6.

**Completion criterion:** the loop is green on the original scenario and the essential-variable reading is taken. Without that reading the status is "changed, unverified".

## Phase 6: clean up and record

- `grep` the debug prefix: zero hits.
- Throwaway scripts deleted, or kept outside the repository with the task artifacts.
- The confirmed hypothesis goes in the commit message or PR body, so the next debugger learns it.
- If the bug belongs to a class that could recur, add it to the repository's recorded failure classes, where the next change must pass.

Report: the loop command, red and green outputs, the confirmed cause, the essential-variable reading, and anything left unverified, in that order.
