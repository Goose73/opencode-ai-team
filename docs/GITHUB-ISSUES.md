# Initial GitHub Issues (create after repo exists)

Create these issues in `Goose73/opencode-ai-team` after the initial public push (requires user confirmation). Labels suggested: `setup`, `agents`, `fallback`, `testing`, `docs`, `security`.

1. **[setup] Validate OpenCode V2 agent schema and project config**
   - Confirm `.opencode/agents/ai-team-*.md` and `opencode.json` load correctly across supported OpenCode V2.2.x environments.
   - Acceptance: `opencode debug agents` shows all 7; permissions behave as documented.

2. **[agents] Verify real leader→specialist delegation end-to-end**
   - Run a small coding task where `ai-team-leader` delegates to architect/coder/tester/reviewer/documentation with actual subagent sessions and structured reports.
   - Acceptance: evidence includes session/tool results, changed paths, and check exit codes.

3. **[fallback] Prove runtime fallback on real quota/429/503 errors (OpenCode 2.2.6)**
   - Capture real failure shape (event type, status/message, agent/model identity) and confirm `opencode-runtime-fallback@0.3.1` recovery or document incompatibility.
   - Current state: config fixed (3-model chain, retry limits, patterns); live recovery **not proven**.
   - Acceptance: log/test evidence of successful recovery or a filed upstream issue with repro.

4. **[security] Review permissions and installer safety**
   - Independent review of read-only enforcement, shell approvals, secret-read denies, webfetch egress, and installer conflict/backup behavior.
   - Acceptance: findings resolved or documented with risk acceptance.

5. **[testing] Expand integration tests and CI evidence**
   - Add non-destructive integration checks (agent discovery, installer dry-run/idempotency) and publish CI status.
   - Acceptance: CI green; tests do not claim live provider recovery.

6. **[docs] Publish progress, limitations, and usage**
   - Keep README/ROADMAP/CHANGELOG/PROGRESS accurate; never claim unverified fallback/recovery.
   - Acceptance: docs match actual test evidence and known limitations.
