'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const names = ['leader', 'architect', 'researcher', 'coder', 'tester', 'reviewer', 'documentation'];
const readers = new Set(['architect', 'researcher', 'reviewer']);
const actions = ['read', 'glob', 'grep', 'websearch'];
function agent(name) {
  const file = fs.readFileSync(path.join(root, '.opencode', 'agents', `ai-team-${name}.md`), 'utf8');
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]+)$/.exec(file);
  assert.ok(match, `frontmatter and system body for ${name}`);
  const rules = [...match[1].matchAll(/^  - action: (.+)\r?\n    resource: (.+)\r?\n    effect: (.+)$/gm)]
    .map((m) => ({ action: m[1].replaceAll('"', ''), resource: m[2].replaceAll('"', ''), effect: m[3] }));
  return { frontmatter: match[1], body: match[2], rules };
}
function effect(rules, action, resource) {
  let result = 'ask';
  for (const rule of rules) {
    const matches = (pattern, target) => new RegExp(`^${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replaceAll('\\*', '.*')}$`).test(target);
    if (matches(rule.action, action) && matches(rule.resource, resource)) result = rule.effect;
  }
  return result;
}

test('config selects the namespaced leader and bounded V2 settings', () => {
  const config = JSON.parse(fs.readFileSync(path.join(root, 'opencode.json'), 'utf8'));
  assert.equal(config.$schema, 'https://opencode.ai/config.json');
  assert.equal(config.model, 'openai/gpt-6-astra');
  assert.equal(config.default_agent, 'ai-team-leader');
  assert.deepEqual(config.experimental, { todo: true, subagent_depth: 1 });
  assert.equal(config.plugins, undefined);
  assert.deepEqual(fs.readdirSync(path.join(root, '.opencode', 'agents')).sort(), names.map((n) => `ai-team-${n}.md`).sort());
});

