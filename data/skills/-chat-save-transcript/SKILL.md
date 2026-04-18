---
name: -chat-save-transcript
description: 'Save the current chat session transcript to a dated file. Use when the user asks to save, record, or preserve the chat, session, or transcript. Supports optional custom label appended to the filename.'
---

> **IMPORTANT:** Read this entire skill file from top to bottom — including the Procedure
> and all steps through the Changelog — **before** taking any action or creating the todo list. 

# Save Chat Transcript

## When to Use
- User asks to save, record, or preserve the current chat or session
- User asks for a transcript of the conversation
- User asks to log or archive the current exchange
- User supplies a custom label: `"save chat as [text]"`, `"save chat - [text]"`,
  `"save chat with [text]"`, or any similar phrasing where descriptive text follows
- User implies a desire to name the file (`"save chat as"`, `"name save chat"`, etc.)
  but provides no text → **prompt** for the label before continuing (see Step 1)
- User specifies a single turn: `"save turn 4 chat"`, `"save turn 4 as [label]"`, etc.
- User specifies a range: `"save turns 3-5 chat"`, `"save turns 2 to 6 as [label]"`, etc.

## Default Behavior
Unless the user explicitly requests otherwise, save the entire raw transcript — all turns
in chronological order, including all user messages and all assistant responses, unedited
and unfiltered.

## Content Accuracy Directives

