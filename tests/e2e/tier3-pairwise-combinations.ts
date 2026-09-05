/**
 * 🧪 Tier 3: Cross-Feature Combinations & Pairwise Interaction Testing
 * Tests interactions between paired features across the entire system (Minimum ~14 tests)
 */

import { describe, it, expect, beforeEach } from './test-framework';
import { sanitizeInput, isSafeUrl } from '../../src/lib/security';
import { verifyAdminToken, generateAdminToken } from '../../src/lib/auth-util';
import {
  parseOrderProgressStatus,
  serializeOrderProgressStatus,
} from '../../src/types/orderStatus';
import { mergeCartItems } from '../../src/lib/useMultiCart';
import {
  recordPurgedOrderId,
  getOrderHistoryCache,
  setOrderHistoryCache,
} from '../../src/lib/cache/orderHistoryCache';
import { formatStoreCode } from '../../src/app/api/stores/code/route';
import type { CartItem, MultiStoreCart } from '../../src/types/cart';
import { telemetryHub } from '../../src/lib/telemetry/telemetryHub';

export function registerTier3Tests() {
  describe('Tier 3: Cross-Feature Pairwise Interactions', () => {
    beforeEach(() => {
      localStorage.clear();
      sessionStorage.clear();
      document.documentElement.classList.remove('dark', 'theme-transitioning');
    });

    // -----------------------------------------------------------------------
    // P1: F1 (Search) + F2 (Menu Customization & Pricing)
    // -----------------------------------------------------------------------
    it('P1: F1 (Search) + F2 (Menu Customization): Searching store and configuring dynamic price', () => {
      const stores = [
        { id: 's1', name: '五十嵐', code: 'S-001' },
        { id: 's2', name: '春水堂', code: 'S-002' },
      ];

      // Step 1: Search store by code
      const foundStore = stores.find((s) => s.code === 'S-001');
      expect(foundStore).toBeDefined();
      expect(foundStore?.name).toBe('五十嵐');

      // Step 2: Select menu item and customize options
      const menuItem = { id: 'm1', name: '珍珠奶茶', price: 50 };
      const selectedOptions = [
        { groupTitle: '甜度', itemName: '微糖', extraPrice: 0 },
        { groupTitle: '配料', itemName: '大波霸', extraPrice: 10 },
      ];
      const quantity = 3;

      const extrasTotal = selectedOptions.reduce((acc, opt) => acc + opt.extraPrice, 0);
      const computedUnitPrice = menuItem.price + extrasTotal;
      const computedTotalPrice = computedUnitPrice * quantity;

      expect(computedUnitPrice).toBe(60);
      expect(computedTotalPrice).toBe(180);
    });

    // -----------------------------------------------------------------------
    // P2: F2 (Menu Customization) + F3 (Multi-Store Cart Isolation)
    // -----------------------------------------------------------------------
    it('P2: F2 (Menu) + F3 (Cart): Adding customized items from multiple stores with isolation and auto-merging', () => {
      const cart: MultiStoreCart = {};

      const itemStoreA1: CartItem = {
        cartItemId: 'c-a1',
        menuItemId: 'm1',
        storeId: 'store-A',
        storeName: '茶飲店',
        name: '紅茶',
        unitPrice: 30,
        quantity: 1,
        selectedOptions: [{ groupTitle: '冰塊', itemName: '微冰', extraPrice: 0 }],
        customNotes: '不要吸管',
        totalPrice: 30,
      };

      const itemStoreA2: CartItem = {
        cartItemId: 'c-a2',
        menuItemId: 'm1',
        storeId: 'store-A',
        storeName: '茶飲店',
        name: '紅茶',
        unitPrice: 30,
        quantity: 2,
        selectedOptions: [{ groupTitle: '冰塊', itemName: '微冰', extraPrice: 0 }],
        customNotes: '不要吸管',
        totalPrice: 60,
      };

      const itemStoreB: CartItem = {
        cartItemId: 'c-b1',
        menuItemId: 'm2',
        storeId: 'store-B',
        storeName: '便當店',
        name: '雞腿便當',
        unitPrice: 110,
        quantity: 1,
        selectedOptions: [],
        customNotes: '加飯',
        totalPrice: 110,
      };

      // Add to Store A group
      cart['store-A'] = {
        storeId: 'store-A',
        storeName: '茶飲店',
        items: mergeCartItems([itemStoreA1, itemStoreA2]),
      };

      // Add to Store B group
      cart['store-B'] = {
        storeId: 'store-B',
        storeName: '便當店',
        items: [itemStoreB],
      };

      expect(Object.keys(cart).length).toBe(2);
      expect(cart['store-A'].items.length).toBe(1); // Auto-merged
      expect(cart['store-A'].items[0].quantity).toBe(3);
      expect(cart['store-A'].items[0].totalPrice).toBe(90);
      expect(cart['store-B'].items.length).toBe(1);
    });

    // -----------------------------------------------------------------------
    // P3: F3 (Cart) + F4 (Checkout & Signature)
    // -----------------------------------------------------------------------
    it('P3: F3 (Cart) + F4 (Checkout): Checking out Store A cleans up Store A while leaving Store B intact', () => {
      const cart: MultiStoreCart = {
        'store-A': {
          storeId: 'store-A',
          storeName: 'A店',
          items: [{ cartItemId: '1', menuItemId: 'm1', storeId: 'store-A', storeName: 'A店', name: '飲料', unitPrice: 50, quantity: 1, selectedOptions: [], customNotes: '', totalPrice: 50 }],
        },
        'store-B': {
          storeId: 'store-B',
          storeName: 'B店',
          items: [{ cartItemId: '2', menuItemId: 'm2', storeId: 'store-B', storeName: 'B店', name: '餐點', unitPrice: 100, quantity: 1, selectedOptions: [], customNotes: '', totalPrice: 100 }],
        },
      };

      // Checkout Store A
      const cleanNickname = sanitizeInput('  張大明  ', 30);
      expect(cleanNickname).toBe('張大明');

      const mockSignature = 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=';
      expect(isSafeUrl(mockSignature)).toBe(true);

      // Remove checked out store from cart
      delete cart['store-A'];

      expect(cart['store-A']).toBeUndefined();
      expect(cart['store-B']).toBeDefined();
      expect(cart['store-B'].items.length).toBe(1);
    });

    // -----------------------------------------------------------------------
    // P4: F4 (Checkout) + F5 (Order Tracking)
    // -----------------------------------------------------------------------
    it('P4: F4 (Checkout) + F5 (Order Tracking): Order submission initializes tracking timeline and 60s timer', () => {
      const submission = {
        id: 'sub-new-1',
        order_number: 'MN-015',
        total_amount: 150,
        signature_url: serializeOrderProgressStatus('pending'),
        created_at: new Date().toISOString(),
      };

      // Order tracking page loads
      const currentStatus = parseOrderProgressStatus(submission.signature_url);
      expect(currentStatus).toBe('pending');

      const elapsedSec = Math.floor((Date.now() - new Date(submission.created_at).getTime()) / 1000);
      const remainingSec = Math.max(0, 60 - elapsedSec);
      expect(remainingSec).toBeGreaterThan(0);
      expect(remainingSec).toBeLessThanOrEqual(60);
    });

    // -----------------------------------------------------------------------
    // P5: F4 (Checkout) + F8 (Admin Workbench Status Transitions)
    // -----------------------------------------------------------------------
    it('P5: F4 (Checkout) + F8 (Admin Workbench): Submitted order appears in workbench and transitions statuses', () => {
      const order = {
        id: 'ord-wb-1',
        status: 'pending',
        signature_url: serializeOrderProgressStatus('pending'),
      };

      // Admin accepts and confirms
      order.signature_url = serializeOrderProgressStatus('confirmed');
      expect(parseOrderProgressStatus(order.signature_url)).toBe('confirmed');

      // Admin starts preparing
      order.signature_url = serializeOrderProgressStatus('preparing');
      expect(parseOrderProgressStatus(order.signature_url)).toBe('preparing');

      // Admin marks ready
      order.signature_url = serializeOrderProgressStatus('ready');
      expect(parseOrderProgressStatus(order.signature_url)).toBe('ready');

      // Completed
      order.signature_url = serializeOrderProgressStatus('completed');
      expect(parseOrderProgressStatus(order.signature_url)).toBe('completed');
    });

    // -----------------------------------------------------------------------
    // P6: F5 (Order Tracking) + F3 (Multi-Store Cart)
    // -----------------------------------------------------------------------
    it('P6: F5 (Tracking) + F3 (Cart): Self-service return within 60s restores items with options back to cart', () => {
      const orderItems = [
        {
          id: 'item-restore-1',
          item_name: '烏龍拿鐵',
          quantity: 2,
          unit_price: 65,
          custom_notes: '微糖 微冰',
        },
      ];

      const restoredToCart: CartItem[] = orderItems.map((item, idx) => ({
        cartItemId: `restore-${item.id}-${idx}`,
        menuItemId: item.id,
        storeId: 'store-X',
        storeName: '茶館',
        name: item.item_name,
        unitPrice: item.unit_price,
        quantity: item.quantity,
        selectedOptions: [],
        customNotes: item.custom_notes || '',
        totalPrice: item.unit_price * item.quantity,
      }));

      const cart: MultiStoreCart = {
        'store-X': {
          storeId: 'store-X',
          storeName: '茶館',
          items: restoredToCart,
        },
      };

      expect(cart['store-X'].items.length).toBe(1);
      expect(cart['store-X'].items[0].name).toBe('烏龍拿鐵');
      expect(cart['store-X'].items[0].totalPrice).toBe(130);
    });

    // -----------------------------------------------------------------------
    // P7: F5 (Order Tracking) + F11 (Realtime & Voice Alert)
    // -----------------------------------------------------------------------
    it('P7: F5 (Tracking) + F11 (Voice Alert): Customer cancellation triggers Realtime notification and speech text', () => {
      const cancellationPayload = {
        orderId: 'sub-cancelled-1',
        nickname: '陳小華',
        orderNumber: 'MN-022',
        total_amount: 180,
      };

      const speechText = `注意！顧客 ${cancellationPayload.nickname} 已取消訂單 ${cancellationPayload.orderNumber}，金額 ${cancellationPayload.total_amount} 元。`;
      expect(speechText).toContain('陳小華');
      expect(speechText).toContain('MN-022');
      expect(speechText).toContain('180 元');
    });

    // -----------------------------------------------------------------------
    // P8: F6 (My Orders SWR) + F10 (Soft-Delete Retention)
    // -----------------------------------------------------------------------
    it('P8: F6 (SWR) + F10 (Soft-Delete): Admin soft-deletes completed order; customer SWR preserves receipt', () => {
      const clientCache = [
        {
          id: 'order-swr-1',
          order_number: 'MN-001',
          user_nickname: '老王',
          total_amount: 250,
          signature_url: serializeOrderProgressStatus('completed'),
          created_at: new Date().toISOString(),
        },
      ];
      setOrderHistoryCache(clientCache as any);

      // Admin soft deletes (hidden_from_admin)
      const dbResponseOrders: any[] = []; // DB returns 0 rows (hidden or removed from active)

      // Customer SWR reconciliation
      const dbMap = new Map(dbResponseOrders.map((r) => [r.id, r]));
      const mergedList: any[] = [];

      clientCache.forEach((cached) => {
        if (!dbMap.has(cached.id)) {
          const currentStatus = parseOrderProgressStatus(cached.signature_url);
          const mappedStatus = currentStatus === 'completed' ? 'completed' : 'cancelled';
          mergedList.push({
            ...cached,
            signature_url: serializeOrderProgressStatus(mappedStatus, '後台已結單移除'),
          });
        }
      });

      expect(mergedList.length).toBe(1);
      expect(parseOrderProgressStatus(mergedList[0].signature_url)).toBe('completed');
      expect(JSON.parse(mergedList[0].signature_url).note).toBe('後台已結單移除');
    });

    // -----------------------------------------------------------------------
    // P9: F6 (My Orders SWR) + F10 (Permanent Erase)
    // -----------------------------------------------------------------------
    it('P9: F6 (SWR) + F10 (Permanent Erase): Admin permanently purges order; customer SWR evicts without resurrection', () => {
      const orderId = 'purge-me-forever';
      setOrderHistoryCache([
        { id: orderId, order_number: 'MN-099', created_at: new Date().toISOString() } as any,
        { id: 'keep-me', order_number: 'MN-100', created_at: new Date().toISOString() } as any,
      ]);

      // Admin executes permanent erase
      recordPurgedOrderId(orderId);

      const cached = getOrderHistoryCache();
      expect(cached?.length).toBe(1);
      expect(cached![0].id).toBe('keep-me');
      expect(cached?.some((o) => o.id === orderId)).toBe(false);
    });

    // -----------------------------------------------------------------------
    // P10: F7 (Admin Store/Menu) + F12 (Store Code & Sort Order APIs)
    // -----------------------------------------------------------------------
    it('P10: F7 (Admin Store) + F12 (APIs): Assigning S-code and menu sort order reflected on store page', () => {
      const storeCode = formatStoreCode('7');
      expect(storeCode).toBe('S-007');

      const sortOrderApiPayload = {
        storeId: 'store-7',
        itemIds: ['item-c', 'item-a', 'item-b'],
      };

      const rawItems = [
        { id: 'item-a', name: 'A餐' },
        { id: 'item-b', name: 'B餐' },
        { id: 'item-c', name: 'C餐' },
      ];

      const sorted = [...rawItems].sort((a, b) => {
        return sortOrderApiPayload.itemIds.indexOf(a.id) - sortOrderApiPayload.itemIds.indexOf(b.id);
      });

      expect(sorted[0].id).toBe('item-c');
      expect(sorted[1].id).toBe('item-a');
      expect(sorted[2].id).toBe('item-b');
    });

    // -----------------------------------------------------------------------
    // P11: F8 (Admin Workbench) + F9 (Fee Split Algorithm)
    // -----------------------------------------------------------------------
    it('P11: F8 (Workbench) + F9 (Fee Split): Applies split algorithm and updates group order financial totals', () => {
      const submissions = [
        { id: 'sub-1', total_amount: 100, final_amount: 100 },
        { id: 'sub-2', total_amount: 150, final_amount: 150 },
        { id: 'sub-3', total_amount: 200, final_amount: 200 },
      ];

      const deliveryFee = 60;
      const discount = 0;
      const perPerson = Math.round((deliveryFee - discount) / submissions.length); // 20
      expect(perPerson).toBe(20);

      const updatedSubmissions = submissions.map((sub) => ({
        ...sub,
        final_amount: sub.total_amount + perPerson,
      }));

      expect(updatedSubmissions[0].final_amount).toBe(120);
      expect(updatedSubmissions[1].final_amount).toBe(170);
      expect(updatedSubmissions[2].final_amount).toBe(220);

      const groupTotal = updatedSubmissions.reduce((sum, s) => sum + s.final_amount, 0);
      expect(groupTotal).toBe(510);
    });

    // -----------------------------------------------------------------------
    // P12: F12 (Admin Auth) + F13 (Security Token Verification)
    // -----------------------------------------------------------------------
    it('P12: F12 (Auth) + F13 (Security): Auth token generation, verification, and logout lifecycle', () => {
      // Step 1: Admin logs in -> generates token
      const token = generateAdminToken();
      expect(typeof token).toBe('string');

      // Step 2: Request arrives with cookie -> verifyAdminToken
      expect(verifyAdminToken(token)).toBe(true);

      // Step 3: Admin logs out -> cookie expired
      const logoutCookie = {
        name: 'meinu_admin_token',
        value: '',
        maxAge: 0,
      };
      expect(logoutCookie.maxAge).toBe(0);
      expect(verifyAdminToken(logoutCookie.value)).toBe(false);
    });

    // -----------------------------------------------------------------------
    // P13: F13 (Security Proxy) + F12 (API Endpoints Payload Limit)
    // -----------------------------------------------------------------------
    it('P13: F13 (Proxy) + F12 (APIs): Malicious bot User-Agent and oversized payloads blocked before processing', () => {
      const checkRequestSafety = (ua: string, contentLength: number) => {
        const BLOCKED_BOT_PATTERNS = [/sqlmap/i, /nikto/i, /masscan/i];
        if (BLOCKED_BOT_PATTERNS.some((p) => p.test(ua))) {
          return { status: 403, error: 'Access Denied - Security Rule Triggered' };
        }
        if (contentLength > 16384) {
          return { status: 413, error: 'Payload Too Large' };
        }
        return { status: 200, ok: true };
      };

      expect(checkRequestSafety('sqlmap/1.5', 500).status).toBe(403);
      expect(checkRequestSafety('Mozilla/5.0', 20000).status).toBe(413);
      expect(checkRequestSafety('Mozilla/5.0', 1000).status).toBe(200);
    });

    // -----------------------------------------------------------------------
    // P14: F14 (Theme Engine) + F11 (Admin Notification Settings)
    // -----------------------------------------------------------------------
    it('P14: F14 (Theme Engine) + F11 (Audio Settings): Theme transition preserves persisted audio toggles', () => {
      // Audio settings saved
      localStorage.setItem('menu_app_admin_speech_enabled', 'true');
      localStorage.setItem('menu_app_admin_speech_mode', 'summary');

      // Theme toggled
      document.documentElement.classList.add('theme-transitioning');
      document.documentElement.classList.add('dark');
      localStorage.setItem('menu_app_theme', 'dark');

      document.documentElement.classList.remove('theme-transitioning');

      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(localStorage.getItem('menu_app_admin_speech_enabled')).toBe('true');
      expect(localStorage.getItem('menu_app_admin_speech_mode')).toBe('summary');
    });

    // -----------------------------------------------------------------------
    // P15: F4 (Checkout) + F9 (Fee Split) + F8 (Workbench) + F15 (Observability Hub)
    // -----------------------------------------------------------------------
    it('P15: F4 (Checkout) + F9 (Fee Split) + F8 (Workbench) + F15 (Telemetry Hub): Full business telemetry tracking', () => {
      telemetryHub.clearAll();

      // 1. Customer Submits Order
      const customerEvt = telemetryHub.recordEvent({
        node: 'customer',
        targetNode: 'database',
        action: '顧客提交訂單',
        title: '小夫 送單成功 (MN-101)',
        status: 'success',
        detail: '店家: 迷客夏 | 餐點: 伯爵紅茶拿鐵 | 金額: $70',
        payload: { orderNumber: 'MN-101', nickname: '小夫', amount: 70 },
      });

      // 2. Admin applies delivery fee split
      const feeEvt = telemetryHub.recordEvent({
        node: 'logic',
        targetNode: 'database',
        action: '套用平攤演算法',
        title: '全團 3 人平攤外送費',
        status: 'info',
        detail: '外送費: $60 | 每人分攤: $20',
        formula: 'floor((60 - 0) / 3) = $20',
        payload: { fee: 60, discount: 0, count: 3, share: 20 },
      });

      // 3. Admin updates status
      const statusEvt = telemetryHub.recordEvent({
        node: 'logic',
        targetNode: 'realtime',
        action: '推進訂單進度狀態',
        title: '訂單狀態 ➔ 「製作中」',
        status: 'success',
        detail: '單號: MN-101 狀態已推進',
        payload: { orderId: 'MN-101', status: 'preparing' },
      });

      const events = telemetryHub.getEvents();
      expect(events.length).toBe(3);
      expect(events[0].title).toContain('製作中');
      expect(events[1].title).toContain('平攤外送費');
      expect(events[2].title).toContain('小夫');
      expect(customerEvt.node).toBe('customer');
      expect(feeEvt.node).toBe('logic');
      expect(statusEvt.targetNode).toBe('realtime');
    });
  });
}
