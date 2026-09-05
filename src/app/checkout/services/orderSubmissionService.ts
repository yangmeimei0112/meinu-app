import { supabase } from '@/lib/supabase';
import { CartItem, MultiStoreCart } from '@/types/cart';
import { GroupOrder } from '@/types/database';
import { sanitizeInput } from '@/lib/security';
import { generateSequentialOrderNumber } from '@/lib/order-utils';
import { serializeOrderProgressStatus } from '@/types/orderStatus';
import { telemetryHub } from '@/lib/telemetry/telemetryHub';

export interface OrderSubmissionParams {
  targetStoreId: string;
  cartItems: CartItem[];
  cleanNickname: string;
  selectedPayment: string;
  selectedSoldOut: string;
  activeGroupOrder: GroupOrder | null;
  grandTotal: number;
  signatureData?: string | null;
}

export interface OrderSubmissionResult {
  orderNumber: string;
  submissionId: string;
  storeName: string;
  totalAmount: number;
}

/**
 * 📦 結帳送單核心資料庫作業服務
 * 包含：訂單編號流水號生成、訂單主表記錄、明細餐點與選項寫入、本地多店家購物車清理、即時快照預載
 */
export async function executeOrderSubmissionPipeline({
  targetStoreId,
  cartItems,
  cleanNickname,
  selectedPayment,
  selectedSoldOut,
  activeGroupOrder,
  grandTotal,
  signatureData,
}: OrderSubmissionParams): Promise<OrderSubmissionResult> {
  const storeId = targetStoreId || cartItems[0]?.storeId;
  if (!storeId) throw new Error('缺少店家資訊');

  // 1. 檢查店家是否處於接單中狀態
  const [storeRes, groupRes] = await Promise.all([
    supabase
      .from('stores')
      .select('id, is_active')
      .eq('id', storeId)
      .maybeSingle(),
    supabase
      .from('group_orders')
      .select('id, status, enable_countdown, cutoff_time')
      .eq('store_id', storeId)
      .neq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (storeRes.data && storeRes.data.is_active === false) {
    throw new Error('該店家目前已下架或暫停服務，無法送出新訂單！');
  }

  if (groupRes.data) {
    let isStoreAccepting = groupRes.data.status !== 'closed';
    if (groupRes.data.enable_countdown && groupRes.data.cutoff_time) {
      const remainingSecs = Math.floor((new Date(groupRes.data.cutoff_time).getTime() - Date.now()) / 1000);
      if (remainingSecs <= 0) {
        isStoreAccepting = false;
      }
    }

    if (!isStoreAccepting) {
      throw new Error('該店家目前處於暫停接單狀態，無法送出新訂單！');
    }
  }

  let activeGroupId = activeGroupOrder?.id || groupRes.data?.id;

  if (!activeGroupId) {
    const { data: existingGroup } = await supabase
      .from('group_orders')
      .select('id')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingGroup) {
      activeGroupId = existingGroup.id;
    } else {
      try {
        const { data: newGroup, error: groupErr } = await supabase
          .from('group_orders')
          .insert([
            {
              store_id: storeId,
              title: `${cartItems[0]?.storeName || '美味餐點'} 點餐團`,
              status: 'open',
            },
          ])
          .select('id')
          .single();
        if (!groupErr && newGroup) {
          activeGroupId = (newGroup as { id: string }).id;
        }
      } catch {
        const { data: fallbackGroup } = await supabase.from('group_orders').select('id').limit(1).maybeSingle();
        if (fallbackGroup) activeGroupId = fallbackGroup.id;
      }
    }
  }

  const orderNumber = activeGroupId
    ? await generateSequentialOrderNumber(supabase, activeGroupId)
    : `MN-${Math.floor(100 + Math.random() * 900)}`;

  const safeGrandTotal = Math.max(0, Math.round(grandTotal));

  const initialProgressPayload = serializeOrderProgressStatus('pending');

  const subPayload: any = {
    group_order_id: activeGroupId || null,
    user_nickname: cleanNickname,
    payment_method_name: sanitizeInput(selectedPayment, 40),
    sold_out_option: sanitizeInput(selectedSoldOut, 40),
    total_amount: safeGrandTotal,
    final_amount: safeGrandTotal,
    order_number: orderNumber,
    is_paid: false,
    signature_url: initialProgressPayload,
    signature_data: signatureData || null,
  };

  const { data: submission, error: subErr } = await supabase
    .from('order_submissions')
    .insert([subPayload])
    .select('id')
    .single();

  if (subErr || !submission) throw subErr || new Error('建立訂單記錄失敗');

  const itemsPayload = cartItems.map((item) => {
    const optionsText = (item.selectedOptions || []).map((o) => o.itemName).filter(Boolean).join(', ');
    const notesText = item.customNotes ? `備註: ${item.customNotes}` : '';
    const combinedNotes = [optionsText, notesText].filter(Boolean).join(' | ');

    return {
      submission_id: submission.id,
      item_name: sanitizeInput(item.name, 60),
      quantity: Math.max(1, Math.min(99, item.quantity)),
      unit_price: Math.max(0, Math.round(item.unitPrice)),
      custom_notes: combinedNotes ? sanitizeInput(combinedNotes, 150) : null,
    };
  });

  const { data: insertedItems, error: itemsErr } = await supabase
    .from('order_items')
    .insert(itemsPayload)
    .select('id');

  if (itemsErr) throw itemsErr;

  // 嘗試寫入 order_item_options（若表存在），若失敗靜默略過，不阻斷下單流程
  try {
    if (insertedItems) {
      const optionsPayload: Array<{
        order_item_id: string;
        option_name: string;
        extra_price: number;
      }> = [];

      insertedItems.forEach((dbItem, idx) => {
        const cartItem = cartItems[idx];
        if (cartItem && cartItem.selectedOptions) {
          cartItem.selectedOptions.forEach((opt) => {
            optionsPayload.push({
              order_item_id: dbItem.id,
              option_name: sanitizeInput(opt.itemName, 40),
              extra_price: Math.max(0, Math.round(opt.extraPrice)),
            });
          });
        }
      });

      if (optionsPayload.length > 0) {
        await supabase.from('order_item_options').insert(optionsPayload);
      }
    }
  } catch (optErr) {
    console.warn('寫入 order_item_options 略過:', optErr);
  }

  // 送單成功後，從多店家購物車中移除該店家
  if (typeof window !== 'undefined') {
    const savedMulti = localStorage.getItem('menu_app_multi_cart');
    if (savedMulti) {
      try {
        const parsed: MultiStoreCart = JSON.parse(savedMulti);
        delete parsed[storeId];
        localStorage.setItem('menu_app_multi_cart', JSON.stringify(parsed));
      } catch {}
    }

    localStorage.setItem('menu_app_last_order_id', submission.id);
    localStorage.setItem('menu_app_has_new_order', 'true');
    try {
      const historyRaw = localStorage.getItem('menu_app_order_history');
      const historyList: string[] = historyRaw ? JSON.parse(historyRaw) : [];
      if (!historyList.includes(submission.id)) {
        historyList.unshift(submission.id);
        localStorage.setItem('menu_app_order_history', JSON.stringify(historyList.slice(0, 50)));
      }
    } catch (e) {
      console.error(e);
    }

    // 🌟 同步寫入全域與本機歷史訂單快取 (確保任何情況下前台歷史訂單永不遺失)
    try {
      const historyRecord = {
        id: submission.id,
        group_order_id: activeGroupId,
        order_number: orderNumber,
        user_nickname: cleanNickname,
        payment_method_name: sanitizeInput(selectedPayment, 40),
        sold_out_option: sanitizeInput(selectedSoldOut, 40),
        total_amount: safeGrandTotal,
        final_amount: safeGrandTotal,
        is_paid: false,
        signature_url: initialProgressPayload,
        signature_data: signatureData || null,
        created_at: new Date().toISOString(),
        order_items: itemsPayload.map((item, idx) => ({
          id: insertedItems?.[idx]?.id || `item-${idx}`,
          item_name: item.item_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          custom_notes: item.custom_notes || null,
          menuItemId: cartItems[idx]?.menuItemId,
          selectedOptions: cartItems[idx]?.selectedOptions || [],
          rawCustomSelections: cartItems[idx]?.rawCustomSelections,
        })),
        group_orders: {
          id: activeGroupId || '',
          store_id: storeId,
          status: 'open',
          stores: {
            id: storeId,
            name: cartItems[0]?.storeName || '店家',
            image_url: null,
          },
        },
      };

      const rawDetail = localStorage.getItem('menu_app_cached_orders_detail');
      const existingList = rawDetail ? JSON.parse(rawDetail) : [];
      const updatedList = [
        historyRecord,
        ...(Array.isArray(existingList) ? existingList.filter((o: any) => o.id !== submission.id) : []),
      ].slice(0, 50);
      localStorage.setItem('menu_app_cached_orders_detail', JSON.stringify(updatedList));
    } catch (e) {
      console.error('寫入歷史訂單快取失敗:', e);
    }

    try {
      window.dispatchEvent(new Event('menu_app_orders_updated'));
      window.dispatchEvent(new Event('storage'));
    } catch {}

    // 🚀 遙測紀錄：顧客送單全流程與運作邏輯
    try {
      telemetryHub.recordEvent({
        node: 'customer',
        targetNode: 'database',
        action: '顧客提交訂單',
        title: `${cleanNickname} 送單成功 (${orderNumber})`,
        status: 'success',
        detail: `店家: ${cartItems[0]?.storeName || '合作店家'} | 餐點品項: ${cartItems.length} 項 | 總金額: $${safeGrandTotal} 元 | 付款: ${selectedPayment}`,
        payload: {
          submissionId: submission.id,
          orderNumber,
          user_nickname: cleanNickname,
          total_amount: safeGrandTotal,
          itemsCount: cartItems.length,
          payment: selectedPayment,
        },
        logicSteps: [
          { step: 1, title: '驗證顧客輸入', desc: '完成暱稱、付款方式與缺貨處理防護校驗', status: 'done' },
          { step: 2, title: '產生流水單號', desc: `生成單號 ${orderNumber}`, status: 'done' },
          { step: 3, title: '寫入 PostgreSQL 主表與明細表', desc: `插入 order_submissions (${submission.id}) 與 ${itemsPayload.length} 筆品項`, status: 'done' },
          { step: 4, title: '更新本地 SWR 快取', desc: '寫入 localStorage menu_app_cached_orders_detail 達成 0ms 歷史留存', status: 'done' },
        ],
      });
    } catch {}

    // ⚡ 建立訂單背景預載入快取（跳轉至訂單狀態頁 0ms 瞬開）
    try {
      const preloadedCache = {
        order: {
          id: submission.id,
          group_order_id: activeGroupId,
          order_number: orderNumber,
          user_nickname: cleanNickname,
          payment_method_name: sanitizeInput(selectedPayment, 40),
          sold_out_option: sanitizeInput(selectedSoldOut, 40),
          total_amount: safeGrandTotal,
          final_amount: safeGrandTotal,
          is_paid: false,
          signature_url: initialProgressPayload,
          signature_data: signatureData || null,
          created_at: new Date().toISOString(),
        },
        orderItems: itemsPayload.map((item, idx) => ({
          id: insertedItems?.[idx]?.id || `item-${idx}`,
          item_name: item.item_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          custom_notes: item.custom_notes || null,
          menuItemId: cartItems[idx]?.menuItemId,
          selectedOptions: cartItems[idx]?.selectedOptions || [],
          rawCustomSelections: cartItems[idx]?.rawCustomSelections,
        })),
        groupOrder: activeGroupOrder
          ? {
              id: activeGroupOrder.id,
              store_id: activeGroupOrder.store_id,
              status: activeGroupOrder.status,
              stores: {
                id: activeGroupOrder.store_id,
                name: cartItems[0]?.storeName || '店家',
              },
            }
          : null,
      };
      sessionStorage.setItem(`meinu_order_cache_${submission.id}`, JSON.stringify(preloadedCache));
    } catch (e) {
      console.error('儲存訂單預載快取失敗', e);
    }
  }

  return {
    orderNumber,
    submissionId: submission.id,
    storeName: cartItems[0]?.storeName || '',
    totalAmount: safeGrandTotal,
  };
}
