'use strict';

var vscode = require('vscode');
var path = require('path');
var fs = require('fs');

function activate(context) {
  var cmd = vscode.commands.registerCommand('extension.honest-agent-setup.run', async function () {
    await showIntroPanel(context, null);
  });
  context.subscriptions.push(cmd);

  // Auto-launch the intro panel on first install of this version
  var launchedKey = 'honestAgent.launched.' + context.extension.packageJSON.version;
  if (!context.globalState.get(launchedKey)) {
    showIntroPanel(context, launchedKey);
  }
}
exports.activate = activate;

function deactivate() {}
exports.deactivate = deactivate;

// ---------------------------------------------------------------------------
// Intro webview
// ---------------------------------------------------------------------------

async function showIntroPanel(context, launchedKey) {
  var choice = await vscode.window.showInformationMessage(
    'Honest Agent: Add Agent Conduct Rules to Project',
    {
      modal: true,
      detail:
        'This will add AI agent conduct rules and enforcement structure to your project.\n\n' +
        'Files to be added:\n' +
        '  • AGENTS.md — conduct rules (project root)\n' +
        '  • .claude/CLAUDE.md — Claude reference to AGENTS.md\n' +
        '  • .github/skills/-agent-pre-response-gate/SKILL.md\n' +
        '  • .github/skills/-agent-conduct-rule-report/SKILL.md\n' +
        '  • .github/skills/-chat-save-transcript/SKILL.md\n\n' +
        'Existing files:\n' +
        '  • AGENTS.md — conduct rules will be appended\n' +
        '  • CLAUDE.md — @../AGENTS.md directive will be appended\n' +
        '  • SKILL.md files — you will be prompted before any overwrite'
    },
    'Continue'
  );

  if (choice === 'Continue') {
    if (launchedKey) context.globalState.update(launchedKey, true);
    await runSetup(context);
  } else {
    // Cancel or dismiss — clear the key so the dialog re-appears next session
    if (launchedKey) context.globalState.update(launchedKey, undefined);
  }
}

// ---------------------------------------------------------------------------
// Setup logic
// ---------------------------------------------------------------------------

