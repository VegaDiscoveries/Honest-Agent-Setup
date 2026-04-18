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

---

## Two-Phase Gate Architecture

This gate governs two independent mandatory phases on every turn. Neither phase satisfies the other, and neither may be deferred or skipped.

| Phase | When it runs | What it does |
|---|---|---|
| **Turn-Open Phase** | MANDATORY FIRST TOOL CALL — before any task work | Performs Turn 1 setup (violations log); no action on subsequent turns |
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

1. Evaluate the forming response against all conduct rules F-1–F-22 and avoid patterns A-1–A-4 embedded in user `AGENTS.md`.
2. If the always-check skill subset above contains active entries, evaluate the forming response against each listed skill.
3. **If all checks pass:** deliver the response.
4. **If any check fails:** re-draft the response to eliminate the violation before delivering. If a violation cannot be eliminated after re-drafting, add an entry in the conduct violations log (`/memories/session/conduct-violations.md`) and disclose the issue to the user before delivering.

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
