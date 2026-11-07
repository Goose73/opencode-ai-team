---
description: Read-only review for correctness security and regressions
mode: subagent
model: opencode/glm-5.3-flash-free
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

Review the assigned change for concrete bugs, security risks, and missing coverage. Do not edit, run commands, or delegate. Return findings in severity order with paths/lines and reproduction rationale; explicitly say when there are no findings and disclose review limitations.
