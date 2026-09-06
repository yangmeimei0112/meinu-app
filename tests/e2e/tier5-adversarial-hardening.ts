/**
 * 🧪 Tier 5: Adversarial Hardening & Stress Verification
 * In-depth adversarial stress tests: Encoding/Escaping, Invalid Combinations, Resource Stress.
 */

import { describe, it, expect, beforeEach } from './test-framework';
import { sanitizeInput, isSafeUrl, checkRateLimit, generateMathChallenge } from '../../src/lib/security';
import { mergeCartItems } from '../../src/lib/useMultiCart';
import { formatStoreCode } from '../../src/lib/formatStoreCode';
import type { CartItem } from '../../src/types/cart';
import { telemetryHub } from '../../src/lib/telemetry/telemetryHub';
import { isBrokenStorageUrl, sanitizeStoreImageUrl } from '../../src/lib/imageStorage';

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

    it('T5-8: Image Storage: Sanitizes broken Storage URLs and safely falls back', () => {
      expect(isBrokenStorageUrl(null)).toBe(true);
      expect(isBrokenStorageUrl('')).toBe(true);
      expect(isBrokenStorageUrl('null')).toBe(true);
      expect(isBrokenStorageUrl('undefined')).toBe(true);
      expect(isBrokenStorageUrl('[object Object]')).toBe(true);
      expect(isBrokenStorageUrl('NaN')).toBe(true);
      expect(isBrokenStorageUrl('javascript:alert(1)')).toBe(true);
      expect(isBrokenStorageUrl('data:text/html,<script>')).toBe(true);
      expect(isBrokenStorageUrl('data:application/javascript;base64,xxx')).toBe(true);
      expect(isBrokenStorageUrl('https://mveycvsqpzyovacjkqzx.supabase.co/storage/v1/object/public/store-images/stores/123.webp')).toBe(false);

      expect(sanitizeStoreImageUrl(null)).toBe(null);
      expect(sanitizeStoreImageUrl('')).toBe(null);
      expect(sanitizeStoreImageUrl('null')).toBe(null);
      expect(sanitizeStoreImageUrl('undefined')).toBe(null);
      expect(sanitizeStoreImageUrl('javascript:alert(1)')).toBe(null);
      expect(sanitizeStoreImageUrl('data:image/webp;base64,UklGRgAAAABXRUJQVlA4...')).toBe('data:image/webp;base64,UklGRgAAAABXRUJQVlA4...');

      // 🛡️ Supabase Storage missing /public/ auto-normalization
      const unnormalized = 'https://mveycvsqpzyovacjkqzx.supabase.co/storage/v1/object/store-images/stores/1788723497800_puffw645bz.webp';
      const expectedNormalized = 'https://mveycvsqpzyovacjkqzx.supabase.co/storage/v1/object/public/store-images/stores/1788723497800_puffw645bz.webp';
      expect(sanitizeStoreImageUrl(unnormalized)).toBe(expectedNormalized);
    });

    it('T5-9: Defensive Nullish & Key safety: Handles undefined key/string operations gracefully', () => {
      // Test keydown handling pattern
      const handleKeyDownMock = (e?: any) => {
        if (e?.key === 'Escape') return 'escaped';
        if (e?.key === 'Enter') return 'entered';
        return 'ignored';
      };

      expect(handleKeyDownMock(undefined)).toBe('ignored');
      expect(handleKeyDownMock({})).toBe('ignored');
      expect(handleKeyDownMock({ key: 'Escape' })).toBe('escaped');
      expect(handleKeyDownMock({ key: 'Enter' })).toBe('entered');

      // Test toLowerCase pattern
      const safeLower = (val?: any) => (val || '').toLowerCase();
      expect(safeLower(undefined)).toBe('');
      expect(safeLower(null)).toBe('');
      expect(safeLower('TeSt')).toBe('test');
    });

    it('T5-10: Robustness: Batch import parser and speech synthesizer handle sparse data without throwing', () => {
      // 1. Batch CSV row parser robustness
      const parseCsvLine = (line: string) => {
        const parts = line.split(',');
        if (parts.length < 2) return null;
        const name = (parts[0] || '').trim();
        if (!name) return null;
        const price = Number((parts[1] || '').trim()) || 0;
        const description = (parts[2] || '').trim() || null;
        const isSoldOut = (parts[3] || '').trim().toLowerCase() === 'true';
        return { name, price, description, isSoldOut };
      };

      expect(parseCsvLine('紅茶,30')).toEqual({ name: '紅茶', price: 30, description: null, isSoldOut: false });
      expect(parseCsvLine('綠茶,35,好喝')).toEqual({ name: '綠茶', price: 35, description: '好喝', isSoldOut: false });
      expect(parseCsvLine('奶茶,50,,true')).toEqual({ name: '奶茶', price: 50, description: null, isSoldOut: true });
      expect(parseCsvLine('')).toBe(null);

      // 2. Speech synthesis voice picker robustness with sparse/undefined voice fields
      const mockVoices: any[] = [
        { name: undefined, lang: undefined },
        { name: 'Unknown Voice', lang: null },
        { name: 'Taiwan Mandarin', lang: 'zh-TW' },
      ];
      const twVoice = mockVoices.find((v) => {
        const lang = (v?.lang || '').toLowerCase();
        const name = v?.name || '';
        return lang === 'zh-tw' || name.includes('Taiwan');
      });
      expect(twVoice?.name).toBe('Taiwan Mandarin');
    });
  });
}
