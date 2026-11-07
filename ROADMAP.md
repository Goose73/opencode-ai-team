# Roadmap

## Completed (local evidence)

- [x] Namespaced V2 agent definitions for Leader, Architect, Researcher, Coder, Tester, Reviewer, Documentation (`.opencode/agents/ai-team-*.md`).
- [x] V2 permission design: deny-by-default with explicit read-only vs writer behaviors; shell ask; no subagent delegation for specialists.
- [x] Safe PowerShell 5.1 global installer with `-WhatIf`, sandbox `-ConfigRoot`, conflict refusal, backups, and opt-in default merge.
- [x] Automated tests: config/permission contract, PS parser, installer sandbox/idempotency/preservation/conflict/malformed-config handling (`npm test`, exit 0).
- [x] Live free-model tool-call probes (harmless) for Iceman/DeepSeek/GLM/MiMo (exit 0).
- [x] Real subagent delegation smoke test via `ai-team-researcher` (completed).
- [x] Global fallback config updated (approved) to 3-model free chain with retry limits and `ai-team-*` mappings; backup created. Global agent install completed (approved).
- [x] GitHub Actions workflow for Windows validation.

## Active / remaining

- [ ] Prove or disprove live runtime fallback recovery for real quota/429/503 errors in OpenCode 2.2.6 (current evidence is log observations from prior controlled checks + hook smoke test only).
- [ ] Run a complete end-to-end leader→specialists coding task in this repository with actual test and review evidence.
- [ ] Create/verify public GitHub repository `Goose73/opencode-ai-team` (requires explicit push approval).
- [ ] Create GitHub Issues/project board entries for agent creation, delegation, fallback, permissions, integration testing, documentation.
- [ ] Add a safer project-level fallback example (if supported) without affecting unrelated user config.
- [ ] Improve reviewer/tester evidence capture templates.

## Known limitations

- `opencode-runtime-fallback` v0.3.1 compatibility on OpenCode 2.2.6 is **partially verified**; synthetic recovery and live quota recovery are not fully proven.
- Concurrency limits (max 2 specialists, one writer) are enforced by agent instructions, not a host semaphore.
- `npm test` includes PowerShell installer tests and is Windows-focused in CI.
- ChatGPT quota exhaustion may still interrupt a preferred Astra session before fallback engages, depending on error path.
