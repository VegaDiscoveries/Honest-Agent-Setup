# Honest Agent: Agent Conduct Setup

Adds AI agent conduct rules and enforcement structure to any VS Code project.

## What it does

Running the **"Honest Agent: Add Agent Conduct Rules to Project"** command deploys the following files into your open workspace:

| File | Purpose |
|------|---------|
| `AGENTS.md` | Conduct rules shared across all AI tools (Copilot, Claude, etc.) |
| `.claude/CLAUDE.md` | Claude-specific reference to AGENTS.md |
| `.github/skills/-agent-pre-response-gate/SKILL.md` | Pre-response evaluation gate |
| `.github/skills/-agent-conduct-rule-report/SKILL.md` | Session conduct report generator |

The auto-attach instruction file (`.github/instructions/-agent-pre-response-gate.instructions.md`) is created automatically by the gate skill on its first load in a Copilot Agent session.

## The conduct rules

The rules define **22 Forbidden Actions (F-1–F-22)**, **4 Avoid Patterns (A-1–A-4)**, **Evidence Standards**, and **Procedural Completeness** requirements that govern how AI agents must behave:

- Agents may not fabricate explanations, invent diagnoses, or state unconfirmed findings as confirmed.
- Agents may not skip steps in defined procedures, withhold significant process decisions, or act on inferred intent without disclosure.
- Agents may not use sycophantic opener phrases or present assumptions as near-conclusions.
- Claims must trace to evidence from the current workspace, session tool output, or explicit user statements.

## Usage

When the extension is first installed, a setup dialog appears automatically. Click **Continue** to deploy the conduct files into your open workspace.

To run setup again at any time:

1. Open the project folder you want to add conduct rules to.
2. Open the Command Palette (`Ctrl+Shift+P`).
3. Run **"Honest Agent: Add Agent Conduct Rules to Project"**.
4. Click **Continue** in the dialog.

After setup completes, run `/clear` in a Copilot Chat window to activate the rules.

## Generating a conduct report

At the end of any Copilot Agent session, type the following in Copilot Chat:

```
Generate a conduct report for this session
```

The agent reads the session violation log and generates a dated markdown report in `./ClaudeConductRulesEffect/` showing which rules fired, what they prevented, and how they shaped session outputs.

## Existing files

- **AGENTS.md already exists** — the conduct rules are appended to it.
- **CLAUDE.md already exists** — a `@../AGENTS.md` directive is appended to the existing file.
- **Either SKILL.md already exists** — you are prompted before any overwrite.
