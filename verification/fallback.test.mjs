import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { existsSync } from 'node:fs';

const cached = process.env.OPENCODE_FALLBACK_PLUGIN ??
  'C:\\Users\\Goose\\.cache\\opencode\\npm\\opencode-runtime-fallback@0.3.1\\1794054534888\\node_modules\\opencode-runtime-fallback';
const entry = path.join(cached, 'dist', 'v2.js');

test('installed fallback V2 setup registers hooks and disposes cleanly', async (t) => {
  if (!existsSync(entry)) return t.skip(`cached plugin absent: ${entry}`);
  const { setupV2 } = await import(pathToFileURL(entry));
  const hooks = new Map();
  const disposed = [];
  const ctx = {
    options: { enabled: true, fallback_models: ['deepseek/deepseek-chat', 'zai/glm-4.5', 'openrouter/iceman'] },
    location: { directory: process.cwd() },
    model: { list: async () => ({ data: ['deepseek/deepseek-chat', 'zai/glm-4.5', 'openrouter/iceman'].map((ref) => {
      const [providerID, modelID] = ref.split('/');
      return { providerID, modelID, enabled: true, variants: [] };
    }) }) },
    agent: { get: async () => ({ data: { model: undefined, request: { body: {} } } }) },
    session: {
      hook: async (name, callback) => { hooks.set(name, callback); return { dispose: async () => disposed.push(name) }; },
      prompt: async () => {}, interrupt: async () => ({ interrupted: true }), wait: async () => {}, switchModel: async () => {},
    },
    tool: { transform: async () => ({ dispose: async () => {} }) },
    event: { subscribe: async function* () { await new Promise(() => {}); } },
    tui: { showToast: async () => {} },
    log: { info() {}, error() {} },
  };
  const cleanup = await setupV2(ctx);
  assert.equal(typeof cleanup, 'function');
  assert.deepEqual([...hooks.keys()].sort(), ['compaction', 'context', 'http.request', 'model.request', 'prompt', 'retry']);
  await cleanup();
  assert.equal(disposed.length, 8);
});

const classifier = path.join(cached, 'dist', 'error-classifier.js');
test('classifier matches quota/rate patterns (provider-free, real implementation)', { skip: !existsSync(classifier) && 'error-classifier not found' }, async () => {
  const { isRetryableError } = await import(pathToFileURL(classifier));
  const retryOn = [429, 500, 502, 503, 504, 529];
  const patterns = ['usage\\s*limit', 'hit your usage limit', 'usage_limit_reached', 'exceeded your current quota', 'insufficient_quota', '\\bquota\\b', 'plan limit', 'rate limit', 'too many requests', 'model overloaded', 'provider overloaded'];
  assert.equal(isRetryableError({ status: 429, message: 'rate limited' }, retryOn, patterns), true);
  assert.equal(isRetryableError({ message: "You've hit your usage limit" }, retryOn, patterns), true);
  assert.equal(isRetryableError({ message: 'usage_limit_reached' }, retryOn, patterns), true);
  assert.equal(isRetryableError({ message: 'model overloaded' }, retryOn, patterns), true);
  assert.equal(isRetryableError({ message: 'syntax error in code' }, retryOn, patterns), false);
  // Limitations: does not prove hook/event timing, model inventory, or live host recovery.
});
