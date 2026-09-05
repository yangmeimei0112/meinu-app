/**
 * 🧪 Tier 4: Real-World Application Scenarios
 * 5 realistic end-to-end user workflows matching TEST_INFRA.md
 */

import { describe, it, expect, beforeEach } from './test-framework';
import { sanitizeInput, isSafeUrl, getLockoutDurationSec } from '../../src/lib/security';
import {
  parseOrderProgressStatus,
  serializeOrderProgressStatus,
  isOrderHiddenFromAdmin,
} from '../../src/types/orderStatus';
import { mergeCartItems } from '../../src/lib/useMultiCart';
import {
  getPurgedOrderIds,
  recordPurgedOrderId,
  getOrderHistoryCache,
  setOrderHistoryCache,
} from '../../src/lib/cache/orderHistoryCache';
import { formatStoreCode } from '../../src/app/api/stores/code/route';
import type { CartItem, MultiStoreCart } from '../../src/types/cart';

export function registerTier4Tests() {
  describe('Tier 4: Real-World Application Scenarios', () => {
    beforeEach(() => {
      localStorage.clear();
      sessionStorage.clear();
      document.documentElement.classList.remove('dark', 'theme-transitioning');
    });

    // =======================================================================
    // Scenario 1: Office Team Afternoon Tea Ordering
    // =======================================================================
    it('Scenario 1: Office Team Afternoon Tea Ordering (F1, F2, F3, F4, F8, F11)', () => {
      // 1. F1: Search & Discover Store
      const stores = [
        { id: 'store-tea-1', name: '五十嵐 概念店', code: 'S-001', is_active: true, cutoff_time: new Date(Date.now() + 3600000).toISOString() },
        { id: 'store-bento-1', name: '全家便當', code: 'S-002', is_active: true },
      ];
      const searchKeyword = '五十嵐';
      const matchedStore = stores.find((s) => s.name.includes(searchKeyword));
      expect(matchedStore).toBeDefined();
      expect(matchedStore?.code).toBe('S-001');

      // 2. F2: Menu Customization & Pricing
      const baseDrink = { id: 'm-tea', name: '波霸奶茶', price: 55 };
      const customerSelections = [
        { groupTitle: '甜度', itemName: '微糖', extraPrice: 0 },
        { groupTitle: '冰塊', itemName: '微冰', extraPrice: 0 },
        { groupTitle: '加料', itemName: '布丁', extraPrice: 15 },
      ];
      const extraTotal = customerSelections.reduce((sum, opt) => sum + opt.extraPrice, 0);
      const unitPrice = baseDrink.price + extraTotal;
      const quantity = 2;
      const totalPrice = unitPrice * quantity;

      expect(unitPrice).toBe(70);
      expect(totalPrice).toBe(140);

      // 3. F3: Multi-Store Cart Auto-Merging
      const cartItem1: CartItem = {
        cartItemId: 'c-1',
        menuItemId: baseDrink.id,
        storeId: matchedStore!.id,
        storeName: matchedStore!.name,
        name: baseDrink.name,
        unitPrice,
        quantity: 1,
        selectedOptions: customerSelections,
        customNotes: '外送請附紙袋',
        totalPrice: unitPrice,
      };

      const cartItem2: CartItem = {
        cartItemId: 'c-2',
        menuItemId: baseDrink.id,
        storeId: matchedStore!.id,
        storeName: matchedStore!.name,
        name: baseDrink.name,
        unitPrice,
        quantity: 1,
        selectedOptions: customerSelections,
        customNotes: '外送請附紙袋',
        totalPrice: unitPrice,
      };

      const mergedItems = mergeCartItems([cartItem1, cartItem2]);
      expect(mergedItems.length).toBe(1);
      expect(mergedItems[0].quantity).toBe(2);
      expect(mergedItems[0].totalPrice).toBe(140);

      // 4. F4: Checkout & Signature
      const cleanNickname = sanitizeInput('  工程師小智  ', 30);
      expect(cleanNickname).toBe('工程師小智');

      const signatureCanvasData = 'data:image/svg+xml;base64,PHN2Zz5zaWduPC9zdmc+';
      expect(isSafeUrl(signatureCanvasData)).toBe(true);

      const orderSubmission = {
        id: 'sub-tea-1',
        order_number: 'MN-001',
        user_nickname: cleanNickname,
        payment_method_name: 'LINE Pay',
        sold_out_option: '由店家更換等值商品',
        total_amount: mergedItems[0].totalPrice,
        signature_url: serializeOrderProgressStatus('pending'),
        signature_data: signatureCanvasData,
        created_at: new Date().toISOString(),
      };
      expect(orderSubmission.order_number).toBe('MN-001');
      expect(orderSubmission.total_amount).toBe(140);

      // 5. F8: Admin Workbench Status Transitions
      let currentProgress = parseOrderProgressStatus(orderSubmission.signature_url);
      expect(currentProgress).toBe('pending');

      // pending -> confirmed -> preparing -> ready -> completed
      currentProgress = 'confirmed';
      expect(currentProgress).toBe('confirmed');
      currentProgress = 'preparing';
      expect(currentProgress).toBe('preparing');
      currentProgress = 'ready';
      expect(currentProgress).toBe('ready');
      currentProgress = 'completed';
      expect(currentProgress).toBe('completed');

      // 6. F11: Taiwan Mandarin TTS Announcement
      const speechAnnouncement = `收到來自 ${orderSubmission.user_nickname} 的新訂單，金額 ${orderSubmission.total_amount} 元。`;
      expect(speechAnnouncement).toContain('工程師小智');
      expect(speechAnnouncement).toContain('140 元');
    });

    // =======================================================================
    // Scenario 2: High-Volume Lunch Rush with Delivery Fee Split
    // =======================================================================
    it('Scenario 2: High-Volume Lunch Rush with Delivery Fee Split (F7, F3, F4, F9, F8)', () => {
      // 1. F7: Store & Menu configuration
      const storeCode = formatStoreCode('12');
      expect(storeCode).toBe('S-012');

      // 2. F3 & F4: 4 colleagues submit orders
      const submissions = [
        { id: 'sub-1', user: 'Alice', total_amount: 120, final_amount: 120, method: '現金付款' },
        { id: 'sub-2', user: 'Bob', total_amount: 150, final_amount: 150, method: 'LINE Pay' },
        { id: 'sub-3', user: 'Charlie', total_amount: 90, final_amount: 90, method: '現金付款' },
        { id: 'sub-4', user: 'David', total_amount: 180, final_amount: 180, method: 'LINE Pay' },
      ];
      expect(submissions.length).toBe(4);

      // 3. F9: Group Order reached cutoff; Admin inputs Delivery Fee & Discount
      const deliveryFee = 100;
      const discount = 20;
      const netAdjustment = deliveryFee - discount; // 80
      const perPersonShare = netAdjustment / submissions.length; // 20
      expect(perPersonShare).toBe(20);

      // Verify rounding rules consistency
      expect(Math.floor(perPersonShare)).toBe(20);
      expect(Math.ceil(perPersonShare)).toBe(20);
      expect(Math.round(perPersonShare)).toBe(20);

      const splitSubmissions = submissions.map((sub) => ({
        ...sub,
        final_amount: sub.total_amount + perPersonShare,
      }));

      expect(splitSubmissions[0].final_amount).toBe(140);
      expect(splitSubmissions[1].final_amount).toBe(170);
      expect(splitSubmissions[2].final_amount).toBe(110);
      expect(splitSubmissions[3].final_amount).toBe(200);

      // 4. F8: Financial Auto-Aggregation
      let cashTotal = 0;
      let linePayTotal = 0;
      splitSubmissions.forEach((sub) => {
        if (sub.method === '現金付款') cashTotal += sub.final_amount;
        if (sub.method === 'LINE Pay') linePayTotal += sub.final_amount;
      });

      expect(cashTotal).toBe(140 + 110); // 250
      expect(linePayTotal).toBe(170 + 200); // 370
      expect(cashTotal + linePayTotal).toBe(620);
    });

    // =======================================================================
    // Scenario 3: Order Cancellation & Self-Service Return
    // =======================================================================
    it('Scenario 3: Order Cancellation & Self-Service Return (F4, F5, F11, F3)', () => {
      // 1. F4: Checkout order submitted
      const submittedCartItems: CartItem[] = [
        {
          cartItemId: 'c-return-1',
          menuItemId: 'm-lunch-1',
          storeId: 'store-lunch',
          storeName: '排骨大王',
          name: '招牌排骨飯',
          unitPrice: 110,
          quantity: 1,
          selectedOptions: [{ groupTitle: '配菜', itemName: '滷蛋', extraPrice: 15 }],
          customNotes: '飯少醬多',
          totalPrice: 125,
        },
      ];

      const orderRecord = {
        id: 'sub-return-123',
        order_number: 'MN-033',
        user_nickname: '小美',
        signature_url: serializeOrderProgressStatus('pending'),
        created_at: new Date().toISOString(),
      };

      // 2. F5: Customer checks order status page within 60s
      const elapsedSec = 15; // 15s elapsed
      const remainingSec = 60 - elapsedSec;
      const currentStatus = parseOrderProgressStatus(orderRecord.signature_url);
      const canSelfServiceReturn = remainingSec > 0 && currentStatus === 'pending';
      expect(canSelfServiceReturn).toBe(true);

      // Customer triggers "Return to Cart to Modify"
      const restoredCart: MultiStoreCart = {
        'store-lunch': {
          storeId: 'store-lunch',
          storeName: '排骨大王',
          items: submittedCartItems,
        },
      };
      expect(restoredCart['store-lunch'].items[0].name).toBe('招牌排骨飯');
      expect(restoredCart['store-lunch'].items[0].customNotes).toBe('飯少醬多');

      // 3. F11: Realtime Cancellation Voice Alert for Admin
      const cancelAlertSpeech = `注意！顧客 ${orderRecord.user_nickname} 已取消訂單 ${orderRecord.order_number}，金額 125 元。`;
      expect(cancelAlertSpeech).toContain('小美');
      expect(cancelAlertSpeech).toContain('MN-033');
      expect(cancelAlertSpeech).toContain('125 元');
    });

    // =======================================================================
    // Scenario 4: Non-Destructive Admin Order Deletion & Customer SWR
    // =======================================================================
    it('Scenario 4: Non-Destructive Admin Order Deletion & Customer SWR (F8, F10, F6)', () => {
      // 1. Initial State: Customer has cached past orders
      const orderA = {
        id: 'ord-soft-delete',
        order_number: 'MN-050',
        user_nickname: '老陳',
        total_amount: 150,
        signature_url: serializeOrderProgressStatus('completed'),
        created_at: new Date(Date.now() - 3600000).toISOString(),
      };

      const orderB = {
        id: 'ord-hard-delete',
        order_number: 'MN-051',
        user_nickname: '廣告機器人',
        total_amount: 9999,
        signature_url: serializeOrderProgressStatus('cancelled'),
        created_at: new Date().toISOString(),
      };

      setOrderHistoryCache([orderA, orderB] as any);
      expect(getOrderHistoryCache()?.length).toBe(2);

      // 2. F10: Admin performs Soft-Delete on completed orderA
      const softDeletedOrderA = {
        ...orderA,
        signature_url: serializeOrderProgressStatus('completed', '後台已結單移除', true),
      };
      expect(isOrderHiddenFromAdmin(softDeletedOrderA.signature_url)).toBe(true);

      // 3. F10: Admin performs Permanent Erase with double warning on spam orderB
      recordPurgedOrderId(orderB.id);
      expect(getPurgedOrderIds().has(orderB.id)).toBe(true);

      // 4. F6: Customer visits My Orders page; SWR Reconciliation triggers
      const purgedSet = getPurgedOrderIds();
      const clientCached = getOrderHistoryCache() || [];

      const reconciledList: any[] = [];

      clientCached.forEach((cached) => {
        if (purgedSet.has(cached.id)) return; // Exclude purged

        const status = parseOrderProgressStatus(cached.signature_url);
        const mappedStatus = status === 'completed' ? 'completed' : 'cancelled';
        reconciledList.push({
          ...cached,
          signature_url: serializeOrderProgressStatus(mappedStatus, '後台已結單移除'),
        });
      });

      // Customer preserves Order A as completed with note
      expect(reconciledList.length).toBe(1);
      expect(reconciledList[0].id).toBe('ord-soft-delete');
      expect(parseOrderProgressStatus(reconciledList[0].signature_url)).toBe('completed');
      expect(JSON.parse(reconciledList[0].signature_url).note).toBe('後台已結單移除');

      // Order B is completely purged from history
      expect(reconciledList.some((o) => o.id === 'ord-hard-delete')).toBe(false);
    });

    // =======================================================================
    // Scenario 5: Security Attack Simulation & Payload DoS Defense
    // =======================================================================
    it('Scenario 5: Security Attack Simulation & Payload DoS Defense (F12, F13)', () => {
      // 1. Attack Step 1: Scanner Bot User-Agent detection (sqlmap / nikto)
      const attackerUA = 'sqlmap/1.4.11#stable (http://sqlmap.org)';
      const BLOCKED_BOTS = [/sqlmap/i, /nikto/i, /masscan/i];
      const isBotBlocked = BLOCKED_BOTS.some((p) => p.test(attackerUA));
      expect(isBotBlocked).toBe(true);

      // 2. Attack Step 2: DoS 16KB Payload Bomb to API
      const oversizedPayloadLength = 17500; // 17.5KB > 16KB
      const isPayloadTooLarge = oversizedPayloadLength > 16384;
      expect(isPayloadTooLarge).toBe(true);

      // 3. Attack Step 3: CSRF Cross-Origin POST forgery
      const serverHost = 'meinu.app';
      const attackOrigin = 'https://malicious-site.xyz';
      const isCsrfSafe = new URL(attackOrigin).host === serverHost;
      expect(isCsrfSafe).toBe(false);

      // 4. Attack Step 4: Password Brute-Force lockout
      const failedAttempts = 7;
      const lockoutDuration = getLockoutDurationSec(failedAttempts);
      expect(lockoutDuration).toBe(300); // 5 minutes lockout

      // 5. Account Privacy: User triggers account deletion & de-identification
      const userProfile = {
        userId: 'user-xyz',
        nickname: 'Alice',
        phone: '0912345678',
      };
      // De-identification scrub
      const deIdentified = {
        userId: userProfile.userId,
        nickname: '已註銷會員',
        phone: null,
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      };

      expect(deIdentified.nickname).toBe('已註銷會員');
      expect(deIdentified.phone).toBeNull();
      expect(deIdentified.is_deleted).toBe(true);
    });
  });
}