async function runSetup(context) {
  // Determine target workspace root
  var workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    vscode.window.showErrorMessage(
      'Honest Agent Setup: No workspace folder is open. Please open a project folder first.'
    );
    return;
  }

  var projectRoot;
  if (workspaceFolders.length === 1) {
    projectRoot = workspaceFolders[0].uri.fsPath;
  } else {
    var picks = workspaceFolders.map(function (f) {
      return { label: f.name, description: f.uri.fsPath, folder: f };
    });
    var picked = await vscode.window.showQuickPick(picks, {
      placeHolder: 'Select the target workspace folder for the conduct rules',
      ignoreFocusOut: true
    });
    if (!picked) return;
    projectRoot = picked.folder.uri.fsPath;
  }

  var dataDir = path.join(context.extensionPath, 'data');
  var results = [];

  // --- Create required directories ---
  var dirsToEnsure = [
    path.join(projectRoot, '.claude'),
    path.join(projectRoot, '.github'),
    path.join(projectRoot, '.github', 'skills'),
    path.join(projectRoot, '.github', 'skills', '-agent-conduct-rule-report'),
    path.join(projectRoot, '.github', 'skills', '-agent-pre-response-gate'),
    path.join(projectRoot, '.github', 'skills', '-chat-save-transcript'),
    path.join(projectRoot, '.github', 'instructions')
  ];
  for (var i = 0; i < dirsToEnsure.length; i++) {
    if (!fs.existsSync(dirsToEnsure[i])) {
      fs.mkdirSync(dirsToEnsure[i], { recursive: true });
    }
  }

  // --- AGENTS.md ---
  var agentsMdTarget = path.join(projectRoot, 'AGENTS.md');
  if (fs.existsSync(agentsMdTarget)) {
    var appendContent = fs.readFileSync(path.join(dataDir, 'AgentConductRules.md'), 'utf8');
    fs.appendFileSync(agentsMdTarget, '\n\n' + appendContent, 'utf8');
    results.push({
      file: 'AGENTS.md',
      action: 'Appended conduct rules (AgentConductRules.md) to existing file'
    });
  } else {
    fs.copyFileSync(path.join(dataDir, 'AGENTS.md'), agentsMdTarget);
    results.push({ file: 'AGENTS.md', action: 'Created from template' });
  }

  // --- .claude/CLAUDE.md ---
  var claudeMdTarget = path.join(projectRoot, '.claude', 'CLAUDE.md');
  if (fs.existsSync(claudeMdTarget)) {
    // Append @../AGENTS.md directive to existing file if not already present.
    // Note: the spec says "add a directive to AGENTS.md" but appending to CLAUDE.md is
    // the functionally correct direction — CLAUDE.md is the file Claude reads to load
    // AGENTS.md. Appending @../AGENTS.md to AGENTS.md itself would create a circular
    // reference. This interpretation is disclosed in the completion summary.
    var existingClaude = fs.readFileSync(claudeMdTarget, 'utf8');
    var directive = '@../AGENTS.md';
    if (!existingClaude.includes(directive)) {
      fs.appendFileSync(claudeMdTarget, '\n' + directive + '\n', 'utf8');
      results.push({
        file: '.claude/CLAUDE.md',
        action: 'Added @../AGENTS.md directive to existing file (links Claude to conduct rules)'
      });
    } else {
      results.push({
        file: '.claude/CLAUDE.md',
        action: 'Already references AGENTS.md — no change needed'
      });
    }
  } else {
    fs.copyFileSync(path.join(dataDir, 'CLAUDE.md'), claudeMdTarget);
    results.push({ file: '.claude/CLAUDE.md', action: 'Created from template' });
  }

  // --- .github/skills/-agent-conduct-rule-report/SKILL.md ---
  var conductReportTarget = path.join(
    projectRoot, '.github', 'skills', '-agent-conduct-rule-report', 'SKILL.md'
  );
  if (fs.existsSync(conductReportTarget)) {
    var overwriteReport = await vscode.window.showWarningMessage(
      'Honest Agent Setup: .github/skills/-agent-conduct-rule-report/SKILL.md already exists.\n\n' +
      'Overwrite it with the latest version? Selecting "No" preserves any changes you have made.',
      { modal: true },
      'Yes, Overwrite',
      'No, Keep Existing'
    );
    if (overwriteReport === 'Yes, Overwrite') {
      fs.copyFileSync(
        path.join(dataDir, 'skills', '-agent-conduct-rule-report', 'SKILL.md'),
        conductReportTarget
      );
      results.push({
        file: '.github/skills/-agent-conduct-rule-report/SKILL.md',
        action: 'Overwritten with latest version'
      });
    } else {
      results.push({
        file: '.github/skills/-agent-conduct-rule-report/SKILL.md',
        action: 'Kept existing file — not overwritten'
      });
    }
  } else {
    fs.copyFileSync(
      path.join(dataDir, 'skills', '-agent-conduct-rule-report', 'SKILL.md'),
      conductReportTarget
    );
    results.push({
      file: '.github/skills/-agent-conduct-rule-report/SKILL.md',
      action: 'Created from template'
    });
  }

  // --- .github/skills/-agent-pre-response-gate/SKILL.md ---
  var preResponseTarget = path.join(
    projectRoot, '.github', 'skills', '-agent-pre-response-gate', 'SKILL.md'
  );
  if (fs.existsSync(preResponseTarget)) {
    var overwriteGate = await vscode.window.showWarningMessage(
      'Honest Agent Setup: .github/skills/-agent-pre-response-gate/SKILL.md already exists.\n\n' +
      'Overwrite it with the latest version? Selecting "No" preserves any changes you have made.',
      { modal: true },
      'Yes, Overwrite',
      'No, Keep Existing'
    );
    if (overwriteGate === 'Yes, Overwrite') {
      fs.copyFileSync(
        path.join(dataDir, 'skills', '-agent-pre-response-gate', 'SKILL.md'),
        preResponseTarget
      );
      results.push({
        file: '.github/skills/-agent-pre-response-gate/SKILL.md',
        action: 'Overwritten with latest version'
      });
    } else {
      results.push({
        file: '.github/skills/-agent-pre-response-gate/SKILL.md',
        action: 'Kept existing file — not overwritten'
      });
    }
  } else {
    // Deploy from template; reset bootstrap status if source shows "bootstrapped"
    var gateContent = fs.readFileSync(
      path.join(dataDir, 'skills', '-agent-pre-response-gate', 'SKILL.md'),
      'utf8'
    );
    gateContent = gateContent.replace(/^(Status: )bootstrapped(\s*)$/m, '$1waiting$2');
    fs.writeFileSync(preResponseTarget, gateContent, 'utf8');
    results.push({
      file: '.github/skills/-agent-pre-response-gate/SKILL.md',
      action: 'Created from template (bootstrap status reset to "waiting")'
    });
  }

  // --- .github/skills/-chat-save-transcript/SKILL.md ---
  var chatTranscriptTarget = path.join(
    projectRoot, '.github', 'skills', '-chat-save-transcript', 'SKILL.md'
  );
  if (fs.existsSync(chatTranscriptTarget)) {
    var overwriteTranscript = await vscode.window.showWarningMessage(
      'Honest Agent Setup: .github/skills/-chat-save-transcript/SKILL.md already exists.\n\n' +
      'Overwrite it with the latest version? Selecting "No" preserves any changes you have made.',
      { modal: true },
      'Yes, Overwrite',
      'No, Keep Existing'
    );
    if (overwriteTranscript === 'Yes, Overwrite') {
      fs.copyFileSync(
        path.join(dataDir, 'skills', '-chat-save-transcript', 'SKILL.md'),
        chatTranscriptTarget
      );
      results.push({
        file: '.github/skills/-chat-save-transcript/SKILL.md',
        action: 'Overwritten with latest version'
      });
    } else {
      results.push({
        file: '.github/skills/-chat-save-transcript/SKILL.md',
        action: 'Kept existing file — not overwritten'
      });
    }
  } else {
    fs.copyFileSync(
      path.join(dataDir, 'skills', '-chat-save-transcript', 'SKILL.md'),
      chatTranscriptTarget
    );
    results.push({
      file: '.github/skills/-chat-save-transcript/SKILL.md',
      action: 'Created from template'
    });
  }

  // Show completion panel
  showCompletionPanel(context, projectRoot, results);
}

