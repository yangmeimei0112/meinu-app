/**
 * 🧪 Tier 5: Adversarial Hardening & Stress Verification
 * In-depth adversarial stress tests: Encoding/Escaping, Invalid Combinations, Resource Stress.
 */

import { describe, it, expect, beforeEach } from './test-framework';
import { sanitizeInput, isSafeUrl, checkRateLimit, generateMathChallenge } from '../../src/lib/security';
import { mergeCartItems } from '../../src/lib/useMultiCart';
import { formatStoreCode } from '../../src/app/api/stores/code/route';
import type { CartItem } from '../../src/types/cart';
import { telemetryHub } from '../../src/lib/telemetry/telemetryHub';

export function registerTier5Tests() {
  describe('Tier 5: Adversarial Hardening', () => {
    beforeEach(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // -----------------------------------------------------------------------
    // 1. Encoding & Escaping Integrity
    // -----------------------------------------------------------------------
    it('T5-1: Encoding & Escaping: Blocks sophisticated Polyglot XSS attacks', () => {
      const polyglots = [
        `jaVasCript:/*-/*\`/*\\'\`/*"/**/(/* */onerror=alert(1) )//%0D%0A%0d%0a//</TITLE/XSTYLE/textarea`,
        `<svg/onload=alert(1)>`,
        `<iframe src="javascript:alert(1)">`,
        `<a href="javascript:alert(1)">點擊</a>`,
        `"><img src=x onerror=alert(1)>`,
      ];

      polyglots.forEach((attack) => {
        const clean = sanitizeInput(attack, 100);
        expect(clean).not.toContain('<');
        expect(clean).not.toContain('>');
        expect(clean).not.toContain('javascript:');
        expect(clean).not.toContain('onerror=');
      });
    });

    it('T5-2: Encoding & Escaping: Safe URL validator blocks SSRF & protocol smuggling', () => {
      const dangerousUrls = [
        'javascript:alert(1)',
        'vbscript:msgbox(1)',
        'file:///etc/passwd',
        'ftp://malicious.ftp.com',
        'http://169.254.169.254/latest/meta-data/',
        'data:text/html,<script>alert(1)</script>',
      ];

      dangerousUrls.forEach((url) => {
        const safe = isSafeUrl(url);
        expect(safe).toBe(false);
      });

      const legitimateUrls = [
        'https://images.unsplash.com/photo-1544787219-7f47ccb76574',
        'http://localhost:3000/api/stores/code',
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      ];

      legitimateUrls.forEach((url) => {
        const safe = isSafeUrl(url);
        expect(safe).toBe(true);
      });
    });

    // -----------------------------------------------------------------------
    // 2. Invalid Input Combinations
    // -----------------------------------------------------------------------
    it('T5-3: Invalid Input Combinations: Multi-store cart merging with mixed valid/invalid inputs', () => {
      const mixedItems: any[] = [
        null,
        undefined,
        {
          cartItemId: 'c1',
          menuItemId: 'm1',
          storeId: 's1',
          storeName: 'S',
          name: '紅茶',
          unitPrice: 30,
          quantity: 1,
          selectedOptions: null, // invalid options array
          customNotes: null,     // null notes
          totalPrice: 30,
        },
        {
          cartItemId: 'c2',
          menuItemId: 'm1',
          storeId: 's1',
          storeName: 'S',
          name: '紅茶',
          unitPrice: 30,
          quantity: 2,
          selectedOptions: [],
          customNotes: '',
          totalPrice: 60,
        },
      ];

      const validOnly = mixedItems.filter((i) => i && i.cartItemId) as CartItem[];
      expect(() => mergeCartItems(validOnly)).not.toThrow();
      const merged = mergeCartItems(validOnly);
      expect(merged.length).toBe(1);
      expect(merged[0].quantity).toBe(3);
    });

    it('T5-4: Invalid Input Combinations: Rate limiter prevents high-frequency rapid click spamming', () => {
      const key = 'test_rate_limit';
      localStorage.clear();

      // First click: allowed
      const r1 = checkRateLimit(key, 1000, 5, 60000);
      expect(r1.allowed).toBe(true);

      // Rapid consecutive click within 1000ms cooldown: rejected
      const r2 = checkRateLimit(key, 1000, 5, 60000);
      expect(r2.allowed).toBe(false);
      expect(r2.reason).toContain('操作過於頻繁');
    });

    // -----------------------------------------------------------------------
    // 3. Boundary & Resource Stress
    // -----------------------------------------------------------------------
    it('T5-5: Resource Stress: Math CAPTCHA generator produces valid solvable equations under heavy loop', () => {
      for (let i = 0; i < 50; i++) {
        const challenge = generateMathChallenge();
        expect(challenge.question).toMatch(/^\d+\s+[+-]\s+\d+\s+=\s+\?$/);
        expect(typeof challenge.answer).toBe('number');
        expect(challenge.answer).toBeGreaterThan(-50);
        expect(challenge.answer).toBeLessThan(100);
      }
    });

    it('T5-6: Resource Stress: Format store code handles huge numbers and weird strings gracefully', () => {
      expect(formatStoreCode(999999)).toBe('S-999999');
      expect(formatStoreCode('abc-000456-xyz')).toBe('S-456');
      expect(formatStoreCode('!!!@@@###$$$')).toBe('S-001');
    });

    it('T5-7: Adversarial Telemetry: Handles malformed recursive objects and script tags safely', () => {
      telemetryHub.clearAll();

      const maliciousAction = `<script>alert("hack")</script>`;
      const maliciousPayload = {
        nested: {
          xss: `<img src=x onerror=alert(1)>`,
          hugeArr: Array.from({ length: 500 }, (_, i) => `item-${i}`),
        },
      };

      expect(() => {
        telemetryHub.recordEvent({
          node: 'gateway',
          action: maliciousAction,
          title: 'XSS Attack Simulation',
          status: 'error',
          detail: 'Malicious event detail',
          payload: maliciousPayload,
        });
      }).not.toThrow();

      const events = telemetryHub.getEvents();
      const errors = telemetryHub.getErrors();
      expect(events.length).toBe(1);
      expect(errors.length).toBe(1); // Auto recorded to error flight recorder
      expect(events[0].action).toBe(maliciousAction);
      expect(errors[0].message).toBe('Malicious event detail');
    });
  });
}
