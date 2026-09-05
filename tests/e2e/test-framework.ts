/**
 * 🧪 咩nu (Meinu) E2E Test Suite Framework
 * Lightweight, zero-dependency, self-contained test engine for Node.js / TypeScript.
 */

export interface TestResult {
  title: string;
  suite: string;
  passed: boolean;
  error?: Error | any;
  durationMs: number;
}

export interface SuiteResult {
  name: string;
  tests: TestResult[];
  passedCount: number;
  failedCount: number;
  durationMs: number;
}

export interface RunSummary {
  total: number;
  passed: number;
  failed: number;
  durationMs: number;
  suites: SuiteResult[];
}

// ---------------------------------------------------------------------------
// Browser / DOM Simulation Mocks for Node.js
// ---------------------------------------------------------------------------

export class MockStorage implements Storage {
  private store: Map<string, string> = new Map();

  get length(): number {
    return this.store.size;
  }

  key(index: number): string | null {
    const keys = Array.from(this.store.keys());
    return keys[index] ?? null;
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

export class MockClassList {
  private classes: Set<string> = new Set();

  add(...tokens: string[]): void {
    tokens.forEach((t) => this.classes.add(t));
  }

  remove(...tokens: string[]): void {
    tokens.forEach((t) => this.classes.delete(t));
  }

  toggle(token: string, force?: boolean): boolean {
    if (force !== undefined) {
      if (force) {
        this.classes.add(token);
        return true;
      } else {
        this.classes.delete(token);
        return false;
      }
    }
    if (this.classes.has(token)) {
      this.classes.delete(token);
      return false;
    } else {
      this.classes.add(token);
      return true;
    }
  }

  contains(token: string): boolean {
    return this.classes.has(token);
  }

  toString(): string {
    return Array.from(this.classes).join(' ');
  }
}

export function setupTestEnvironment() {
  const g = globalThis as any;

  if (!g.localStorage || typeof g.localStorage.getItem !== 'function') {
    g.localStorage = new MockStorage();
  }
  if (!g.sessionStorage || typeof g.sessionStorage.getItem !== 'function') {
    g.sessionStorage = new MockStorage();
  }

  if (!g.document) {
    g.document = {
      documentElement: {
        classList: new MockClassList(),
      },
      createElement: (tag: string) => ({
        tagName: tag.toUpperCase(),
        classList: new MockClassList(),
      }),
    };
  }

  if (!g.window) {
    g.window = {
      localStorage: g.localStorage,
      sessionStorage: g.sessionStorage,
      document: g.document,
      location: {
        origin: 'http://localhost:3000',
        pathname: '/',
        search: '',
        hash: '',
        replaceState: () => {},
      },
      history: {
        replaceState: () => {},
        pushState: () => {},
      },
      matchMedia: (query: string) => ({
        matches: query.includes('dark') ? false : false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => true,
      speechSynthesis: {
        getVoices: () => [
          { name: 'Microsoft Yating - Chinese (Taiwan)', lang: 'zh-TW', default: true },
          { name: 'Google 國語 (臺灣)', lang: 'zh-TW', default: false },
          { name: 'Google 普通话 (中国大陆)', lang: 'zh-CN', default: false },
        ],
        speak: () => {},
        cancel: () => {},
        pause: () => {},
        resume: () => {},
      },
    };
  }
}

export function resetTestEnvironment() {
  const g = globalThis as any;
  if (g.localStorage && typeof g.localStorage.clear === 'function') {
    g.localStorage.clear();
  }
  if (g.sessionStorage && typeof g.sessionStorage.clear === 'function') {
    g.sessionStorage.clear();
  }
  if (g.document?.documentElement?.classList) {
    const list = g.document.documentElement.classList as MockClassList;
    list.remove('dark', 'theme-transitioning');
  }
}

// ---------------------------------------------------------------------------
// Assertion Library (Expect)
// ---------------------------------------------------------------------------

class Assertion {
  constructor(private actual: any, private isNot: boolean = false) {}

  get not(): Assertion {
    return new Assertion(this.actual, !this.isNot);
  }

  private fail(msg: string) {
    throw new Error(msg);
  }

  private deepEqual(a: any, b: any): boolean {
    if (Object.is(a, b)) return true;
    if (typeof a !== typeof b) return false;
    if (a === null || b === null || typeof a !== 'object') return false;
    if (Array.isArray(a) !== Array.isArray(b)) return false;

    if (Array.isArray(a)) {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        if (!this.deepEqual(a[i], b[i])) return false;
      }
      return true;
    }

    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    for (const key of keysA) {
      if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
      if (!this.deepEqual(a[key], b[key])) return false;
    }
    return true;
  }

  toBe(expected: any): void {
    const pass = Object.is(this.actual, expected);
    if (this.isNot ? pass : !pass) {
      this.fail(
        `Expected ${JSON.stringify(this.actual)} ${this.isNot ? 'NOT to be' : 'to be'} ${JSON.stringify(expected)}`
      );
    }
  }

  toEqual(expected: any): void {
    const pass = this.deepEqual(this.actual, expected);
    if (this.isNot ? pass : !pass) {
      this.fail(
        `Expected ${JSON.stringify(this.actual)} ${this.isNot ? 'NOT to equal' : 'to equal'} ${JSON.stringify(expected)}`
      );
    }
  }

  toBeTruthy(): void {
    const pass = Boolean(this.actual);
    if (this.isNot ? pass : !pass) {
      this.fail(`Expected ${JSON.stringify(this.actual)} ${this.isNot ? 'NOT to be truthy' : 'to be truthy'}`);
    }
  }

  toBeFalsy(): void {
    const pass = !this.actual;
    if (this.isNot ? pass : !pass) {
      this.fail(`Expected ${JSON.stringify(this.actual)} ${this.isNot ? 'NOT to be falsy' : 'to be falsy'}`);
    }
  }

  toBeNull(): void {
    const pass = this.actual === null;
    if (this.isNot ? pass : !pass) {
      this.fail(`Expected ${JSON.stringify(this.actual)} ${this.isNot ? 'NOT to be null' : 'to be null'}`);
    }
  }

  toBeUndefined(): void {
    const pass = this.actual === undefined;
    if (this.isNot ? pass : !pass) {
      this.fail(`Expected ${JSON.stringify(this.actual)} ${this.isNot ? 'NOT to be undefined' : 'to be undefined'}`);
    }
  }

  toBeDefined(): void {
    const pass = this.actual !== undefined;
    if (this.isNot ? pass : !pass) {
      this.fail(`Expected value ${this.isNot ? 'to be undefined' : 'to be defined'}`);
    }
  }

  toBeGreaterThan(expected: number): void {
    const pass = Number(this.actual) > expected;
    if (this.isNot ? pass : !pass) {
      this.fail(`Expected ${this.actual} ${this.isNot ? 'NOT to be greater than' : 'to be greater than'} ${expected}`);
    }
  }

  toBeGreaterThanOrEqual(expected: number): void {
    const pass = Number(this.actual) >= expected;
    if (this.isNot ? pass : !pass) {
      this.fail(
        `Expected ${this.actual} ${this.isNot ? 'NOT to be greater than or equal to' : 'to be greater than or equal to'} ${expected}`
      );
    }
  }

  toBeLessThan(expected: number): void {
    const pass = Number(this.actual) < expected;
    if (this.isNot ? pass : !pass) {
      this.fail(`Expected ${this.actual} ${this.isNot ? 'NOT to be less than' : 'to be less than'} ${expected}`);
    }
  }

  toBeLessThanOrEqual(expected: number): void {
    const pass = Number(this.actual) <= expected;
    if (this.isNot ? pass : !pass) {
      this.fail(
        `Expected ${this.actual} ${this.isNot ? 'NOT to be less than or equal to' : 'to be less than or equal to'} ${expected}`
      );
    }
  }

  toContain(item: any): void {
    let pass = false;
    if (typeof this.actual === 'string') {
      pass = this.actual.includes(String(item));
    } else if (Array.isArray(this.actual)) {
      pass = this.actual.some((x) => this.deepEqual(x, item));
    } else if (this.actual instanceof Set) {
      pass = this.actual.has(item);
    }
    if (this.isNot ? pass : !pass) {
      this.fail(`Expected ${JSON.stringify(this.actual)} ${this.isNot ? 'NOT to contain' : 'to contain'} ${JSON.stringify(item)}`);
    }
  }

  toMatch(regex: RegExp): void {
    const pass = regex.test(String(this.actual));
    if (this.isNot ? pass : !pass) {
      this.fail(`Expected "${this.actual}" ${this.isNot ? 'NOT to match' : 'to match'} regex ${regex}`);
    }
  }

  toThrow(expectedMessage?: string | RegExp): void {
    let threw = false;
    let error: any = null;
    if (typeof this.actual !== 'function') {
      this.fail('Expected actual to be a function to test throwing');
    }
    try {
      this.actual();
    } catch (e) {
      threw = true;
      error = e;
    }
    if (this.isNot ? threw : !threw) {
      this.fail(this.isNot ? `Expected function NOT to throw, but it threw: ${error}` : 'Expected function to throw, but it did not');
    }
    if (threw && expectedMessage) {
      const msg = error?.message || String(error);
      if (typeof expectedMessage === 'string' && !msg.includes(expectedMessage)) {
        this.fail(`Expected error message to contain "${expectedMessage}", got "${msg}"`);
      } else if (expectedMessage instanceof RegExp && !expectedMessage.test(msg)) {
        this.fail(`Expected error message to match ${expectedMessage}, got "${msg}"`);
      }
    }
  }
}

export function expect(actual: any): Assertion {
  return new Assertion(actual);
}

// ---------------------------------------------------------------------------
// Test Runner Engine
// ---------------------------------------------------------------------------

type TestFn = () => void | Promise<void>;
type HookFn = () => void | Promise<void>;

interface TestCase {
  title: string;
  fn: TestFn;
}

interface TestSuite {
  name: string;
  tests: TestCase[];
  beforeEachHooks: HookFn[];
  afterEachHooks: HookFn[];
  beforeAllHooks: HookFn[];
  afterAllHooks: HookFn[];
}

class TestRegistry {
  private suites: TestSuite[] = [];
  private currentSuite: TestSuite | null = null;

  describe(name: string, fn: () => void) {
    const suite: TestSuite = {
      name,
      tests: [],
      beforeEachHooks: [],
      afterEachHooks: [],
      beforeAllHooks: [],
      afterAllHooks: [],
    };
    this.suites.push(suite);
    const parentSuite = this.currentSuite;
    this.currentSuite = suite;
    try {
      fn();
    } finally {
      this.currentSuite = parentSuite;
    }
  }

  it(title: string, fn: TestFn) {
    if (!this.currentSuite) {
      this.describe('Default Suite', () => {
        this.currentSuite!.tests.push({ title, fn });
      });
    } else {
      this.currentSuite.tests.push({ title, fn });
    }
  }

  beforeEach(fn: HookFn) {
    if (this.currentSuite) this.currentSuite.beforeEachHooks.push(fn);
  }

  afterEach(fn: HookFn) {
    if (this.currentSuite) this.currentSuite.afterEachHooks.push(fn);
  }

  beforeAll(fn: HookFn) {
    if (this.currentSuite) this.currentSuite.beforeAllHooks.push(fn);
  }

  afterAll(fn: HookFn) {
    if (this.currentSuite) this.currentSuite.afterAllHooks.push(fn);
  }

  async runAll(verbose: boolean = false): Promise<RunSummary> {
    setupTestEnvironment();

    const startTime = Date.now();
    const suiteResults: SuiteResult[] = [];
    let total = 0;
    let passed = 0;
    let failed = 0;

    for (const suite of this.suites) {
      const suiteStart = Date.now();
      const testResults: TestResult[] = [];
      let suitePassed = 0;
      let suiteFailed = 0;

      // beforeAll
      for (const hook of suite.beforeAllHooks) {
        await hook();
      }

      for (const test of suite.tests) {
        total++;
        resetTestEnvironment();

        // beforeEach
        for (const hook of suite.beforeEachHooks) {
          await hook();
        }

        const tStart = Date.now();
        let testPassed = true;
        let testError: any = null;

        try {
          await test.fn();
        } catch (err) {
          testPassed = false;
          testError = err;
        }
        const duration = Date.now() - tStart;

        // afterEach
        for (const hook of suite.afterEachHooks) {
          try {
            await hook();
          } catch {}
        }

        if (testPassed) {
          passed++;
          suitePassed++;
          if (verbose) {
            console.log(`  \x1b[32m✔\x1b[0m ${test.title} \x1b[90m(${duration}ms)\x1b[0m`);
          }
        } else {
          failed++;
          suiteFailed++;
          console.log(`  \x1b[31m✖\x1b[0m ${test.title} \x1b[90m(${duration}ms)\x1b[0m`);
          console.log(`    \x1b[31mError:\x1b[0m ${testError?.message || testError}`);
          if (testError?.stack) {
            console.log(`    \x1b[90m${testError.stack.split('\n').slice(1, 4).join('\n    ')}\x1b[0m`);
          }
        }

        testResults.push({
          title: test.title,
          suite: suite.name,
          passed: testPassed,
          error: testError,
          durationMs: duration,
        });
      }

      // afterAll
      for (const hook of suite.afterAllHooks) {
        try {
          await hook();
        } catch {}
      }

      suiteResults.push({
        name: suite.name,
        tests: testResults,
        passedCount: suitePassed,
        failedCount: suiteFailed,
        durationMs: Date.now() - suiteStart,
      });
    }

    return {
      total,
      passed,
      failed,
      durationMs: Date.now() - startTime,
      suites: suiteResults,
    };
  }

  clear() {
    this.suites = [];
    this.currentSuite = null;
  }
}

export const registry = new TestRegistry();
export const describe = registry.describe.bind(registry);
export const it = registry.it.bind(registry);
export const test = registry.it.bind(registry);
export const beforeEach = registry.beforeEach.bind(registry);
export const afterEach = registry.afterEach.bind(registry);
export const beforeAll = registry.beforeAll.bind(registry);
export const afterAll = registry.afterAll.bind(registry);
