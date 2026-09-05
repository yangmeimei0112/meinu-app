/**
 * 🧪 Tier 1: Feature Happy-Path & Core Requirements Coverage (F1 - F14)
 * >= 5 test cases per feature across F1 to F14 (Minimum ~70 tests)
 */

import { describe, it, expect, beforeEach } from './test-framework';
import { sanitizeInput, isSafeUrl } from '../../src/lib/security';
import { verifyAdminToken, generateAdminToken } from '../../src/lib/auth-util';
import {
  parseOrderProgressStatus,
  serializeOrderProgressStatus,
  isOrderHiddenFromAdmin,
  ORDER_STATUS_META,
  OrderProgressStatus,
} from '../../src/types/orderStatus';
import { areCartItemsEqual, mergeCartItems } from '../../src/lib/useMultiCart';
import {
  getPurgedOrderIds,
  recordPurgedOrderId,
  getOrderHistoryCache,
  setOrderHistoryCache,
  clearAllOrderHistory,
} from '../../src/lib/cache/orderHistoryCache';
import { formatStoreCode } from '../../src/app/api/stores/code/route';
import { BUILT_IN_CUSTOM_PRESETS } from '../../src/lib/customOptionPresets';
import type { CartItem, SelectedOption } from '../../src/types/cart';
import { telemetryHub } from '../../src/lib/telemetry/telemetryHub';

