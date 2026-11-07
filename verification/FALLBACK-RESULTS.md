# Runtime fallback simulation results

Target: installed `opencode-runtime-fallback@0.3.1`, imported from its cached `dist/v2.js` (the actual `setupV2` export, not a copied algorithm). The test is provider-free and uses stub context services. Set `OPENCODE_FALLBACK_PLUGIN` to the installed package directory to run against another cache location; absent plugin skips for CI.

## Current coverage and limitations

The simulation exercises plugin initialization, hook registration and cleanup. Source audit of cached `dist/chunk-xxy9y228.js` found `setupV22` at lines 919 onward; context hook at 1346, model.request at 1369, retry at 1379 and prompt at 1380. Fallback dispatch switches model and resumes through `session.prompt` at lines 1093-1109, and emits notification at 1114.

Synthetic 429/503 injection, per-agent deepseek→glm→iceman progression, exhaustion, context/tool-result preservation, preferred recovery and cooldown are **not established** by this test. Nor does this establish live host/provider recovery. No provider calls are made. Toast notification assertions are intentionally omitted because the V2 notification adapter is unsupported in this mock.

## Execution

`node --test verification/fallback.test.mjs` — exit code **0**; 1 passed, 0 failed, 0 skipped. This is a setup/hook-registration/cleanup smoke test only, not the recovery scenarios listed above.
