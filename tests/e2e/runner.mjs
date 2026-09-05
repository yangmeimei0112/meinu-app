/**
 * 🚀 咩nu (Meinu) Platform E2E Test Suite - Universal Node Runner
 *
 * Runs `tests/e2e/runner.ts` using Jiti loader so that TypeScript files
 * execute seamlessly across any Node.js environment without prior compilation.
 *
 * Usage:
 *   node tests/e2e/runner.mjs
 */

import { resolve } from 'node:path';
import { createJiti } from 'jiti';

const rootDir = process.cwd();
const jiti = createJiti(rootDir);

const targetRunner = resolve(rootDir, 'tests/e2e/runner.ts');

await jiti.import(targetRunner).catch((err) => {
  console.error('Failed to execute E2E test runner:', err);
  process.exit(1);
});