test('agents deny by default and enforce role-specific permissions', () => {
  const models = {
    leader: 'openai/gpt-6-astra',
    architect: 'opencode/deepseek-v4.1-flash-free',
    researcher: 'opencode/glm-5.3-flash-free',
    coder: 'opencode/deepseek-v4.1-flash-free',
    tester: 'opencode/deepseek-v4.1-flash-free',
    reviewer: 'opencode/glm-5.3-flash-free',
    documentation: 'opencode/iceman-free',
  };
  for (const name of names) {
    const { frontmatter, body, rules } = agent(name);
    assert.match(frontmatter, /^description: .+$/m);
    assert.match(frontmatter, new RegExp(`^mode: ${name === 'leader' ? 'primary' : 'subagent'}$`, 'm'));
    assert.match(frontmatter, new RegExp(`^model: ${models[name].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'm'));
    assert.ok(body.trim());
    assert.deepEqual(rules[0], { action: '*', resource: '*', effect: 'deny' });
    for (const action of actions) assert.equal(effect(rules, action, 'src/example.js'), 'allow', `${name}: ${action}`);
    assert.equal(effect(rules, 'webfetch', 'https://example.com'), 'ask', `${name}: webfetch`);
    assert.equal(effect(rules, 'external_directory', '/outside/*'), 'ask');
    for (const secret of ['.env', 'src/.env.local', 'keys/private.pem', 'id.key', 'server/id_rsa', 'cert.p12', 'cert.pfx', '.netrc', 'mysecret.txt', 'dbcredential.json']) {
      assert.equal(effect(rules, 'read', secret), 'deny', `${name}: ${secret}`);
    }
    assert.equal(effect(rules, 'execute', '*'), 'deny');
    assert.equal(effect(rules, 'shell', 'git status'), readers.has(name) ? 'deny' : 'ask');
    assert.equal(effect(rules, 'edit', 'src/code.js'), readers.has(name) || name === 'documentation' ? 'deny' : 'allow');
    for (const target of names.filter((n) => n !== 'leader')) {
      assert.equal(effect(rules, 'subagent', `ai-team-${target}`), name === 'leader' ? 'allow' : 'deny');
    }
    assert.equal(effect(rules, 'subagent', 'general'), 'deny');
  }
  const docs = agent('documentation').rules;
  for (const target of ['README.md', 'ROADMAP.md', 'CHANGELOG.md', 'CONTRIBUTING.md', 'docs/deep/topic.md', '/repo/README.md', 'C:/repo/docs/x.md']) {
    assert.equal(effect(docs, 'edit', target), 'allow');
  }
  assert.equal(effect(docs, 'edit', 'src/other.js'), 'deny');
});

const ps = process.platform === 'win32' ? (fs.existsSync('C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe')
  ? 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe' : 'powershell.exe') : null;
const installer = path.join(root, 'scripts', 'install.ps1');
function run(directory, ...args) {
  return spawnSync(ps, ['-NoProfile', '-NonInteractive', '-File', installer, '-ConfigRoot', directory, ...args], { encoding: 'utf8' });
}
function mustPass(result) {
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
}
function sandbox(t) {
  const base = path.join(process.env.LOCALAPPDATA || os.tmpdir(), 'Temp', 'opencode');
  fs.mkdirSync(base, { recursive: true });
  const directory = fs.mkdtempSync(path.join(base, 'ai-team-test-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  return directory;
}

test('PowerShell 5.1 parser accepts installer', { skip: !ps }, () => {
  const command = `$t=$null;$e=$null;[System.Management.Automation.Language.Parser]::ParseFile('${installer.replaceAll("'", "''")}',[ref]$t,[ref]$e)|Out-Null;if($e.Count){$e|Out-String|Write-Error;exit 1}`;
  mustPass(spawnSync(ps, ['-NoProfile', '-NonInteractive', '-Command', command], { encoding: 'utf8' }));
});

test('installer WhatIf, idempotency, opt-in merge and preservation', { skip: !ps }, (t) => {
  const directory = sandbox(t);
  const original = { providers: { sample: { apiKey: '{env:TEST_TOKEN}' } }, other: [1, 2] };
  const configPath = path.join(directory, 'opencode.json');
  fs.writeFileSync(configPath, JSON.stringify(original));
  mustPass(run(directory, '-SetDefault', '-WhatIf'));
  assert.equal(fs.readdirSync(directory).length, 1);
  mustPass(run(directory));
  assert.deepEqual(JSON.parse(fs.readFileSync(configPath, 'utf8')), original);
  assert.equal(fs.readdirSync(path.join(directory, 'agents')).length, 7);
  const first = run(directory);
  mustPass(first);
  assert.match(first.stdout, /Already up to date/);
  mustPass(run(directory, '-SetDefault'));
  const merged = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  assert.deepEqual(merged.providers, original.providers);
  assert.deepEqual(merged.other, original.other);
  assert.equal(merged.default_agent, 'ai-team-leader');
  assert.equal(merged.experimental.todo, true);
  assert.equal(merged.experimental.subagent_depth, 1);
  assert.match(run(directory, '-SetDefault').stdout, /Already up to date/);
  assert.ok(fs.readdirSync(directory).some((name) => name.startsWith('opencode.json.backup.')));
  const leader = path.join(directory, 'agents', 'ai-team-leader.md');
  fs.appendFileSync(leader, '\nuser customization');
  assert.notEqual(run(directory).status, 0);
  assert.match(fs.readFileSync(leader, 'utf8'), /user customization$/);
});

test('installer refuses unmanaged file conflicts and malformed or duplicate config', { skip: !ps }, (t) => {
  const directory = sandbox(t);
  const agentDir = path.join(directory, 'agents');
  fs.mkdirSync(agentDir);
  const conflict = path.join(agentDir, 'ai-team-leader.md');
  fs.writeFileSync(conflict, 'user file');
  assert.notEqual(run(directory).status, 0);
  assert.equal(fs.readFileSync(conflict, 'utf8'), 'user file');
  fs.rmSync(conflict);
  const configPath = path.join(directory, 'opencode.json');
  for (const value of ['{"model":"a","model":"b"}', '{"model": "a",}', '{// comment\n"model":"a"}', '{invalid']) {
    fs.writeFileSync(configPath, value);
    assert.notEqual(run(directory, '-SetDefault').status, 0, value);
    assert.equal(fs.readFileSync(configPath, 'utf8'), value);
  }
  fs.writeFileSync(configPath, '{"default_agent":"custom"}');
  assert.notEqual(run(directory, '-SetDefault').status, 0);
  assert.equal(JSON.parse(fs.readFileSync(configPath, 'utf8')).default_agent, 'custom');
  fs.rmSync(configPath);
  const jsoncPath = path.join(directory, 'opencode.jsonc');
  fs.writeFileSync(jsoncPath, '{"providers":{}}');
  assert.notEqual(run(directory, '-SetDefault').status, 0);
  assert.equal(fs.existsSync(configPath), false);
});
