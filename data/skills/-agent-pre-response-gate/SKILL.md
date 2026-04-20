---
name: -agent-pre-response-gate
description: 'Two-phase gate, active on every turn. Turn-Open Phase: derives turn N from context. Pre-Delivery Phase: evaluates the forming response against conduct rules in AGENTS.md; re-drafts on failure.'
---

> ⚠️ **FULL READ REQUIRED** — Do not use `endLine` limits when reading this file. If the file is too large for a single read, make additional read calls to cover all remaining lines before acting on this skill.

## Turn-Open Phase — Mandatory First Action

> ⚠️ **MANDATORY FIRST TOOL CALL** — This phase must execute before any task work begins on every turn. Cannot be deferred. If any other tool call is made before this phase completes, the gate has failed on that turn.

### Session Start Addendum

On Turn 1 only:
1. **Ensure conduct violations log** — Check whether `/memories/session/conduct-violations.md` exists. If absent, create it with the header defined in `AGENTS.md`:
   ```
   # Conduct Violation Log
   Session date: <replace with today's date in YYYY-MM-DD format>
   | Turn # | Rule # | Rule Text (brief) | What Triggered the Rule | Correction Made |
   |--------|--------|-------------------|------------------------|---------------|
   ```

2. **Create rule eval log** — Check whether `/memories/session/-agent-pre-response-gate-rule-eval.md` exists. If absent, create it with the following header and empty table. Do not populate rows here — rows are added during the Pre-Delivery Phase.
   ```
   # Pre-Response Gate — Rule Eval Log
   | Turn/Eval | F-1 | F-2 | F-3 | F-4 | F-5 | F-6 | F-7 | F-8 | F-9 | F-10 | F-11 | F-12 | F-13 | F-14 | F-15 | F-16 | F-17 | F-18 | F-19 | F-20 | F-21 | F-22 | A-1 | A-2 | A-3 | A-4 |
   |-----------|-----|-----|-----|-----|-----|-----|-----|-----|-----|------|------|------|------|------|------|------|------|------|------|------|------|------|-----|-----|-----|-----|
   ```
   **Column key:** `✓` = pass, `-` = fail.
   **Row ID format:** `T{N}-{letter}` where N is the turn number and letter is the eval sequence within that turn (A = first eval, B = second eval, C = third eval).

---

## Two-Phase Gate Architecture

This gate governs two independent mandatory phases on every turn. Neither phase satisfies the other, and neither may be deferred or skipped.

| Phase | When it runs | What it does |
|---|---|---|
| **Turn-Open Phase** | MANDATORY FIRST TOOL CALL — before any task work | Performs Turn 1 setup (violations log + rule eval log); no action on subsequent turns |
| **Pre-Delivery Phase** | Immediately before delivering the response | Evaluates response against conduct rules in `AGENTS.md`; re-drafts on failure |

**Why two phases are required:**
- The Turn-Open Phase has no composed response to evaluate — it cannot substitute for the Pre-Delivery evaluation.
- The Pre-Delivery Phase requires a composed response — it cannot run at turn open.
- Missing either phase is a gate failure on that turn, regardless of whether the other phase ran.

---

# Pre-Response Gate

## When to Use
- Always active — loaded at session start
- Fires before every response is delivered to the user, for every task type

## Forbidden Rules

Evaluate every response against every conduct rule (F-1–F-22) embedded in `AGENTS.md`. 

## Avoid Patterns — A-1 through A-4

Evaluate every response against every pattern (A-1–A-4) embedded in user `AGENTS.md`. 

## Always-Check Skill Subset

Every pass evaluates the forming response against these skills:

<!-- 
- None Yet — this section is reserved for the user to specify any additional always-check skills they want to enforce on every response, beyond the conduct rules and avoid patterns. If the user adds any skills here, the gate will evaluate against those skills on every turn as well.
- **`-example-skill`** — brief description of what this always-check skill enforces 
-->

## Pre-Delivery Phase

Fires immediately before delivering every response, on every turn.

**Eval loop** — Up to 3 evaluation passes per turn (labelled A, B, C). For each pass:

1. Evaluate the forming response against all conduct rules F-1–F-22 and avoid patterns A-1–A-4 embedded in user `AGENTS.md`.
2. Evaluate against the always-check skill subset above.
3. **Record the result** — Append a new row to `/memories/session/-agent-pre-response-gate-rule-eval.md`. Row ID is `T{N}-{letter}` (e.g., `T3-A`). For each rule column, write `✓` if the rule passed or `-` if it failed.
4. **If all checks pass:** deliver the response. Stop.
5. **If any check fails and fewer than 3 passes have been attempted:** re-draft the response to eliminate all violations, then run the next pass (next letter in sequence). Return to step 1.
6. **If any check fails and 3 passes have been attempted (A, B, C all complete):** deliver the response as-is, appended with a **Rule Eval Failure Report** block in the following format:

   ```
   ---
   ## Rule Eval Failure Report

   Evaluation reached the maximum of 3 passes without eliminating all violations.

   ### Pass History
   | Pass | Rules Failed |
   |------|-------------|
   | T{N}-A | [comma-separated list of failed rule IDs] |
   | T{N}-B | [comma-separated list of failed rule IDs, or "none" if all passed] |
   | T{N}-C | [comma-separated list of failed rule IDs] |

   ### Changes Made Between Passes
   - **A → B:** [One sentence describing what was revised and why.]
   - **B → C:** [One sentence describing what was revised and why.]

   ### Remaining Failures
   For each rule still failing after pass C:
   - **{Rule ID} — {Rule text (brief)}:** [One sentence explaining why this violation could not be eliminated.]
   ---
   ```

## Self-Activation

This skill creates a companion auto-attach instruction file on first load. The companion causes the agent to load this skill automatically on every task — no manual trigger step is needed after the first load.

### Bootstrap Procedure

> **Bootstrap short-circuit:** Before doing anything else in this procedure, locate `## Bootstrap Status` at the bottom of this file and read its value. If the value is `Status: bootstrapped`, skip all remaining steps in this procedure immediately — no `file_search` or file operations are required.

On every read of this SKILL.md, perform this check before taking any other action:

1. Check whether `.github/instructions/-agent-pre-response-gate.instructions.md` exists in the current workspace.
2. **If the file does not exist:**
   a. Create `.github/instructions/-agent-pre-response-gate.instructions.md` with the content in the block below.
   b. In this SKILL.md, update `## Bootstrap Status` (at the end of this file) to: `Status: bootstrapped`
3. **If the file already exists:** Update `## Bootstrap Status` (at the end of this file) to: `Status: bootstrapped`, then skip all remaining bootstrap steps.

### Companion File Content

Create the companion with exactly this content:

~~~markdown
---
description: "Load and apply the -agent-pre-response-gate skill on every task. These pre-response gate rules are always active."
applyTo: "**/*"
---

# Agent Pre-Response Gate — Auto-Attach

Load and apply `.github/skills/-agent-pre-response-gate/SKILL.md` at the start of every task.
These pre-response gate rules are always in effect.
~~~

## Bootstrap Status
Status: waiting
