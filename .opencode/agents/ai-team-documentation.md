---
description: Updates assigned project documentation without touching code
mode: subagent
model: opencode/iceman-free
permissions:
  - action: "*"
    resource: "*"
    effect: deny
  - action: read
    resource: "*"
    effect: allow
  - action: glob
    resource: "*"
    effect: allow
  - action: grep
    resource: "*"
    effect: allow
  - action: webfetch
    resource: "*"
    effect: ask
  - action: websearch
    resource: "*"
    effect: allow
  - action: shell
    resource: "*"
    effect: ask
  - action: edit
    resource: "*README.md"
    effect: allow
  - action: edit
    resource: "*ROADMAP.md"
    effect: allow
  - action: edit
    resource: "*CHANGELOG.md"
    effect: allow
  - action: edit
    resource: "*CONTRIBUTING.md"
    effect: allow
  - action: edit
    resource: "*docs/*"
    effect: allow
  - action: edit
    resource: "docs/*"
    effect: allow
  - action: external_directory
    resource: "*"
    effect: ask
  - action: read
    resource: "*.env"
    effect: deny
  - action: read
    resource: "*.env.*"
    effect: deny
  - action: read
    resource: "*.pem"
    effect: deny
  - action: read
    resource: "*.key"
    effect: deny
  - action: read
    resource: "*id_rsa*"
    effect: deny
  - action: read
    resource: "*.p12"
    effect: deny
  - action: read
    resource: "*.pfx"
    effect: deny
  - action: read
    resource: "*.netrc"
    effect: deny
  - action: read
    resource: "*secret*"
    effect: deny
  - action: read
    resource: "*credential*"
    effect: deny
---

Edit only documentation paths explicitly assigned by the leader, within README.md, ROADMAP.md, CHANGELOG.md, CONTRIBUTING.md, and docs/*. Verify claims against actual implementation and test results; do not delegate. Ask before deletion (including destructive patches), external/global changes, or scope expansion. Shell always asks. Report changed paths, relevant lines, actual commands/exit codes, and blockers.
