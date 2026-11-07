# opencode-ai-team

A reusable multi-agent AI software development team for **OpenCode v2** (v2.2.6+ target), featuring orchestration, specialist subagents, native V2 permissions, and documented/runtime-fallback configuration.

> Status: **active development / locally verified core**. Public GitHub repository creation/push requires explicit user approval.

## What this provides

Seven namespaced agents (to avoid conflicts with existing global agents):

| Agent | Mode | Default model (project) | Purpose |
|---|---|---|---|
| `ai-team-leader` | primary | `openai/gpt-6-astra` (preferred) | Receives requests, plans, delegates to real subagents, tracks evidence, reports verified results |
| `ai-team-architect` | subagent | `opencode/deepseek-v4.1-flash-free` | Read-only architecture/planning |
| `ai-team-researcher` | subagent | `opencode/glm-5.3-flash-free` | Read-only research with citations |
| `ai-team-coder` | subagent | `opencode/deepseek-v4.1-flash-free` | Implements changes in leader-assigned scope |
| `ai-team-tester` | subagent | `opencode/deepseek-v4.1-flash-free` | Runs approved checks/tests in assigned scope |
| `ai-team-reviewer` | subagent | `opencode/glm-5.3-flash-free` | Read-only correctness/security review |
| `ai-team-documentation` | subagent | `opencode/iceman-free` | Updates assigned docs only |

## How it works (OpenCode V2)

- Agents are defined as Markdown files in `.opencode/agents/*.md` (project) and can be installed to `~/.config/opencode/agents/` (global).
- The leader uses OpenCode’s **real `subagent` tool** for delegation (not role-play).
- Permissions use V2 `permissions` rules with `action`/`resource`/`effect`. Read-only specialists deny `edit`, `shell`, `subagent`, and `execute`; writers keep `shell: *` as `ask` and require scope/approval discipline.
- Project config (`opencode.json`) sets the schema, default model, `default_agent: ai-team-leader`, and bounded settings (`experimental.todo`, `experimental.subagent_depth: 1`).

## Installation

### Project-local (recommended first)
Open this repository in OpenCode and select `ai-team-leader`.

### Global (namespaced, safe)
Inspect the script, then run:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/install.ps1 -WhatIf
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/install.ps1
```

Optional sandbox test:
```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/install.ps1 -ConfigRoot C:\path\to\sandbox -WhatIf
```

The installer:
- copies only `ai-team-*.md` agents;
- refuses unmanaged/modified target conflicts and unsafe config merges;
- refuses JSONC/duplicate-key/malformed config for safe merge;
- backs up files before changing them;
- does **not** remove unrelated files;
- only merges selected global defaults with `-SetDefault` (opt-in).

## Model fallback (important)

**Preferred leader model:** `openai/gpt-6-astra` (ChatGPT Plus/OpenCode integration).  
**Free fallback chain (configured, verified model IDs):** `opencode/deepseek-v4.1-flash-free` → `opencode/glm-5.3-flash-free` → `opencode/iceman-free`.

All four/three listed free models completed live harmless tool-call probes (CLI exit 0) in this environment. Fallback behavior is **not guaranteed** in all quota/error scenarios: the installed `opencode-runtime-fallback@0.3.1` plugin was audited and a provider-free hook smoke test passed, but synthetic 429/503 recovery and live host recovery were **not fully proven**. The plugin’s global config was updated to the 3-model chain with retry limits and `ai-team-*` agent mappings; a service reload/restart may be required for global changes to take effect.

If ChatGPT quota is exhausted, select a configured free model for the session or continue with a free model where supported. Do not configure paid API providers.

## Safety

- Shell commands require approval (`shell: *` → `ask` in these agents). Do not use `--auto`.
- Read-only agents cannot edit or run shell. Writers have scoped responsibilities.
- Destructive deletion (including patches that delete files), external/global changes, publishing, pushing, and deployment require explicit approval.
- Never commit credentials, `.env` values, auth tokens, global backups, or private transcripts.

## Verification (actual runs)

| Check | Result |
|---|---|
| `npm test` (unit/installer/PS parser tests) | **pass**, exit 0, 5 tests (Windows PowerShell 5.1) |
| `node --test verification/fallback.test.mjs` | **pass**, exit 0 (hook registration/cleanup smoke test only) |
| Real subagent delegation (`ai-team-researcher`, GLM free) | **pass** (completed subagent session with structured report) |
| `opencode debug agents` shows `ai-team-*` | **observed** (agents recognized) |
| Live free-model tool-call probes (Iceman/DeepSeek/GLM/MiMo) | **pass**, exit 0 (harmless glob) |
| Full 429/503 runtime fallback recovery in live OpenCode host | **not proven** |
| End-to-end leader→all specialists on a real coding task with passing tests/review | **not yet completed in this repo run** |

## Repository layout

- `.opencode/agents/` — V2 agent definitions
- `scripts/install.ps1` — safe global installer (PowerShell 5.1)
- `tests/` — Node/PowerShell validation tests
- `verification/` — fallback investigation artifacts (not proof of live recovery)
- `examples/usage.txt` — usage notes
- `.github/workflows/validate.yml` — CI validation

## Development

```powershell
npm test
```

See [CONTRIBUTING.md](CONTRIBUTING.md), [ROADMAP.md](ROADMAP.md), [CHANGELOG.md](CHANGELOG.md), and [docs/PROGRESS.md](docs/PROGRESS.md).
