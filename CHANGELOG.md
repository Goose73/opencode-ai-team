# Changelog

## [0.1.0] - 2026-11-07

### Added
- Initial namespaced OpenCode V2 multi-agent team: `ai-team-leader`, `ai-team-architect`, `ai-team-researcher`, `ai-team-coder`, `ai-team-tester`, `ai-team-reviewer`, `ai-team-documentation`.
- V2 permission model with read-only specialist constraints and shell approval requirements.
- Safe PowerShell 5.1 installer (`scripts/install.ps1`) with `-WhatIf`, `-ConfigRoot`, backups, conflict refusal, and opt-in default merge.
- Automated validation tests (`tests/team.test.js`) and fallback hook smoke test (`verification/fallback.test.mjs`).
- GitHub Actions Windows validation workflow.
- Project documentation: README, ROADMAP, CONTRIBUTING, PROGRESS, usage example.

### Verified
- `npm test` passed (5 tests, exit 0) on Windows PowerShell 5.1.
- Fallback hook smoke test passed (exit 0); not proof of live provider recovery.
- Real subagent delegation completed with `ai-team-researcher` (GLM free model).
- Free-model tool-call probes succeeded for configured models (exit 0).

### Not verified
- Live automatic recovery from real ChatGPT quota/429/503 errors in OpenCode 2.2.6.
- Complete end-to-end leader→all specialists coding workflow with CI/public repo state.
