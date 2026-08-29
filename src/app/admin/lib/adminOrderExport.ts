'use client';

import { GroupOrderAdmin, OrderSubmissionAdmin } from '../admin-types';

// 📋 複製個人對帳明細
export async function copyPersonalReceipt(
  sub: OrderSubmissionAdmin,
  showToast: (msg: string) => void
) {
  let text = `【咩nu 團購金額對帳】\n${sub.user_nickname} 你好！你點了：\n---\n`;
  (sub.order_items || []).forEach((item) => {
    text += `• ${item.item_name} x ${item.quantity} ($${item.unit_price * item.quantity})\n`;
    if (item.custom_notes) text += `   備註：${item.custom_notes}\n`;
  });
  text += `---\n個人小計：$${sub.final_amount} 元 (${sub.payment_method_name})\n`;
  text += `狀態：${sub.is_paid ? '已付款' : '待付款'}\n請儘速核對金額，謝謝！`;

  try {
    await navigator.clipboard.writeText(text);
    showToast(`已複製 ${sub.user_nickname} 的個人對帳明細！`);
  } catch {
    showToast('複製失敗');
  }
}

// 📋 複製向店家下單文字
export async function copyStoreOrderText(
  activeGroup: GroupOrderAdmin | null,
  itemSummary: Record<string, number>,
  grandTotal: number,
  showToast: (msg: string) => void
) {
  let text = `【咩nu 團購向店家下單總表】\n店家：${activeGroup?.stores?.name || activeGroup?.title || '美味店家'}\n---\n`;
  Object.entries(itemSummary).forEach(([name, qty], idx) => {
    text += `${idx + 1}. ${name} x ${qty}\n`;
  });
  text += `---\n總份數：${Object.values(itemSummary).reduce((a, b) => a + b, 0)} 份\n總金額：$${grandTotal} 元\n感謝老闆！`;

  try {
    await navigator.clipboard.writeText(text);
    showToast('已複製叫餐報單文字！');
  } catch {
    showToast('複製失敗');
  }
}

// 📋 複製未付款催繳通知
export async function copyUnpaidReminder(
  activeGroup: GroupOrderAdmin | null,
  submissions: OrderSubmissionAdmin[],
  showToast: (msg: string) => void
) {
  const unpaidList = submissions.filter((s) => !s.is_paid);
  if (!unpaidList.length) {
    showToast('全員皆已完成付款，無須催繳！');
    return;
  }

  let text = `【咩nu 團購催繳提醒】\n活動：${activeGroup?.title}\n以下朋友尚未完成付款，請儘速繳費喔：\n---\n`;
  unpaidList.forEach((s) => {
    text += `• ${s.user_nickname}：$${s.final_amount} 元 (${s.payment_method_name})\n`;
  });
  text += `---\n感謝配合！`;

  try {
    await navigator.clipboard.writeText(text);
    showToast('已複製未付款催繳通知文字！');
  } catch {
    showToast('複製失敗');
  }
}

// 📥 匯出訂單 CSV 檔案
export function exportOrdersCSV(
  activeGroup: GroupOrderAdmin | null,
  submissions: OrderSubmissionAdmin[],
  showToast: (msg: string) => void
) {
  if (!submissions.length) {
    showToast('目前尚無訂單可匯出');
    return;
  }

  const headers = ['訂單編號', '訂購人', '付款方式', '缺貨備案', '付款狀態', '應付金額', '點餐明細', '下單時間'];
  const rows = submissions.map((sub) => {
    const itemsDetail = (sub.order_items || [])
      .map((i) => `${i.item_name} x ${i.quantity}${i.custom_notes ? ` (${i.custom_notes})` : ''}`)
      .join('; ');
    return [
      `#${sub.order_number}`,
      `"${sub.user_nickname.replace(/"/g, '""')}"`,
      `"${sub.payment_method_name}"`,
      `"${sub.sold_out_option || '無'}"`,
      sub.is_paid ? '已付款' : '未付款',
      sub.final_amount,
      `"${itemsDetail.replace(/"/g, '""')}"`,
      new Date(sub.created_at).toLocaleString(),
    ];
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `咩nu訂單匯出_${activeGroup?.title || '所有'}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('訂單 CSV 已成功下載！');
}