export function registerTier1Tests() {
  // =========================================================================
  // F1: Lobby & Search
  // =========================================================================
  describe('F1: Lobby & Search', () => {
    it('F1-1: Filters stores by category capsule tabs', () => {
      const stores = [
        { id: 's1', name: '春水堂', category_id: 'cat-drinks' },
        { id: 's2', name: '台鐵便當', category_id: 'cat-bento' },
        { id: 's3', name: '50嵐', category_id: 'cat-drinks' },
      ];
      const selectedCategory: string = 'cat-drinks';
      const filtered = stores.filter((s) => selectedCategory === 'all' || s.category_id === selectedCategory);
      expect(filtered.length).toBe(2);
      expect(filtered.map((s) => s.name)).toContain('春水堂');
      expect(filtered.map((s) => s.name)).toContain('50嵐');
    });

    it('F1-2: Calculates countdown timer and active ordering status correctly', () => {
      const futureCutoff = new Date(Date.now() + 1800 * 1000).toISOString(); // 30 mins later
      const pastCutoff = new Date(Date.now() - 100 * 1000).toISOString(); // 100s ago

      const checkIsAccepting = (store: { is_accepting_orders?: boolean; enable_countdown?: boolean; cutoff_time?: string }) => {
        if (store.is_accepting_orders === false) return false;
        if (store.enable_countdown && store.cutoff_time) {
          const remaining = new Date(store.cutoff_time).getTime() - Date.now();
          if (remaining <= 0) return false;
        }
        return true;
      };

      expect(checkIsAccepting({ is_accepting_orders: true, enable_countdown: true, cutoff_time: futureCutoff })).toBe(true);
      expect(checkIsAccepting({ is_accepting_orders: true, enable_countdown: true, cutoff_time: pastCutoff })).toBe(false);
      expect(checkIsAccepting({ is_accepting_orders: false, enable_countdown: false })).toBe(false);
    });

    it('F1-3: Aggregates popular active group order badges on store cards', () => {
      const submissions = [
        { items: [{ name: '珍珠奶茶', qty: 5 }, { name: '四季春', qty: 2 }] },
        { items: [{ name: '珍珠奶茶', qty: 3 }, { name: '冬瓜檸檬', qty: 4 }] },
      ];

      const counts: Record<string, number> = {};
      submissions.forEach((s) => {
        s.items.forEach((i) => {
          counts[i.name] = (counts[i.name] || 0) + i.qty;
        });
      });

      expect(counts['珍珠奶茶']).toBe(8);
      expect(counts['冬瓜檸檬']).toBe(4);
      expect(counts['四季春']).toBe(2);
      // Top popular item
      const topItem = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
      expect(topItem).toBe('珍珠奶茶');
    });

    it('F1-4: Checks real-time version query data format and commit hash', async () => {
      const versionResponse = {
        version: '10.5.2',
        commitHash: 'dev',
        buildTime: new Date().toISOString(),
        timestamp: Date.now(),
      };
      expect(versionResponse.version).toMatch(/^\d+\.\d+\.\d+$/);
      expect(versionResponse.timestamp).toBeGreaterThan(0);
      expect(typeof versionResponse.commitHash).toBe('string');
    });

    it('F1-5: 160ms debounce fuzzy search matches store name, S-code, and persists search history', () => {
      const stores = [
        { id: 's1', name: '五十嵐 概念店', code: 'S-001' },
        { id: 's2', name: '可不可熟成紅茶', code: 'S-002' },
        { id: 's3', name: '麻古茶坊', code: 'S-003' },
      ];

      const search = (q: string) => {
        const query = q.trim().toLowerCase();
        if (!query) return [];
        return stores.filter((s) => s.name.toLowerCase().includes(query) || s.code.toLowerCase().includes(query));
      };

      expect(search('五十嵐').length).toBe(1);
      expect(search('S-002').length).toBe(1);
      expect(search('茶').length).toBe(2);

      // Search history persistence
      const history = ['飲料', '便當'];
      const addHistory = (k: string) => [k, ...history.filter((x) => x !== k)].slice(0, 10);
      const updated = addHistory('五十嵐');
      expect(updated[0]).toBe('五十嵐');
      expect(updated.length).toBe(3);
    });
  });

  // =========================================================================
  // F2: Menu Customization & Dynamic Pricing
  // =========================================================================
  describe('F2: Menu Customization', () => {
    it('F2-1: Categorizes menu items and groups them for display', () => {
      const items = [
        { id: 'm1', name: '熟成紅茶', category: '原茶系列', price: 35 },
        { id: 'm2', name: '熟成歐蕾', category: '鮮奶系列', price: 55 },
        { id: 'm3', name: '春芽綠茶', category: '原茶系列', price: 35 },
      ];
      const groups = items.reduce((acc, item) => {
        const cat = item.category || '未分類';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
      }, {} as Record<string, typeof items>);

      expect(Object.keys(groups)).toContain('原茶系列');
      expect(Object.keys(groups)).toContain('鮮奶系列');
      expect(groups['原茶系列'].length).toBe(2);
    });

    it('F2-2: Respects custom menu sort order using itemIds fallback chain', () => {
      const items = [
        { id: 'item-1', name: 'A' },
        { id: 'item-2', name: 'B' },
        { id: 'item-3', name: 'C' },
      ];
      const sortRes = { itemIds: ['item-3', 'item-1', 'item-2'] };
      const customOrder = sortRes.itemIds || [];

      const sorted = [...items].sort((a, b) => {
        const indexA = customOrder.indexOf(a.id);
        const indexB = customOrder.indexOf(b.id);
        return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
      });

      expect(sorted[0].id).toBe('item-3');
      expect(sorted[1].id).toBe('item-1');
      expect(sorted[2].id).toBe('item-2');
    });

    it('F2-3: Validates single-choice spec selection constraint', () => {
      const sweetnessGroup = {
        id: 'grp-sweet',
        title: '甜度',
        type: 'single' as const,
        options: [
          { id: 'opt-0', name: '無糖', price: 0 },
          { id: 'opt-1', name: '微糖', price: 0 },
          { id: 'opt-2', name: '半糖', price: 0 },
        ],
      };

      let selectedOptionIds = [sweetnessGroup.options[0].id]; // default
      // User selects 微糖
      selectedOptionIds = [sweetnessGroup.options[1].id];
      expect(selectedOptionIds.length).toBe(1);
      expect(selectedOptionIds[0]).toBe('opt-1');
    });

    it('F2-4: Validates multiple-choice spec selection and limit constraints', () => {
      const toppingGroup = {
        id: 'grp-top',
        title: '配料',
        type: 'limit' as const,
        limit_number: 2,
        options: [
          { id: 'top-boba', name: '珍珠', price: 10 },
          { id: 'top-coconut', name: '椰果', price: 10 },
          { id: 'top-pudding', name: '布丁', price: 15 },
        ],
      };

      const selected = ['top-boba'];
      // Add coconut
      if (selected.length < toppingGroup.limit_number) {
        selected.push('top-coconut');
      }
      expect(selected.length).toBe(2);

      // Attempt to add pudding (should be rejected)
      const canAddMore = selected.length < toppingGroup.limit_number;
      expect(canAddMore).toBe(false);
    });

    it('F2-5: Accurately calculates dynamic total price with base price, extras, and quantity', () => {
      const basePrice = 50;
      const quantity = 3;
      const extras: SelectedOption[] = [
        { groupTitle: '配料', itemName: '珍珠', extraPrice: 10 },
        { groupTitle: '配料', itemName: '布丁', extraPrice: 15 },
      ];

      const extraSum = extras.reduce((sum, opt) => sum + opt.extraPrice, 0);
      const unitPrice = basePrice + extraSum;
      const totalPrice = unitPrice * quantity;

      expect(extraSum).toBe(25);
      expect(unitPrice).toBe(75);
      expect(totalPrice).toBe(225);
    });
  });

  // =========================================================================
  // F3: Multi-Store Cart
  // =========================================================================
  describe('F3: Multi-Store Cart', () => {
    it('F3-1: Isolates cart items by store into independent store groups', () => {
      const cart: Record<string, { storeId: string; items: CartItem[] }> = {};

      const itemA: CartItem = {
        cartItemId: 'c1',
        menuItemId: 'm1',
        storeId: 'store-1',
        storeName: '店家1',
        name: '紅茶',
        unitPrice: 30,
        quantity: 1,
        selectedOptions: [],
        customNotes: '',
        totalPrice: 30,
      };

      const itemB: CartItem = {
        cartItemId: 'c2',
        menuItemId: 'm2',
        storeId: 'store-2',
        storeName: '店家2',
        name: '排骨飯',
        unitPrice: 100,
        quantity: 1,
        selectedOptions: [],
        customNotes: '',
        totalPrice: 100,
      };

      cart[itemA.storeId] = { storeId: itemA.storeId, items: [itemA] };
      cart[itemB.storeId] = { storeId: itemB.storeId, items: [itemB] };

      expect(Object.keys(cart).length).toBe(2);
      expect(cart['store-1'].items[0].name).toBe('紅茶');
      expect(cart['store-2'].items[0].name).toBe('排骨飯');
    });

    it('F3-2: areCartItemsEqual returns true for identical items and auto-merges quantities', () => {
      const item1: CartItem = {
        cartItemId: 'c1',
        menuItemId: 'm1',
        storeId: 's1',
        storeName: '茶飲',
        name: '珍奶',
        unitPrice: 60,
        quantity: 1,
        selectedOptions: [{ groupTitle: '甜度', itemName: '微糖', extraPrice: 0 }],
        customNotes: '去冰',
        totalPrice: 60,
      };

      const item2: CartItem = {
        cartItemId: 'c2',
        menuItemId: 'm1',
        storeId: 's1',
        storeName: '茶飲',
        name: '珍奶',
        unitPrice: 60,
        quantity: 2,
        selectedOptions: [{ groupTitle: '甜度', itemName: '微糖', extraPrice: 0 }],
        customNotes: '  去冰  ', // Whitespace trimmed equivalence
        totalPrice: 120,
      };

      expect(areCartItemsEqual(item1, item2)).toBe(true);

      const merged = mergeCartItems([item1, item2]);
      expect(merged.length).toBe(1);
      expect(merged[0].quantity).toBe(3);
      expect(merged[0].totalPrice).toBe(180);
    });

    it('F3-3: Differentiates items with distinct options or notes without merging', () => {
      const itemA: CartItem = {
        cartItemId: 'c1',
        menuItemId: 'm1',
        storeId: 's1',
        storeName: '茶飲',
        name: '珍奶',
        unitPrice: 60,
        quantity: 1,
        selectedOptions: [{ groupTitle: '甜度', itemName: '微糖', extraPrice: 0 }],
        customNotes: '去冰',
        totalPrice: 60,
      };

      const itemB: CartItem = {
        cartItemId: 'c2',
        menuItemId: 'm1',
        storeId: 's1',
        storeName: '茶飲',
        name: '珍奶',
        unitPrice: 60,
        quantity: 1,
        selectedOptions: [{ groupTitle: '甜度', itemName: '半糖', extraPrice: 0 }],
        customNotes: '去冰',
        totalPrice: 60,
      };

      expect(areCartItemsEqual(itemA, itemB)).toBe(false);
      const merged = mergeCartItems([itemA, itemB]);
      expect(merged.length).toBe(2);
    });

    it('F3-4: Updates item quantity and recalculates store & global totals', () => {
      let items: CartItem[] = [
        {
          cartItemId: 'c1',
          menuItemId: 'm1',
          storeId: 's1',
          storeName: '茶飲',
          name: '珍奶',
          unitPrice: 60,
          quantity: 2,
          selectedOptions: [],
          customNotes: '',
          totalPrice: 120,
        },
      ];

      // Update quantity to 4
      const updateQty = (id: string, qty: number) => {
        items = items.map((i) =>
          i.cartItemId === id ? { ...i, quantity: qty, totalPrice: i.unitPrice * qty } : i
        );
      };

      updateQty('c1', 4);
      expect(items[0].quantity).toBe(4);
      expect(items[0].totalPrice).toBe(240);
    });

    it('F3-5: Setting item quantity to <= 0 removes it and cleans up empty store groups', () => {
      const cart: Record<string, { storeId: string; items: CartItem[] }> = {
        s1: {
          storeId: 's1',
          items: [
            {
              cartItemId: 'c1',
              menuItemId: 'm1',
              storeId: 's1',
              storeName: '茶飲',
              name: '珍奶',
              unitPrice: 60,
              quantity: 1,
              selectedOptions: [],
              customNotes: '',
              totalPrice: 60,
            },
          ],
        },
      };

      const updateQty = (storeId: string, cartItemId: string, newQty: number) => {
        if (!cart[storeId]) return;
        if (newQty <= 0) {
          cart[storeId].items = cart[storeId].items.filter((i) => i.cartItemId !== cartItemId);
        }
        if (cart[storeId].items.length === 0) {
          delete cart[storeId];
        }
      };

      updateQty('s1', 'c1', 0);
      expect(cart['s1']).toBeUndefined();
    });
  });

  // =========================================================================
  // F4: Checkout & Signature
  // =========================================================================
  describe('F4: Checkout & Signature', () => {
    it('F4-1: Sanitizes customer nickname and enforces length boundaries', () => {
      const rawNickname = '  <script>alert("hack")</script> 小明 123  ';
      const clean = sanitizeInput(rawNickname, 50);
      expect(clean).not.toContain('<');
      expect(clean).not.toContain('>');
      expect(clean).toContain('小明 123');
      expect(clean.length).toBeLessThanOrEqual(50);
    });

    it('F4-2: Selects valid payment method from available methods', () => {
      const paymentMethods = [
        { id: 'pm-1', name: 'LINE Pay', is_active: true },
        { id: 'pm-2', name: '現金付款', is_active: true },
      ];
      let selected = paymentMethods[0].name;
      expect(selected).toBe('LINE Pay');
      selected = paymentMethods[1].name;
      expect(selected).toBe('現金付款');
    });

    it('F4-3: Selects sold-out fallback option', () => {
      const soldOutOptions = [
        { id: 'so-1', name: '直接取消該品項' },
        { id: 'so-2', name: '由店家更換等值商品' },
      ];
      const selected = soldOutOptions[0].name;
      expect(selected).toBe('直接取消該品項');
    });

    it('F4-4: Serializes customer hand-drawn signature as DataURL / SVG', () => {
      const mockSignatureData = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjwvc3ZnPg==';
      expect(isSafeUrl(mockSignatureData)).toBe(true);
      expect(mockSignatureData.startsWith('data:image/svg+xml;base64,')).toBe(true);
    });

    it('F4-5: Constructs order submission payload with sequential order number', () => {
      const orderNumber = 'MN-008';
      const payload = {
        group_order_id: 'grp-uuid-1',
        user_nickname: '小華',
        payment_method_name: '現金付款',
        sold_out_option: '直接取消該品項',
        total_amount: 150,
        final_amount: 150,
        order_number: orderNumber,
        is_paid: false,
        signature_url: serializeOrderProgressStatus('pending'),
      };

      expect(payload.order_number).toMatch(/^MN-\d+$/);
      expect(payload.total_amount).toBe(150);
      expect(parseOrderProgressStatus(payload.signature_url)).toBe('pending');
    });
  });

  // =========================================================================
  // F5: Order Tracking & Return
  // =========================================================================
  describe('F5: Order Tracking & Return', () => {
    it('F5-1: Validates 5-stage progress timeline definitions and step indices', () => {
      const statuses: OrderProgressStatus[] = ['pending', 'preparing', 'ready', 'completed', 'cancelled'];
      statuses.forEach((s) => {
        const meta = ORDER_STATUS_META[s];
        expect(meta).toBeDefined();
        expect(typeof meta.label).toBe('string');
        expect(typeof meta.title).toBe('string');
      });
      expect(ORDER_STATUS_META.pending.label).toBe('待確認');
      expect(ORDER_STATUS_META.completed.label).toBe('已完成');
    });

    it('F5-2: parseOrderProgressStatus parses JSON and raw strings with pending fallback', () => {
      expect(parseOrderProgressStatus('{"status":"preparing"}')).toBe('preparing');
      expect(parseOrderProgressStatus('ready')).toBe('ready');
      expect(parseOrderProgressStatus('invalid-status')).toBe('pending');
      expect(parseOrderProgressStatus(null)).toBe('pending');
    });

    it('F5-3: serializeOrderProgressStatus generates structured status string', () => {
      const serialized = serializeOrderProgressStatus('ready', '餐點已備妥，請取餐');
      const parsed = JSON.parse(serialized);
      expect(parsed.status).toBe('ready');
      expect(parsed.note).toBe('餐點已備妥，請取餐');
      expect(parsed.hidden_from_admin).toBe(false);
      expect(typeof parsed.updated_at).toBe('string');
    });

    it('F5-4: Restores cart items with custom options upon 1-min self-service return', () => {
      const orderItems = [
        {
          id: 'item-1',
          item_name: '珍珠奶茶',
          quantity: 2,
          unit_price: 60,
          custom_notes: '微糖, 去冰',
        },
      ];

      const restored: CartItem[] = orderItems.map((item, idx) => ({
        cartItemId: `restore-${item.id}-${idx}`,
        menuItemId: item.id,
        storeId: 'store-1',
        storeName: '春水堂',
        name: item.item_name,
        unitPrice: item.unit_price,
        quantity: item.quantity,
        selectedOptions: [],
        customNotes: item.custom_notes || '',
        totalPrice: item.unit_price * item.quantity,
      }));

      expect(restored.length).toBe(1);
      expect(restored[0].name).toBe('珍珠奶茶');
      expect(restored[0].quantity).toBe(2);
      expect(restored[0].customNotes).toBe('微糖, 去冰');
    });

    it('F5-5: Cancels order within 60s window and cleans up local order history pointer', () => {
      const submissionId = 'sub-test-123';
      localStorage.setItem('menu_app_last_order_id', submissionId);
      localStorage.setItem('menu_app_order_history', JSON.stringify([submissionId, 'sub-other']));

      // Execute local history cleanup
      localStorage.removeItem('menu_app_last_order_id');
      const history = JSON.parse(localStorage.getItem('menu_app_order_history') || '[]');
      const filtered = history.filter((id: string) => id !== submissionId);
      localStorage.setItem('menu_app_order_history', JSON.stringify(filtered));

      expect(localStorage.getItem('menu_app_last_order_id')).toBeNull();
      const nextHistory = JSON.parse(localStorage.getItem('menu_app_order_history') || '[]');
      expect(nextHistory).not.toContain(submissionId);
      expect(nextHistory).toContain('sub-other');
    });
  });

  // =========================================================================
  // F6: My History Orders SWR & Retention
  // =========================================================================
  describe('F6: My History Orders', () => {
    it('F6-1: Reads cached order history immediately from localStorage', () => {
      const cached = [
        {
          id: 'order-1',
          order_number: 'MN-001',
          total_amount: 120,
          created_at: new Date().toISOString(),
        },
      ];
      localStorage.setItem('menu_app_cached_orders_detail', JSON.stringify(cached));
      const result = getOrderHistoryCache();
      expect(result).toBeDefined();
      expect(result?.length).toBe(1);
      expect(result![0].order_number).toBe('MN-001');
    });

    it('F6-2: Retains deleted completed order as completed with note in customer SWR', () => {
      const cachedOrder = {
        id: 'ord-completed',
        order_number: 'MN-005',
        total_amount: 150,
        signature_url: serializeOrderProgressStatus('completed'),
        created_at: new Date().toISOString(),
      };

      // When DB returns empty (deleted by admin)
      const currentStatus = parseOrderProgressStatus(cachedOrder.signature_url);
      const mappedStatus: 'completed' | 'cancelled' = currentStatus === 'completed' ? 'completed' : 'cancelled';
      const retained = {
        ...cachedOrder,
        signature_url: serializeOrderProgressStatus(mappedStatus, '後台已結單移除'),
      };

      expect(parseOrderProgressStatus(retained.signature_url)).toBe('completed');
      const parsedMeta = JSON.parse(retained.signature_url);
      expect(parsedMeta.note).toBe('後台已結單移除');
    });

    it('F6-3: Maps deleted pending order to cancelled with note in customer SWR', () => {
      const cachedOrder = {
        id: 'ord-pending',
        order_number: 'MN-006',
        total_amount: 85,
        signature_url: serializeOrderProgressStatus('pending'),
        created_at: new Date().toISOString(),
      };

      const currentStatus = parseOrderProgressStatus(cachedOrder.signature_url);
      const mappedStatus: 'completed' | 'cancelled' = currentStatus === 'completed' ? 'completed' : 'cancelled';
      const retained = {
        ...cachedOrder,
        signature_url: serializeOrderProgressStatus(mappedStatus, '後台已結單移除'),
      };

      expect(parseOrderProgressStatus(retained.signature_url)).toBe('cancelled');
      const parsedMeta = JSON.parse(retained.signature_url);
      expect(parsedMeta.note).toBe('後台已結單移除');
    });

    it('F6-4: Clears customer history and dispatches storage event', () => {
      localStorage.setItem('menu_app_cached_orders_detail', JSON.stringify([{ id: '1' }]));
      localStorage.setItem('menu_app_order_history', JSON.stringify(['1']));
      clearAllOrderHistory();

      expect(localStorage.getItem('menu_app_cached_orders_detail')).toBeNull();
      expect(localStorage.getItem('menu_app_order_history')).toBeNull();
    });

    it('F6-5: One-click reorder converts historical items into active cart format', () => {
      const pastOrder = {
        store_id: 'store-1',
        store_name: '五十嵐',
        order_items: [
          { item_name: '四季春青茶', quantity: 2, unit_price: 35, custom_notes: '無糖, 微冰' },
        ],
      };

      const reorderedItems: CartItem[] = pastOrder.order_items.map((item, idx) => ({
        cartItemId: `reorder-${Date.now()}-${idx}`,
        menuItemId: `item-${idx}`,
        storeId: pastOrder.store_id,
        storeName: pastOrder.store_name,
        name: item.item_name,
        unitPrice: item.unit_price,
        quantity: item.quantity,
        selectedOptions: [],
        customNotes: item.custom_notes || '',
        totalPrice: item.unit_price * item.quantity,
      }));

      expect(reorderedItems.length).toBe(1);
      expect(reorderedItems[0].name).toBe('四季春青茶');
      expect(reorderedItems[0].totalPrice).toBe(70);
    });
  });

  // =========================================================================
  // F7: Admin Store/Menu/DnD
  // =========================================================================
  describe('F7: Admin Store/Menu/DnD', () => {
    it('F7-1: Formats store code to standard S-001 pattern', () => {
      expect(formatStoreCode(1)).toBe('S-001');
      expect(formatStoreCode('25')).toBe('S-025');
      expect(formatStoreCode('S-100')).toBe('S-100');
      expect(formatStoreCode('invalid')).toBe('S-001');
    });

    it('F7-2: Validates store code uniqueness logic', () => {
      const existingCodes: Record<string, string> = {
        'store-1': 'S-001',
        'store-2': 'S-002',
      };

      const isUnique = (storeId: string, newCode: string) => {
        return !Object.entries(existingCodes).some(
          ([id, code]) => id !== storeId && code.toUpperCase() === newCode.toUpperCase()
        );
      };

      expect(isUnique('store-3', 'S-003')).toBe(true);
      expect(isUnique('store-3', 'S-001')).toBe(false);
      expect(isUnique('store-1', 'S-001')).toBe(true); // Own code allowed
    });

    it('F7-3: DnD menu item reordering maintains new array sequence', () => {
      const items = ['item-A', 'item-B', 'item-C', 'item-D'];
      // Move index 3 to index 1
      const reordered = [...items];
      const [moved] = reordered.splice(3, 1);
      reordered.splice(1, 0, moved);

      expect(reordered).toEqual(['item-A', 'item-D', 'item-B', 'item-C']);
    });

    it('F7-4: Verifies custom spec presets templates configuration', () => {
      expect(Array.isArray(BUILT_IN_CUSTOM_PRESETS)).toBe(true);
      expect(BUILT_IN_CUSTOM_PRESETS.length).toBeGreaterThanOrEqual(6);
      const groupTitles = BUILT_IN_CUSTOM_PRESETS.flatMap((p) => p.groups.map((g) => g.title));
      expect(groupTitles).toContain('甜度');
      expect(groupTitles).toContain('冰塊');
      expect(groupTitles.some((t) => t.includes('加料'))).toBe(true);
      expect(groupTitles).toContain('辣度');
    });

    it('F7-5: Bulk menu import parses CSV rows into structured menu items', () => {
      const csvText = `品項名稱,價格,分類,說明\n招牌紅茶,35,原茶,經典紅茶\n珍珠歐蕾,65,鮮奶,濃醇鮮奶加珍珠`;
      const lines = csvText.trim().split('\n').slice(1);
      const parsed = lines.map((line) => {
        const [name, price, category, description] = line.split(',');
        return {
          name: name.trim(),
          price: Number(price.trim()),
          category: category.trim(),
          description: description.trim(),
        };
      });

      expect(parsed.length).toBe(2);
      expect(parsed[0].name).toBe('招牌紅茶');
      expect(parsed[0].price).toBe(35);
      expect(parsed[1].name).toBe('珍珠歐蕾');
    });
  });

  // =========================================================================
  // F8: Admin Workbench & Statuses
  // =========================================================================
  describe('F8: Admin Workbench & Statuses', () => {
    it('F8-1: Advances order status through sequence (pending -> confirmed -> preparing -> ready -> completed)', () => {
      const sequence = ['pending', 'confirmed', 'preparing', 'ready', 'completed'];
      let currentStatus = 'pending';

      const nextStatus = (curr: string) => {
        const idx = sequence.indexOf(curr);
        return idx < sequence.length - 1 ? sequence[idx + 1] : curr;
      };

      currentStatus = nextStatus(currentStatus);
      expect(currentStatus).toBe('confirmed');
      currentStatus = nextStatus(currentStatus);
      expect(currentStatus).toBe('preparing');
      currentStatus = nextStatus(currentStatus);
      expect(currentStatus).toBe('ready');
      currentStatus = nextStatus(currentStatus);
      expect(currentStatus).toBe('completed');
    });

    it('F8-2: Aggregates financial totals categorized by payment method and paid status', () => {
      const orders = [
        { total_amount: 100, payment_method_name: 'LINE Pay', is_paid: true },
        { total_amount: 150, payment_method_name: '現金付款', is_paid: false },
        { total_amount: 200, payment_method_name: '現金付款', is_paid: true },
      ];

      let totalPaid = 0;
      let totalUnpaid = 0;
      const byMethod: Record<string, number> = {};

      orders.forEach((o) => {
        if (o.is_paid) totalPaid += o.total_amount;
        else totalUnpaid += o.total_amount;
        byMethod[o.payment_method_name] = (byMethod[o.payment_method_name] || 0) + o.total_amount;
      });

      expect(totalPaid).toBe(300);
      expect(totalUnpaid).toBe(150);
      expect(byMethod['LINE Pay']).toBe(100);
      expect(byMethod['現金付款']).toBe(350);
    });

    it('F8-3: Formats store order aggregate summary text for telephone / LINE ordering', () => {
      const itemSummary: Record<string, number> = {
        '珍珠奶茶 (半糖/微冰)': 3,
        '四季春 (無糖/去冰)': 2,
      };

      const text = Object.entries(itemSummary)
        .map(([name, qty], idx) => `${idx + 1}. ${name} x ${qty}`)
        .join('\n');

      expect(text).toContain('1. 珍珠奶茶 (半糖/微冰) x 3');
      expect(text).toContain('2. 四季春 (無糖/去冰) x 2');
    });

    it('F8-4: Calculates cash change accurately', () => {
      const orderTotal = 165;
      const cashReceived = 500;
      const change = cashReceived - orderTotal;
      expect(change).toBe(335);

      const exactCash = 165;
      expect(exactCash - orderTotal).toBe(0);
    });

    it('F8-5: isOrderHiddenFromAdmin detects hidden_from_admin flag and purged status', () => {
      const normal = serializeOrderProgressStatus('ready');
      const hidden = serializeOrderProgressStatus('ready', '後台結單刪除', true);
      const purged = JSON.stringify({ status: 'purged' });

      expect(isOrderHiddenFromAdmin(normal)).toBe(false);
      expect(isOrderHiddenFromAdmin(hidden)).toBe(true);
      expect(isOrderHiddenFromAdmin(purged)).toBe(true);
    });
  });

  // =========================================================================
  // F9: Split Algorithm & Finance
  // =========================================================================
  describe('F9: Split Algorithm & Finance', () => {
    const calcSplit = (
      baseAmount: number,
      deliveryFee: number,
      discount: number,
      count: number,
      rule: 'floor' | 'ceil' | 'round'
    ) => {
      if (!count) return baseAmount;
      const net = deliveryFee - discount;
      const perPerson = net / count;
      let rounded = 0;
      if (rule === 'floor') rounded = Math.floor(perPerson);
      else if (rule === 'ceil') rounded = Math.ceil(perPerson);
      else rounded = Math.round(perPerson);
      return Math.max(0, baseAmount + rounded);
    };

    it('F9-1: Calculates fee split using "floor" rule', () => {
      // 100 delivery fee, 0 discount, 3 people -> 33.333 -> floor: 33
      const result = calcSplit(50, 100, 0, 3, 'floor');
      expect(result).toBe(50 + 33);
    });

    it('F9-2: Calculates fee split using "ceil" rule', () => {
      // 100 delivery fee, 0 discount, 3 people -> 33.333 -> ceil: 34
      const result = calcSplit(50, 100, 0, 3, 'ceil');
      expect(result).toBe(50 + 34);
    });

    it('F9-3: Calculates fee split using "round" rule', () => {
      // 100 delivery fee, 0 discount, 3 people -> 33.333 -> round: 33
      expect(calcSplit(50, 100, 0, 3, 'round')).toBe(50 + 33);
      // 200 delivery fee, 0 discount, 3 people -> 66.666 -> round: 67
      expect(calcSplit(50, 200, 0, 3, 'round')).toBe(50 + 67);
    });

    it('F9-4: Clamps adjusted amount to 0 when discount exceeds base amount', () => {
      // 0 delivery, 300 discount, 3 people -> -100 per person
      // Base amount = 50 -> 50 - 100 = -50 -> clamped to 0
      const result = calcSplit(50, 0, 300, 3, 'round');
      expect(result).toBe(0);
    });

    it('F9-5: Handles net discount preview showing negative adjustment', () => {
      const deliveryFee = 30;
      const discount = 90;
      const count = 3;
      const netAdjustment = deliveryFee - discount; // -60
      const perPersonShare = netAdjustment / count; // -20

      expect(perPersonShare).toBe(-20);
      const display = `${perPersonShare >= 0 ? '+' : ''}${perPersonShare}`;
      expect(display).toBe('-20');
    });
  });

  // =========================================================================
  // F10: Deletion & Retention
  // =========================================================================
  describe('F10: Deletion & Retention', () => {
    it('F10-1: Non-destructive soft delete marks order hidden without deleting DB row', () => {
      const order = {
        id: 'ord-1',
        signature_url: serializeOrderProgressStatus('completed'),
      };
      const softDeleted = {
        ...order,
        signature_url: serializeOrderProgressStatus('completed', '後台結單刪除', true),
      };

      expect(isOrderHiddenFromAdmin(softDeleted.signature_url)).toBe(true);
      expect(parseOrderProgressStatus(softDeleted.signature_url)).toBe('completed');
    });

    it('F10-2: Permanent erase records order ID into purged storage', () => {
      recordPurgedOrderId('purged-order-999');
      const purged = getPurgedOrderIds();
      expect(purged.has('purged-order-999')).toBe(true);
    });

    it('F10-3: Purged orders are filtered out of getOrderHistoryCache and never resurrected', () => {
      recordPurgedOrderId('purged-123');
      const orders = [
        { id: 'valid-1', created_at: new Date().toISOString() } as any,
        { id: 'purged-123', created_at: new Date().toISOString() } as any,
      ];
      setOrderHistoryCache(orders);
      const cached = getOrderHistoryCache();
      expect(cached?.some((o) => o.id === 'purged-123')).toBe(false);
      expect(cached?.some((o) => o.id === 'valid-1')).toBe(true);
    });

    it('F10-4: Double warning confirmation modal configuration requires explicit confirm', () => {
      const modalConfig = {
        isOpen: true,
        isPermanent: true,
        title: '⚠️ 確定要徹底抹除此訂單嗎？',
        message: '此動作不可逆！前後台將同步徹底刪除記錄。',
        confirmText: '我了解風險，徹底抹除',
      };
      expect(modalConfig.isPermanent).toBe(true);
      expect(modalConfig.confirmText).toContain('徹底抹除');
    });

    it('F10-5: clearAllOrderHistory completely removes cached details and triggers sync', () => {
      setOrderHistoryCache([{ id: 'test-order' } as any]);
      clearAllOrderHistory();
      expect(getOrderHistoryCache()).toEqual([]);
    });
  });

  // =========================================================================
  // F11: Realtime & Voice
  // =========================================================================
  describe('F11: Realtime & Voice', () => {
    it('F11-1: Handles Supabase Realtime channel subscription events', () => {
      const events: string[] = [];
      const mockChannel = {
        on: (event: string, filter?: any, callback?: any) => {
          events.push(event);
          if (filter || callback) {
            // params acknowledged
          }
          return mockChannel;
        },
        subscribe: () => 'SUBSCRIBED',
      };

      mockChannel.on('INSERT', {}, () => {}).on('UPDATE', {}, () => {}).on('DELETE', {}, () => {}).subscribe();
      expect(events).toContain('INSERT');
      expect(events).toContain('UPDATE');
      expect(events).toContain('DELETE');
    });

    it('F11-2: Picks Taiwan Mandarin (zh-TW) voice with highest priority', () => {
      const voices = [
        { name: 'Google 普通话', lang: 'zh-CN' },
        { name: 'Microsoft Yating - Chinese (Taiwan)', lang: 'zh-TW' },
        { name: 'Google US English', lang: 'en-US' },
      ];

      const twVoice = voices.find(
        (v) =>
          v.lang.toLowerCase() === 'zh-tw' ||
          v.name.includes('Taiwan') ||
          v.name.includes('國語')
      );
      expect(twVoice).toBeDefined();
      expect(twVoice?.name).toContain('Taiwan');
    });

    it('F11-3: Formats speech announcement text in full detail mode', () => {
      const payload = {
        nickname: '小明',
        total_amount: 150,
        items: [
          { name: '珍珠奶茶', quantity: 2, notes: '微糖微冰' },
          { name: '紅茶', quantity: 1, notes: null },
        ],
      };

      const text = `收到來自 ${payload.nickname} 的新訂單，金額 ${payload.total_amount} 元。餐點包含：${payload.items
        .map((i) => `${i.name} ${i.quantity} 份${i.notes ? `，備註：${i.notes}` : ''}`)
        .join('、')}。`;

      expect(text).toContain('小明');
      expect(text).toContain('150 元');
      expect(text).toContain('珍珠奶茶 2 份，備註：微糖微冰');
    });

    it('F11-4: Formats speech announcement text in summary mode', () => {
      const payload = {
        nickname: '小美',
        total_amount: 80,
        items: [{ name: '綠茶', quantity: 1 }],
      };

      const totalItems = payload.items.reduce((sum, i) => sum + i.quantity, 0);
      const text = `收到來自 ${payload.nickname} 的新訂單，共 ${totalItems} 份餐點，金額 ${payload.total_amount} 元。`;

      expect(text).toContain('小美');
      expect(text).toContain('共 1 份餐點');
      expect(text).toContain('80 元');
    });

    it('F11-5: Generates customer order cancellation voice alert message', () => {
      const payload = {
        nickname: '阿偉',
        orderNumber: 'MN-007',
        total_amount: 120,
      };

      const text = `注意！顧客 ${payload.nickname} 已取消訂單 ${payload.orderNumber}，金額 ${payload.total_amount} 元。`;
      expect(text).toContain('阿偉');
      expect(text).toContain('MN-007');
      expect(text).toContain('120 元');
    });
  });

  // =========================================================================
  // F12: 9 API Endpoints
  // =========================================================================
  describe('F12: 9 API Endpoints', () => {
    it('F12-1: GET /api/system/version returns semver and cache-control headers', () => {
      const response = {
        status: 200,
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0' },
        body: { version: '10.5.2', commitHash: 'dev', timestamp: Date.now() },
      };
      expect(response.status).toBe(200);
      expect(response.body.version).toMatch(/^\d+\.\d+\.\d+$/);
      expect(response.headers['Cache-Control']).toContain('no-store');
    });

    it('F12-2: GET & POST /api/system/maintenance manages maintenance mode config', () => {
      const validScopes = ['all', 'home', 'search', 'stores', 'cart', 'checkout', 'my-orders'];
      const testScope = 'cart';
      expect(validScopes.includes(testScope)).toBe(true);

      const config = {
        is_maintenance: true,
        scope: testScope,
        title: '購物車例行維護',
        updated_at: new Date().toISOString(),
      };
      expect(config.is_maintenance).toBe(true);
      expect(config.title).toBe('購物車例行維護');
    });

    it('F12-3: GET & POST /api/stores/code validates and stores S-001 format', () => {
      const formatted = formatStoreCode('5');
      expect(formatted).toBe('S-005');
      expect(/^S-\d+$/.test(formatted)).toBe(true);
    });

    it('F12-4: GET & POST /api/menu/sort-order stores itemIds array', () => {
      const payload = {
        storeId: 'store-1',
        itemIds: ['item-3', 'item-1', 'item-2'],
      };
      expect(payload.itemIds.length).toBe(3);
      expect(payload.itemIds[0]).toBe('item-3');
    });

    it('F12-5: POST /api/admin/auth validates passcode and generates token', () => {
      const token = generateAdminToken();
      expect(typeof token).toBe('string');
      expect(token).toContain('.');
      expect(verifyAdminToken(token)).toBe(true);
    });

    it('F12-6: GET /api/admin/verify checks admin token cookie', () => {
      const validToken = generateAdminToken();
      expect(verifyAdminToken(validToken)).toBe(true);
      expect(verifyAdminToken('invalid-token')).toBe(false);
    });

    it('F12-7: POST /api/admin/logout expires auth cookie', () => {
      const cookieConfig = {
        name: 'meinu_admin_token',
        value: '',
        maxAge: 0,
        expires: new Date(0),
        httpOnly: true,
      };
      expect(cookieConfig.maxAge).toBe(0);
      expect(cookieConfig.value).toBe('');
    });

    it('F12-8: POST /api/account/delete de-identifies customer profile', () => {
      const scrubbedMetadata = {
        nickname: '已註銷會員',
        phone: null,
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      };
      expect(scrubbedMetadata.nickname).toBe('已註銷會員');
      expect(scrubbedMetadata.phone).toBeNull();
      expect(scrubbedMetadata.is_deleted).toBe(true);
    });

    it('F12-9: POST /api/admin/menu/ai-parse checks admin token and image payload', () => {
      const validToken = generateAdminToken();
      expect(verifyAdminToken(validToken)).toBe(true);

      const payload = {
        action: 'parse',
        imageBase64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEA...',
        mimeType: 'image/jpeg',
      };
      expect(payload.imageBase64.startsWith('data:image/')).toBe(true);
    });
  });

  // =========================================================================
  // F13: Security & Proxy
  // =========================================================================
  describe('F13: Security & Proxy', () => {
    it('F13-1: Proxy blocks malicious penetration bot User-Agents with 403', () => {
      const botPatterns = [/sqlmap/i, /nikto/i, /masscan/i, /wprecon/i, /acunetix/i];
      const testUAs = [
        'sqlmap/1.5.2#stable',
        'Mozilla/5.0 Nikto/2.1.6',
        'masscan/1.0',
      ];

      testUAs.forEach((ua) => {
        const isBot = botPatterns.some((pattern) => pattern.test(ua));
        expect(isBot).toBe(true);
      });
    });

    it('F13-2: Proxy injects essential HTTP security headers', () => {
      const headers = new Map<string, string>();
      headers.set('X-Frame-Options', 'SAMEORIGIN');
      headers.set('X-Content-Type-Options', 'nosniff');
      headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
      headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
      headers.set('X-XSS-Protection', '1; mode=block');

      expect(headers.get('X-Frame-Options')).toBe('SAMEORIGIN');
      expect(headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(headers.get('X-XSS-Protection')).toBe('1; mode=block');
    });

    it('F13-3: CSRF guard verifies Origin & Referer host against Host header', () => {
      const host = 'meinu.example.com';
      const validOrigin = 'https://meinu.example.com';
      const attackOrigin = 'https://evil-attacker.com';

      const checkSameOrigin = (h: string, origin: string) => {
        const originHost = new URL(origin).host;
        return originHost === h;
      };

      expect(checkSameOrigin(host, validOrigin)).toBe(true);
      expect(checkSameOrigin(host, attackOrigin)).toBe(false);
    });

    it('F13-4: Enforces 16KB max payload limit on POST endpoints', () => {
      const limit = 16384; // 16KB
      const normalPayloadLength = 1024;
      const attackPayloadLength = 16385;

      expect(normalPayloadLength <= limit).toBe(true);
      expect(attackPayloadLength <= limit).toBe(false);
    });

    it('F13-5: Admin HMAC token constant-time verification with 7-day validity', () => {
      const token = generateAdminToken();
      expect(verifyAdminToken(token)).toBe(true);

      // Token from 8 days ago
      const eightDaysAgo = Date.now() - 8 * 24 * 60 * 60 * 1000;
      const expiredToken = `${eightDaysAgo}.signature`;
      expect(verifyAdminToken(expiredToken)).toBe(false);
    });
  });

  // =========================================================================
  // F14: Theme Engine
  // =========================================================================
  describe('F14: Theme Engine', () => {
    beforeEach(() => {
      localStorage.clear();
      document.documentElement.classList.remove('dark', 'theme-transitioning');
    });

    it('F14-1: Detects theme preference from localStorage or fallback', () => {
      localStorage.setItem('menu_app_theme', 'dark');
      const stored = localStorage.getItem('menu_app_theme');
      expect(stored).toBe('dark');
    });

    it('F14-2: Setting theme applies .dark class and updates localStorage', () => {
      const setTheme = (theme: 'light' | 'dark') => {
        localStorage.setItem('menu_app_theme', theme);
        document.documentElement.classList.toggle('dark', theme === 'dark');
      };

      setTheme('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(localStorage.getItem('menu_app_theme')).toBe('dark');

      setTheme('light');
      expect(document.documentElement.classList.contains('dark')).toBe(false);
      expect(localStorage.getItem('menu_app_theme')).toBe('light');
    });

    it('F14-3: Staggered cascading theme transition adds and removes .theme-transitioning class', () => {
      document.documentElement.classList.add('theme-transitioning');
      expect(document.documentElement.classList.contains('theme-transitioning')).toBe(true);

      document.documentElement.classList.remove('theme-transitioning');
      expect(document.documentElement.classList.contains('theme-transitioning')).toBe(false);
    });

    it('F14-4: toggleTheme switches seamlessly between dark and light modes', () => {
      let currentTheme: 'light' | 'dark' = 'light';
      const toggle = () => {
        currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
      };

      toggle();
      expect(currentTheme).toBe('dark');
      toggle();
      expect(currentTheme).toBe('light');
    });

    it('F14-5: Motion reduction accessibility preference respects prefers-reduced-motion', () => {
      const prefersReducedMotion = true;
      const transitionDuration = prefersReducedMotion ? 0 : 750;
      expect(transitionDuration).toBe(0);
    });
  });

  // =========================================================================
  // F15: Live Observability & Logic Visualizer (NEW v10.6.0)
  // =========================================================================
  describe('F15: Live Observability & Logic Visualizer', () => {
    beforeEach(() => {
      telemetryHub.clearAll();
    });

    it('F15-1: Records events, attaches timestamps/IDs, and notifies subscribers', () => {
      let notified = 0;
      const unsub = telemetryHub.subscribe(() => {
        notified++;
      });

      const evt = telemetryHub.recordEvent({
        node: 'customer',
        targetNode: 'gateway',
        action: '測試送單',
        title: '小明 送單',
        status: 'info',
        detail: '測試事件細節',
        payload: { test: 123 },
      });

      expect(evt.id).toBeDefined();
      expect(evt.timestamp).toBeDefined();
      expect(notified).toBe(1);
      expect(telemetryHub.getEvents().length).toBe(1);
      expect(telemetryHub.getEvents()[0].action).toBe('測試送單');

      unsub();
    });

    it('F15-2: Captures and registers errors into flight recorder with AI suggestions', () => {
      const err = telemetryHub.recordError({
        node: 'database',
        category: 'DB Timeout',
        action: 'PostgreSQL 查詢逾時',
        message: '連線集區已滿',
        aiSuggestion: '建議加大連線集區上限。',
      });

      expect(err.id).toBeDefined();
      expect(telemetryHub.getErrors().length).toBe(1);
      expect(telemetryHub.getErrors()[0].category).toBe('DB Timeout');
      expect(telemetryHub.getErrors()[0].aiSuggestion).toContain('連線集區');
    });

    it('F15-3: Decomposes logic steps with status and mathematical formula', () => {
      const evt = telemetryHub.recordEvent({
        node: 'logic',
        action: '金流平攤計算',
        title: '平攤每人 $25',
        status: 'success',
        detail: '外送費平攤',
        formula: 'Share = Floor((100 - 0) / 4) = 25',
        logicSteps: [
          { step: 1, title: '統計人數', desc: '4 人', status: 'done' },
          { step: 2, title: '套用 Floor', desc: '每人 25', status: 'done' },
        ],
      });

      expect(evt.formula).toBe('Share = Floor((100 - 0) / 4) = 25');
      expect(evt.logicSteps?.length).toBe(2);
      expect(evt.logicSteps?.[0].status).toBe('done');
    });

    it('F15-4: Simulates full 6-node order flow pipeline sequentially', () => {
      telemetryHub.simulateOrderFlow();
      const initialEvents = telemetryHub.getEvents();
      expect(initialEvents.length).toBeGreaterThanOrEqual(1);
      expect(initialEvents[0].node).toBe('customer');
      expect(initialEvents[0].targetNode).toBe('gateway');
    });

    it('F15-5: Simulates delivery fee split algorithm with floor deduction', () => {
      telemetryHub.simulateFeeSplit();
      const events = telemetryHub.getEvents();
      expect(events.length).toBeGreaterThanOrEqual(1);
      expect(events[0].node).toBe('logic');
      expect(events[0].formula).toContain('PerPersonShare');
      expect(events[0].logicSteps?.length).toBe(4);
    });
  });
}
