---
name: -agent-conduct-rule-report
description: Generate a structured session conduct report from session memory. Use when the user asks for a conduct report, rules effect report, or summary of how rules shaped the session. Reads the session violation log from /memories/session/conduct-violations.md and produces a dated markdown report file.
---

# Agent Conduct Rule Report

## When to Use
- User asks for a conduct report, rules effect report, or summary of how conduct rules shaped the current session
- User asks which rules fired during the session
- User references the conduct log or asks what violations were caught and corrected

## Inputs
- `/memories/session/conduct-violations.md` — the session violation log maintained by the conduct rules in `AGENTS.md` (and any agent-specific file that references it, e.g. `.claude/CLAUDE.md`). If this file does not exist, note that no violations were logged and generate the report with empty violation section.
- Session conversation context — used to supplement the violation log with narrative descriptions of where rules operated.

## Output File Location and Naming
- Default path: `.\AgentConductRulesEffect\` relative to the workspace root
- Filename: `Agent Conduct Rules Effect YYYYMMDD HH-MM.md`  
  - Use today's date and current time: `Get-Date -Format "HH-mm"` in a terminal call
  - Create the folder if it does not exist
- Apply the `large-file-edit` skill — the report will exceed 60 lines; use stub-then-fill creation pattern

## Report Structure

The report must contain the following sections in order. Do not omit any section.

### 1. Header Block
- Session date, project name, agent identifier
- One-paragraph overview of what the session covered and the four main effect areas

### 2. Violation Log Table
- Render the full table from `/memories/session/conduct-violations.md` verbatim
- If no rows exist, state: *"No conduct rule violations were detected and corrected during this session."*
- If the file does not exist, state: *"The session violation log was not created. This may indicate the session predates the log requirement or rules did not fire."*

### 3. Rules That Actively Shaped Agent Behavior
- For each unique Rule # in the violation log, write a subsection:
  - **Rule text** (full, from `AGENTS.md`)
  - **Effect in this session** — what the agent was about to do, what the rule prevented, what was produced instead
  - Cite the turn number from the log row if known
- If the log is empty, write this section from session context alone, noting any rules whose effects are visible in outputs

### 4. Case Studies (if applicable)
- When two or more rules from the log operated in sequence on the same topic, group them into a case study
- Describe the sequence: what was drafted → what each rule flagged → what the final output was
- Label each case study with its subject (e.g., "Trademark Finding")

### 5. Evidence Standards Applied (Block C)
- Document how Block C shaped the evidence requirements in this session
- Cite specific tool executions, responses recorded, and claims that were scoped or withheld because they lacked Block C evidence

### 6. Rules Present But Not Triggered
- List rules from F-1 through F-22 and A-1 through A-4 that were in scope but did not fire
- For each, briefly state why it was not triggered in this session
- Do not list rules that had no plausible scenario in this session

### 7. Avoid Patterns (A-1 through A-4)
- Address each pattern individually: observed or not observed, with a one-sentence justification

### 8. Overall Assessment
- 3–5 bullet points summarizing the measurable effect of the rules on session outputs
- Include one honest observation about any tension, limitation, or edge case the rules created

## Workflow

1. **Read the skill** — this file must be fully loaded before proceeding (do not skip based on partial read)
2. **Read the violation log** — load `/memories/session/conduct-violations.md` using the memory tool
3. **Get the current timestamp** — run `Get-Date -Format "HH-mm"` in a terminal to get the time for the filename
4. **Create the output folder** — `New-Item -ItemType Directory -Path ".\AgentConductRulesEffect" -Force`
5. **Create the report file with section stubs** — use `create_file`; do not write full content yet
6. **Fill each section sequentially** — use `replace_string_in_file` one section at a time per `large-file-edit` rules; no section fill may exceed ~40 lines per call
7. **Verify after each section** — run the PowerShell line-count check after each fill:
   ```powershell
   $lines = [System.IO.File]::ReadAllLines($path); Write-Host "Total lines: $($lines.Count)"; $lines | Select-Object -Last 3
   ```
8. **Confirm all stubs are replaced** — after completing all sections, scan for any remaining `[STUB-` markers:
   ```powershell
   Select-String -Path $path -Pattern "\[STUB-"
   ```
   If any remain, fill them before declaring complete.

9. **Check for `-chat-save-transcript` skill** — use `file_search` to check whether `.claude/skills/-chat-save-transcript/SKILL.md` exists in the workspace.
   - **If found:** proceed to Step 10.
   - **If not found:** note in the response that the `-chat-save-transcript` skill was not found and no session transcript was saved. Stop here.

10. **Run `-chat-save-transcript`** — load and apply the skill in full. Capture the full resolved path of the transcript file it creates.

11. **Cross-link the two output files** — once both files exist:
    - **Conduct report → transcript:** Append the following section to the conduct report file:
      ```markdown
      ---

      ## Related Files

      - **Session Transcript:** [filename](relative-path-to-transcript)
      ```
    - **Transcript → conduct report:** Append the following section to the transcript file:
      ```markdown
      ---

      ## Related Conduct Report

      - **Conduct Report:** [filename](relative-path-to-conduct-report)
      ```
    - Use workspace-relative paths for both links (relative from the workspace root, no drive letter).
    - Verify each append with a line-count check per `large-file-edit` rules.

## Changelog
- **v1.00_20260416:** Created. Generates a structured conduct report from session memory violation log.
- **v1.01_20260416:** Added Steps 9–11 to workflow. After report completion, checks for `-chat-save-transcript` skill; if found, runs it and cross-links both output files with a `## Related Files` / `## Related Conduct Report` section appended to each.
- **v1.02_20260417:** Updated all `CLAUDE.md` references to `AGENTS.md` (conduct rules are now LLM-agnostic, defined in `AGENTS.md` with agent-specific files pointing back to it). Renamed output folder from `ClaudeConductRulesEffect` to `AgentConductRulesEffect` and filename prefix from `Claude Conduct Rules Effect` to `Agent Conduct Rules Effect`.
