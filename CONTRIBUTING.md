# Contributing

## Scope

This project provides reusable OpenCode V2 agent definitions, a safe installer, and validation tests. Keep changes minimal, evidence-based, and compatible with Windows PowerShell 5.1 where scripts are involved.

## Safety rules

- Never commit API keys, OAuth tokens, `.env` values, credential files, private transcripts, or unrelated user configuration.
- Do not add paid API providers or blanket-approval flags (`--auto`).
- Shell-capable automation must preserve approval boundaries and avoid destructive defaults.
- Do not overwrite unrelated files in `~/.config/opencode/`.

## Development

```powershell
npm test
node --test verification/fallback.test.mjs
```

## Pull requests

- Describe what changed and why.
- Include actual command output and exit codes for checks you ran.
- Mark unverified behavior clearly (especially fallback/recovery claims).
- Keep agent permissions least-privilege and use V2 schema fields (`permissions`, `shell`, `subagent`).
- Update `CHANGELOG.md`, `ROADMAP.md`, and `docs/PROGRESS.md` when behavior/status changes.