// ---------------------------------------------------------------------------
// Completion webview
// ---------------------------------------------------------------------------

function showCompletionPanel(context, projectRoot, results) {
  var panel = vscode.window.createWebviewPanel(
    'honestAgentComplete',
    'Honest Agent Setup — Complete',
    vscode.ViewColumn.One,
    { enableScripts: false }
  );
  panel.webview.html = getCompletionHtml(projectRoot, results);
}

function getCompletionHtml(projectRoot, results) {
  var rows = results.map(function (r) {
    return '<tr><td><code>' + escapeHtml(r.file) + '</code></td><td>' + escapeHtml(r.action) + '</td></tr>';
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline';">
  <title>Honest Agent Setup — Complete</title>
  <style>
    body {
      font-family: var(--vscode-font-family);
      color: var(--vscode-foreground);
      background: var(--vscode-editor-background);
      padding: 24px 28px;
      max-width: 800px;
      margin: 0 auto;
      line-height: 1.5;
    }
    h1 { color: var(--vscode-editor-foreground); font-size: 1.35em; margin-bottom: 0.4em; }
    h2 { color: var(--vscode-editor-foreground); font-size: 1.05em; margin-top: 1.6em; margin-bottom: 0.5em; }
    p, li { line-height: 1.65; margin: 0.3em 0; }
    ul, ol { padding-left: 1.4em; }
    code {
      background: var(--vscode-textCodeBlock-background);
      padding: 1px 5px;
      border-radius: 3px;
      font-family: var(--vscode-editor-font-family);
      font-size: 0.9em;
    }
    .success-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      background: var(--vscode-editorWidget-background);
      border-left: 3px solid var(--vscode-testing-iconPassed, #4caf50);
      padding: 10px 14px;
      margin-bottom: 18px;
      border-radius: 0 4px 4px 0;
      font-size: 1em;
      font-weight: 600;
    }
    table { border-collapse: collapse; width: 100%; margin: 10px 0; }
    th {
      text-align: left;
      padding: 7px 10px;
      background: var(--vscode-editorWidget-background);
      border: 1px solid var(--vscode-panel-border);
    }
    td { padding: 7px 10px; border: 1px solid var(--vscode-panel-border); vertical-align: top; }
    .note {
      background: var(--vscode-editorWidget-background);
      border-left: 3px solid var(--vscode-focusBorder, #007acc);
      padding: 10px 14px;
      margin: 12px 0;
      border-radius: 0 4px 4px 0;
      font-size: 0.95em;
    }
    kbd {
      background: var(--vscode-keybindingLabel-background);
      color: var(--vscode-keybindingLabel-foreground);
      border: 1px solid var(--vscode-keybindingLabel-border, #ccc);
      border-radius: 3px;
      padding: 1px 5px;
      font-size: 0.85em;
    }
    hr { border: none; border-top: 1px solid var(--vscode-panel-border); margin: 20px 0; }
    .small-note {
      font-size: 0.88em;
      color: var(--vscode-descriptionForeground);
      margin-top: 8px;
    }
  </style>
</head>
<body>
  <div class="success-banner">&#10003; Honest Agent: Agent Conduct Setup Complete</div>

  <p>Files processed in <code>${escapeHtml(projectRoot)}</code>:</p>

  <table>
    <tr><th>File</th><th>Action Taken</th></tr>
    ${rows}
  </table>

  <p class="small-note">
    Note: When <code>.claude/CLAUDE.md</code> already existed, the <code>@../AGENTS.md</code>
    directive was appended to the existing <code>CLAUDE.md</code> (rather than to
    <code>AGENTS.md</code>). This is the functionally correct direction: Claude reads
    <code>CLAUDE.md</code> to load <code>AGENTS.md</code>. If this was not the intended
    behaviour, add <code>@../AGENTS.md</code> to <code>.claude/CLAUDE.md</code> manually.
  </p>

  <hr>

  <h2>Next Step: Apply Changes to Copilot</h2>
  <div class="note">
    <p>
      <strong>Run <code>/clear</code> in a GitHub Copilot Chat window</strong> to reload the
      agent context. This causes Copilot to pick up the new instructions, skills, and conduct
      rules added to your project.
    </p>
    <ol>
      <li>
        Open a Copilot Chat panel — press <kbd>Ctrl+Alt+I</kbd> or click the Copilot icon in
        the Activity Bar.
      </li>
      <li>Type <code>/clear</code> and press <kbd>Enter</kbd>.</li>
      <li>
        The agent conduct rules are now active for all subsequent Copilot Agent sessions in
        this project.
      </li>
    </ol>
    <p>
      On the first Copilot session after setup, the agent will read
      <code>.github/skills/-agent-pre-response-gate/SKILL.md</code> and automatically create
      the companion auto-attach instruction file at
      <code>.github/instructions/-agent-pre-response-gate.instructions.md</code>.
      After that, the gate is active on every turn without any manual step.
    </p>
  </div>

  <hr>

  <h2>How to Generate an Agent Conduct Rule Report</h2>
  <p>
    At the end of any Copilot Agent session, ask the agent to produce a conduct report.
    In the Copilot Chat panel, type:
  </p>
  <div class="note">
    <code>Generate a conduct report for this session</code>
  </div>
  <p>The agent will:</p>
  <ol>
    <li>Read the session violation log from its memory.</li>
    <li>
      Generate a dated markdown report in <code>./ClaudeConductRulesEffect/</code> in your
      project, showing which conduct rules fired, what agent actions they prevented, and how
      they shaped the session outputs.
    </li>
    <li>List all 22 Forbidden Rules and 4 Avoid Patterns, noting which were triggered and which were not.</li>
  </ol>
  <p>
    The report skill is at
    <code>.github/skills/-agent-conduct-rule-report/SKILL.md</code> and can be customised
    for your team's needs.
  </p>
</body>
</html>`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
