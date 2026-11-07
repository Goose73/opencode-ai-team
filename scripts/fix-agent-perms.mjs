import fs from 'node:fs';
import path from 'node:path';
const dir = '.opencode/agents';
const files = fs.readdirSync(dir).filter(f => f.startsWith('ai-team-') && f.endsWith('.md'));
const secretExtra = [
  '  - action: read', '    resource: "*id_rsa*"', '    effect: deny',
  '  - action: read', '    resource: "*.p12"', '    effect: deny',
  '  - action: read', '    resource: "*.pfx"', '    effect: deny',
  '  - action: read', '    resource: "*.netrc"', '    effect: deny',
  '  - action: read', '    resource: "*secret*"', '    effect: deny',
  '  - action: read', '    resource: "*credential*"', '    effect: deny',
].join('\n');
for (const f of files) {
  const p = path.join(dir, f);
  let s = fs.readFileSync(p, 'utf8');
  s = s.replace(/^  - action: webfetch\r?\n    resource: "\*"\r?\n    effect: allow$/m, '  - action: webfetch\n    resource: "*"\n    effect: ask');
  if (!s.includes('*id_rsa*')) s = s.replace(/(  - action: read\r?\n    resource: "\*\.key"\r?\n    effect: deny)/, '$1\n' + secretExtra);
  if (f === 'ai-team-documentation.md') {
    s = s.replace(/  - action: edit\r?\n    resource: README\.md\r?\n    effect: allow\r?\n  - action: edit\r?\n    resource: ROADMAP\.md\r?\n    effect: allow\r?\n  - action: edit\r?\n    resource: CHANGELOG\.md\r?\n    effect: allow\r?\n  - action: edit\r?\n    resource: CONTRIBUTING\.md\r?\n    effect: allow\r?\n  - action: edit\r?\n    resource: "docs\/\*"\r?\n    effect: allow/,
      ['  - action: edit','    resource: "*README.md"','    effect: allow',
       '  - action: edit','    resource: "*ROADMAP.md"','    effect: allow',
       '  - action: edit','    resource: "*CHANGELOG.md"','    effect: allow',
       '  - action: edit','    resource: "*CONTRIBUTING.md"','    effect: allow',
       '  - action: edit','    resource: "*docs/*"','    effect: allow',
       '  - action: edit','    resource: "docs/*"','    effect: allow'].join('\n'));
  }
  fs.writeFileSync(p, s);
  console.log('updated', f);
}
