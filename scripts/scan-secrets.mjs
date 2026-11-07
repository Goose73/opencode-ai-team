import fs from 'node:fs';
import path from 'node:path';
const root = process.cwd();
const pats = [
  ['gh_token', /\bgh[pousr]_[A-Za-z0-9]{20,}\b/],
  ['openai_key', /\bsk-[A-Za-z0-9]{20,}\b/],
  ['bearer', /Bearer\s+[A-Za-z0-9\-._~+/]{20,}/i],
  ['private_key_block', /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/],
  ['secret_assignment', /\b(password|passwd|secret|token|api[_-]?key)\b\s*[:=]\s*['"][^'"\s]{8,}/i],
];
const skip = new Set(['.git', 'node_modules']);
const hits = [];
function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (skip.has(e.name)) continue;
    const p = path.join(d, e.name);
    const rel = path.relative(root, p).replace(/\\/g, '/');
    if (e.isDirectory()) walk(p);
    else {
      if (/\.(png|jpg|jpeg|gif|zip|exe|dll|pdb|bin)$/i.test(e.name)) continue;
      let t; try { t = fs.readFileSync(p, 'utf8'); } catch { continue; }
      t.split(/\r?\n/).forEach((l, i) => {
        for (const [n, re] of pats) if (re.test(l)) hits.push({ type: n, file: rel, line: i + 1 });
      });
    }
  }
}
walk(root);
if (!hits.length) console.log('NO_HITS');
else for (const h of hits) console.log('HIT', h.type, h.file + ':' + h.line);
console.log('FILES_SCANNED');