The following directives govern how transcript content is sourced and written.
Each item states what to do (DO) and what to avoid (DON'T).

| # | Guidance Item | DO | DON'T |
|---|---------------|----|-------|
| 1 | Source fidelity | Write only content directly readable from the current session context window | Do not reconstruct, infer, or approximate content from reasoning, memory, or prior knowledge |
| 2 | Missing / compacted turns | If a turn is not accessible in context, note the gap explicitly: `[Turn N — not available in current session context]` | Do not attempt to recreate, rewrite, or approximate any turn that cannot be directly read from the current session |
| 3 | Turn text accuracy | Copy each user message and assistant response verbatim, exactly as it appears in session context | Do not paraphrase, summarize, reword, condense, or edit any turn content for any reason |
| 4 | Request interpretation | Execute the save request literally — save what is currently accessible, nothing more | Do not reason about what the user "probably wanted," infer an expanded scope, or enhance the request |
| 5 | Speculative content | Treat the session context window as the sole authoritative source for all transcript content | Do not generate, guess, fill in, or fabricate content that is not present in the accessible session context |

## Save Location
`{workspace root}\chat-sessions-saved\`
Create the folder if it does not already exist.

## Filename Format

**Without custom label:**
`[project-name]-chat-history_[YYYYMMDD]_[HH-mm].md`

**With custom label:**
`[project-name]-chat-history_[YYYYMMDD]_[HH-mm]_[custom-label].md`

- **project-name:** Derived from the workspace root folder name (the top-level folder
  in the active workspace). Do not hardcode. Example: workspace root
  `C:\Dev\VegaDrop\VegaDrop` → project name is `VegaDrop`.
- **YYYYMMDD:** Current date from system context.
- **HH-mm:** Current 24-hour time retrieved via terminal (Step 2).
- **custom-label:** Sanitized form of the user-supplied text (see Step 1 rules).

If a file with the same name already exists, append a lowercase letter suffix starting
at `a` before `.md`: `_[HH-mm]a.md` / `_[HH-mm]_[custom-label]a.md`, etc., until a
unique name is found. Never overwrite an existing transcript file.

## Custom Label Rules
- Strip leading/trailing whitespace.
- Replace all runs of whitespace with a single hyphen (`-`).
- Remove any character that is not alphanumeric, a hyphen, or an underscore.
- Collapse consecutive hyphens to one.
- Preserve the original letter casing supplied by the user — do not alter case.
- Truncate to 60 characters.
- If the result is empty after sanitization, treat the request as having no custom label.

Example: `"My Refactor Session!"` → `My-Refactor-Session`

## Turn Range Selection

By default all turns are saved. The user may restrict the save to a single turn or a
continuous range using natural language. Detection is handled in Step 1b.

| User says | Interpretation | `turnStart` | `turnEnd` |
|-----------|---------------|-------------|----------|
| `"save turn 4 chat"` | Single turn | 4 | 4 |
| `"save turns 3-5 chat"` | Range (hyphen) | 3 | 5 |
| `"save turns 3 to 5 chat"` | Range ("to") | 3 | 5 |
| `"save turns 3–5 chat"` | Range (en-dash) | 3 | 5 |
| No turn number in request | All turns | 1 | last turn number in session |

- `turnStart` and `turnEnd` are both **inclusive**.
- If the user specifies a turn number that does not exist in session context, clamp to
  the nearest valid turn and note the adjustment in the response.
- A single-turn save sets `turnStart == turnEnd`.

## Transcript Format
The format is:

**With custom label:**
```
# [custom label text]
## Chat Session Transcript
User: [username]  
Computer: [computername]  
Date: YYYY-MM-DD  
Time: HH:MM (24hr)  
AI LLM: [agent name]  
Agent: [current agent name]  
Turns: [turns-value]

---

## User
[exact user message text]

---

## Assistant
[exact assistant response text]

---

[repeat for all turns in chronological order]
```

**Without custom label:**
```
# Chat Session Transcript
User: [username]  
Computer: [computername]  
Date: YYYY-MM-DD  
Time: HH:MM (24hr)  
AI LLM: [agent name]  
Agent: [current agent name]  
Turns: [turns-value]

---

## User
[exact user message text]

---

## Assistant
[exact assistant response text]

---

[repeat for all turns in chronological order]
```

- **[custom label text]:** The raw (unsanitized) user-supplied text used as the `# H1` title.
- **Chat Session Transcript subheading:** When a custom label is present, `## Chat Session
  Transcript` appears as an H2 subheading directly below the title, above the detail items.
  When no custom label is supplied, `# Chat Session Transcript` is the H1 title and no
  subheading is used.
- **[username]:** Current OS username retrieved via terminal in Step 2.
- **[computername]:** Current machine name retrieved via terminal in Step 2.
- **[agent name]:** The name of the underlying AI model/LLM as known at time of writing
  (e.g., `GitHub Copilot — Claude Sonnet 4.6`). Do not retrieve from terminal — state it
  directly from self-knowledge.
- **[current agent name]:** The name of the active agent as known at time of writing
  (e.g., `Christian Chat`). Do not retrieve from terminal — state it directly from
  self-knowledge.
- **Header detail lines:** Each of `User:`, `Computer:`, `Date:`, `Time:`, `AI LLM:`, and `Agent:`
  must end with two trailing spaces (`  `) to produce a markdown line break, ensuring each
  item renders on its own line in both raw and rendered views. Exception: the last detail
  line (`Agent:`) does not need trailing spaces.
- **Date / Time:** Separate lines. Date is `YYYY-MM-DD`; time is `HH:MM` (colon-separated,
  24-hour) derived from the `[HH-mm]` value already captured in Step 2.
- **[turns-value]:** `Turn N` when saving exactly one turn (`turnStart == turnEnd`); `Turn X to Y`
  when saving multiple turns, where `X` = `turnStart` and `Y` = `turnEnd`. Both values come
  from Step 1b. Written by replacing the `<!-- TURNS_VALUE -->` placeholder in Step 8.

All turns must appear in full. Do not abbreviate, paraphrase, or omit any turn.

## Procedure

### Step 0 — Initialize Todo List
Create (or recreate) the session memory todo file at `/memories/session/-chat-save-transcript-todo.md`:
- If the file already exists, use `command: "delete"` to remove it first, then create fresh.
- Use `command: "create"` with the following initial content:
  ```
  # Chat Save Transcript — Todo
  - [ ] Read skill file to the end
  - [ ] Read Content Accuracy Directives
  - [x] Initialize todo list
  - [ ] Detect custom label
  - [ ] Detect turn range
  - [ ] Get current time and system info
  - [ ] Determine project name
  - [ ] Determine target filename
  - [ ] Ensure save folder exists
  - [ ] Create target file: [target path/file]
  - [ ] Verify target file exists
  - [ ] Evaluate session chat and plan write batches
  - [ ] All writes complete — verify final file
  ```

After creating the todo file, read this entire skill file to the end (through the
Changelog) using `read_file`. Reading in sequential 100-line chunks is acceptable.
Continue reading chunk by chunk until the Changelog section and the final line of the
file have been reached — **do not stop early or switch to an external tool simply
because the end has not been found yet.** Once the last chunk has been read, determine
the total line count from the highest line number present in the final `read_file`
response. **Do NOT use PowerShell, terminal commands, shell scripts, or any other
external tool to count lines — the count must come solely from the `read_file`
response.**
Use `command: "str_replace"` in the todo file to replace
`- [ ] Read skill file to the end` with
`- [x] Read skill file to the end ({N} lines)` where `{N}` is that line count.

Also count the number of rows in the **Content Accuracy Directives** table (data rows
only, excluding the header and separator rows). Use `command: "str_replace"` to replace
`- [ ] Read Content Accuracy Directives` with
`- [x] Read Content Accuracy Directives ({M} directives)` where `{M}` is that count.

### Step 1 — Detect Custom Label
Examine the user's request for a custom label:

1. **Explicit label present** — The request matches patterns like `"save chat as [text]"`,
   `"save chat - [text]"`, `"save chat with [text]"`, or any phrasing where descriptive
   text clearly follows a save-intent keyword. Extract the text after the delimiter as the
   raw label. Sanitize it per the Custom Label Rules above. Record as `[custom-label]`
   (non-empty) or discard if sanitization yields an empty string.

2. **Implied label, no text** — The request signals an intent to name the file but
   supplies no text (e.g., `"save chat as"`, `"name save chat"`). Ask the user:
   > "What label would you like to append to the filename? (Press Enter or reply 'none'
   > to save with the default name.)"
   - If the user supplies text → sanitize and use it as `[custom-label]`.
   - If the user replies with nothing, `none`, `skip`, `-`, or any blank/empty value →
     proceed with no custom label.

