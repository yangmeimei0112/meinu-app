/**
 * 🚀 咩nu (Meinu) Platform E2E Master Test Runner
 *
 * Runs all test tiers (Tier 1 to Tier 5), generates structured reports,
 * and exits with code 0 on full success.
 *
 * Usage:
 *   npx tsx tests/e2e/runner.ts
 *   or node --import tsx/esm tests/e2e/runner.ts
 *   or node tests/e2e/runner.mjs
 */

import { registry, RunSummary } from './test-framework';
import { registerTier1Tests } from './tier1-feature-coverage';
import { registerTier2Tests } from './tier2-boundary-corner';
import { registerTier3Tests } from './tier3-pairwise-combinations';
import { registerTier4Tests } from './tier4-application-scenarios';
import { registerTier5Tests } from './tier5-adversarial-hardening';

async function main() {
  console.log('\x1b[1m\x1b[36m================================================================================\x1b[0m');
  console.log('\x1b[1m\x1b[36m  咩nu (Meinu) Platform Audit — Comprehensive E2E Test Suite Runner\x1b[0m');
  console.log('\x1b[1m\x1b[36m  Next.js 16.2.12 | React 19.2.4 | TypeScript 5 | Supabase PostgreSQL\x1b[0m');
  console.log('\x1b[1m\x1b[36m================================================================================\x1b[0m\n');

  // Register all tiers
  registerTier1Tests();
  registerTier2Tests();
  registerTier3Tests();
  registerTier4Tests();
  registerTier5Tests();

  console.log('\x1b[33m[1/5] Running Tier 1: Feature Coverage Tests (F1 - F15)...\x1b[0m');
  console.log('\x1b[33m[2/5] Running Tier 2: Boundary & Corner Cases Tests (F1 - F15)...\x1b[0m');
  console.log('\x1b[33m[3/5] Running Tier 3: Cross-Feature Pairwise Combinations...\x1b[0m');
  console.log('\x1b[33m[4/5] Running Tier 4: Real-World Workload Scenarios...\x1b[0m');
  console.log('\x1b[33m[5/5] Running Tier 5: Adversarial Hardening & Stress Verification...\x1b[0m\n');

  const startTime = Date.now();
  const summary: RunSummary = await registry.runAll(true);
  const totalDuration = Date.now() - startTime;

  console.log('\n\x1b[1m\x1b[36m================================================================================\x1b[0m');
  console.log('\x1b[1m\x1b[36m  E2E Test Execution Summary\x1b[0m');
  console.log('\x1b[1m\x1b[36m================================================================================\x1b[0m\n');

  console.log(`  \x1b[1mTotal Test Suites:\x1b[0m ${summary.suites.length}`);
  console.log(`  \x1b[1mTotal Tests Run:\x1b[0m   ${summary.total}`);
  console.log(`  \x1b[1mPassed:\x1b[0m           \x1b[32m${summary.passed}\x1b[0m`);
  console.log(`  \x1b[1mFailed:\x1b[0m           ${summary.failed > 0 ? `\x1b[31m${summary.failed}\x1b[0m` : `\x1b[32m0\x1b[0m`}`);
  console.log(`  \x1b[1mDuration:\x1b[0m         ${(totalDuration / 1000).toFixed(2)}s\n`);

  console.log('\x1b[1mSuite Breakdown:\x1b[0m');
  summary.suites.forEach((s) => {
    const statusMark = s.failedCount === 0 ? '\x1b[32m✔\x1b[0m' : '\x1b[31m✖\x1b[0m';
    console.log(`  ${statusMark} ${s.name.padEnd(45)} \x1b[32m${s.passedCount} pass\x1b[0m  ${s.failedCount > 0 ? `\x1b[31m${s.failedCount} fail\x1b[0m` : '\x1b[90m0 fail\x1b[0m'} \x1b[90m(${s.durationMs}ms)\x1b[0m`);
  });

  if (summary.failed > 0) {
    console.log('\n\x1b[1m\x1b[31m================================================================================\x1b[0m');
    console.log('\x1b[1m\x1b[31m  Detailed Failed Tests:\x1b[0m');
    console.log('\x1b[1m\x1b[31m================================================================================\x1b[0m');
    summary.suites.forEach((s) => {
      s.tests.filter((t) => !t.passed).forEach((t) => {
        console.log(`\n  \x1b[31m✖ [${s.name}] ${t.title}\x1b[0m`);
        console.log(`    \x1b[33m${t.error?.message || t.error}\x1b[0m`);
        if (t.error?.stack) {
          console.log(`    \x1b[90m${t.error.stack.split('\n').slice(1, 4).join('\n    ')}\x1b[0m`);
        }
      });
    });
  }

  console.log('\n\x1b[1m\x1b[36m================================================================================\x1b[0m');
  if (summary.failed === 0) {
    console.log('\x1b[1m\x1b[32m  ✔ ALL E2E TESTS PASSED SUCCESSFULLY! (Exit Code 0)\x1b[0m');
    console.log('\x1b[1m\x1b[36m================================================================================\x1b[0m\n');
    process.exit(0);
  } else {
    console.log(`\x1b[1m\x1b[31m  ✖ ${summary.failed} TEST(S) FAILED. (Exit Code 1)\x1b[0m`);
    console.log('\x1b[1m\x1b[36m================================================================================\x1b[0m\n');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal Runner Error:', err);
  process.exit(1);
});