3. **No label signal** — Standard save request with no naming intent. Proceed with no
   custom label.

After completing label detection, use `command: "str_replace"` in the todo file to mark
`- [ ] Detect custom label` as complete (`[x]`).

### Step 1b — Detect Turn Range
Examine the user's request for a turn number or range:

1. **Single turn** — Request contains a turn reference like `"turn N"` (where N is an
   integer), regardless of surrounding punctuation or adjacent phrasing — e.g.
   `"save turn 4 chat"`, `"for turn 4, save"`, `"turn 4."`, `"turn 4 only"`. Use judgment
   to extract the integer. Set `turnStart = N`, `turnEnd = N`.

2. **Range** — Request contains two integers separated by `-`, `–`, or `to`,
   e.g. `"turns 3-5"`, `"turns 3 to 5"`, `"turns 3–5"`. Set `turnStart` and `turnEnd`
   to the lower and higher values respectively.

3. **No turn number** — No integer follows a turn-related keyword. Set `turnStart = 1`,
   `turnEnd = {last turn number in the current session context}`.

**Interaction with Step 1 (label detection):** Steps 1 and 1b parse the same request
independently. When the request combines a turn reference and a label — e.g.
`"for turn 4, save chat as My Label"` — extract each piece using judgment. The turn
reference and the label do not need to appear in any fixed order or format; use intent
to identify each. Do not allow the turn-scope clause to prevent label detection or vice versa.

After detecting, clamp both values to the valid range `[1, last turn in session]`. If
clamping changes a value, note the adjustment in the final response.

After completing turn range detection, use `command: "str_replace"` in the todo file to
mark `- [ ] Detect turn range` as complete (`[x]`).

### Step 2 — Get Current Time, Username, and Computer Name
Run in terminal:
```powershell
Get-Date -Format "HH-mm"; $env:USERNAME; $env:COMPUTERNAME
```
Record:
- Line 1: `[HH-mm]` value for the filename (e.g., `14-30`).
- Line 2: `[username]` for the transcript header.
- Line 3: `[computername]` for the transcript header.

After recording all three values, use `command: "str_replace"` in the todo file to mark
`- [ ] Get current time and system info` as complete (`[x]`).

### Step 3 — Determine Project Name
Read the workspace root folder name from the file path of the active workspace.
Do not hardcode or infer — read from context. Example:
Workspace root `C:\Development\VegaDiscoveries\VegaDrop\VegaDrop` → `VegaDrop`.

After determining the project name, use `command: "str_replace"` in the todo file to mark
`- [ ] Determine project name` as complete (`[x]`).

### Step 4 — Construct Target Path
If a `[custom-label]` was captured in Step 1:
```
{workspace root}\chat-sessions-saved\[project-name]-chat-history_[YYYYMMDD]_[HH-mm]_[custom-label].md
```
Otherwise:
```
{workspace root}\chat-sessions-saved\[project-name]-chat-history_[YYYYMMDD]_[HH-mm].md
```
Do not pre-check for collisions. Collision handling is deferred to Step 6.

**After the target path is resolved**, update the todo file using the `memory` tool:
1. Use `command: "str_replace"` to replace `- [ ] Determine target filename` with `- [x] Determine target filename`.
2. Use `command: "str_replace"` to replace `[target path/file]` with the full resolved target path.

### Step 5 — Ensure Folder Exists
```powershell
if (-not (Test-Path "{workspace root}\chat-sessions-saved")) {
    New-Item -ItemType Directory -Path "{workspace root}\chat-sessions-saved"
}
```
After the command completes, use `command: "str_replace"` in the todo file to mark
`- [ ] Ensure save folder exists` as complete (`[x]`).

### Step 6 — Create Target File
Create the target file using `create_file` with the transcript header and a
`<!-- TRANSCRIPT_BODY -->` placeholder. Use the appropriate variant:

**With custom label:**
```
# [custom label text]
## Chat Session Transcript
User: [username]  
Computer: [computername]  
Date: YYYY-MM-DD  
Time: HH:MM (24hr)  
AI LLM: [agent name]  
Agent: [current agent name]  
Turns:  <!-- TURNS_VALUE -->

---

<!-- TRANSCRIPT_BODY -->
```

**Without custom label:**
```
# Chat Session Transcript
User: [username]  
Computer: [computername]  
Date: YYYY-MM-DD  
Time: HH:MM (24hr)  
AI LLM: [agent name]  
Agent: [current agent name]  
Turns:  <!-- TURNS_VALUE -->

---

<!-- TRANSCRIPT_BODY -->
```

- Values for `[username]`, `[computername]`, `Date`, and `Time` come from Step 2.
- `[agent name]` (AI LLM) and `[current agent name]` (active agent) are both stated from agent self-knowledge (e.g., `AI LLM: GitHub Copilot — Claude Sonnet 4.6` / `Agent: Christian Chat`).
- `Date` is `YYYY-MM-DD`; `Time` is `HH:MM` (colon-separated) derived from the `[HH-mm]` value.
- Each of `User:`, `Computer:`, `Date:`, `Time:`, and `Agent:` must end with two trailing spaces (`  `) for
  markdown line breaks. `Turns:` does not require trailing spaces (it is the last detail line).

If `create_file` fails because the file already exists, append a lowercase letter suffix
before `.md` (starting at `a`: `_[HH-mm]a.md` / `_[HH-mm]_[custom-label]a.md`) and retry.
Increment (`b`, `c`, …) until a `create_file` call succeeds. If the filename changes due to
a suffix, update the todo file entry to reflect the new path.

### Step 7 — Verify Target File Exists
Run in terminal:
```powershell
Test-Path "{full resolved file path}"
```
- If `True`: update the todo file — mark both `Create target file: …` and
  `Verify target file exists` as complete (`[ ]` → `[x]` for each). Proceed to Step 8.
- If `False`: report failure — **do not proceed further. Do not evaluate the session chat.**

### Step 8 — Evaluate Session Chat and Plan Write Batches
Using `turnStart` and `turnEnd` from Step 1b, determine which turns to write.
Count of turns to write = `turnEnd − turnStart + 1`.

Determine batch plan:
- **≤ 5 turns to write:** 1 batch covering `turnStart`–`turnEnd`.
- **> 5 turns to write:** multiple batches of 5 turns each. Batch count = ⌈count ÷ 5⌉.

Update the todo file using `command: "str_replace"` to replace the line
`- [ ] All writes complete — verify final file`
with the batch task lines followed by that same line:
- For ≤ 5 turns: prepend `- [ ] Write all turns ({turnStart}–{turnEnd})`.
- For > 5 turns: prepend one line per batch (e.g., `- [ ] Write turns {turnStart}–{turnStart+4}`,
  adjusting the last range to `turnEnd`).

Also replace `<!-- TURNS_VALUE -->` in the target file:
- Single turn: `Turn {turnStart}`
- Range: `Turn {turnStart} to {turnEnd}`

Then use `command: "str_replace"` to mark `Evaluate session chat and plan write batches`
as complete in the todo file.

### Step 9 — Write Transcript (Batched or Single)
For each write batch (execute in order — complete one batch fully before starting the next):

1. **Generate content** for the turns in this batch using the Transcript Format:
   ```
   ## User
   [exact user message text]

   ---

   ## Assistant
   [exact assistant response text]

   ---
   ```

2. **Write to file** using `replace_string_in_file`:
   - **oldString:** `<!-- TRANSCRIPT_BODY -->`
   - **newString:** the batch's turn content — if more batches remain, append
     `<!-- TRANSCRIPT_BODY -->` at the end; if this is the last batch, omit it.

3. **Update todo**: use `command: "str_replace"` in the todo file to mark this batch's
   write task as complete (`- [ ] Write turns …` → `- [x] Write turns …`).

Repeat for every batch until all turns are written.

### Step 10 — Final Verify
Run in terminal:
```powershell
Test-Path "{full resolved file path}"
```
If `True`: mark `All writes complete — verify final file` as complete in the todo file.
Report success and display the full path.
If `False`: report failure — do not proceed further.
