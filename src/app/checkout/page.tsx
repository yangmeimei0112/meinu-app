'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import { supabase } from '@/lib/supabase';
import { CartItem, MultiStoreCart } from '@/types/cart';
import { PaymentMethod, SoldOutOption } from '@/types/database';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetStoreId = searchParams.get('storeId') || '';

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [soldOutOptions, setSoldOutOptions] = useState<SoldOutOption[]>([]);

  const [nickname, setNickname] = useState<string>('');
  const [selectedPayment, setSelectedPayment] = useState<string>('');
  const [selectedSoldOut, setSelectedSoldOut] = useState<string>('');

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // 1. 載入指定店家的購物車品項與暱稱
  useEffect(() => {
    const savedMulti = localStorage.getItem('menu_app_multi_cart');
    if (savedMulti) {
      try {
        const parsed: MultiStoreCart = JSON.parse(savedMulti);
        // 若網址上有指定 storeId，則抓該店；否則抓第一家店
        const key = targetStoreId || Object.keys(parsed)[0];
        if (key && parsed[key]) {
          setCartItems(parsed[key].items);
        }
      } catch (e) {
        console.error('讀取多店家購物車失敗', e);
      }
    }

    const savedNickname = localStorage.getItem('menu_app_user_nickname');
    if (savedNickname) setNickname(savedNickname);
  }, [targetStoreId]);

  // 2. 抓取付款方式與缺貨備案
  useEffect(() => {
    async function fetchCheckoutMeta() {
      const { data: pmData } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('is_active', true);

      const { data: soData } = await supabase
        .from('sold_out_options')
        .select('*')
        .order('sort_order', { ascending: true });

      if (pmData && pmData.length > 0) {
        setPaymentMethods(pmData as PaymentMethod[]);
        setSelectedPayment(pmData[0].name);
      }
      if (soData && soData.length > 0) {
        setSoldOutOptions(soData as SoldOutOption[]);
        setSelectedSoldOut(soData[0].title);
      }
    }

    fetchCheckoutMeta();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleCopyAccount = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('📋 已複製帳號資訊至剪貼簿！');
  };

  const grandTotal = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);

  const handleSubmitOrder = async () => {
    if (!nickname.trim()) {
      showToast('⚠️ 請填寫您的暱稱，方便團長對帳！');
      return;
    }

    if (cartItems.length === 0) {
      showToast('⚠️ 購物車是空的，請先挑選餐點！');
      return;
    }

    setIsSubmitting(true);

    try {
      localStorage.setItem('menu_app_user_nickname', nickname.trim());

      const storeId = cartItems[0].storeId;
      const storeName = cartItems[0].storeName;

      let activeGroupId = '';
      const { data: existingGroup } = await supabase
        .from('group_orders')
        .select('id')
        .eq('store_id', storeId)
        .eq('status', 'open')
        .limit(1);

      if (existingGroup && existingGroup.length > 0) {
        activeGroupId = existingGroup[0].id;
      } else {
        const { data: newGroup, error: groupErr } = await supabase
          .from('group_orders')
          .insert({
            title: `${storeName} 團購活動`,
            store_id: storeId,
            status: 'open',
          })
          .select('id')
          .single();

        if (groupErr || !newGroup) throw new Error('建立團購活動失敗');
        activeGroupId = newGroup.id;
      }

      const orderNumber = `MN-${Date.now().toString().slice(-6)}`;
      const { data: submission, error: subErr } = await supabase
        .from('order_submissions')
        .insert({
          group_order_id: activeGroupId,
          order_number: orderNumber,
          user_nickname: nickname.trim(),
          payment_method_name: selectedPayment,
          sold_out_option: selectedSoldOut,
          total_amount: grandTotal,
          final_amount: grandTotal,
          is_paid: false,
        })
        .select('id')
        .single();

      if (subErr || !submission) throw new Error('建立訂單失敗');

      for (const item of cartItems) {
        const customOptionText = item.selectedOptions
          .map((opt) => `${opt.groupTitle}:${opt.itemName}`)
          .join(', ');

        const { data: orderItem, error: itemErr } = await supabase
          .from('order_items')
          .insert({
            submission_id: submission.id,
            item_name: item.name,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            custom_notes: item.customNotes
              ? `${customOptionText} | 備註: ${item.customNotes}`
              : customOptionText,
          })
          .select('id')
          .single();

        if (!itemErr && orderItem) {
          for (const opt of item.selectedOptions) {
            await supabase.from('order_item_options').insert({
              order_item_id: orderItem.id,
              option_name: `${opt.groupTitle}: ${opt.itemName}`,
              extra_price: opt.extraPrice,
            });
          }
        }
      }

      // 送單成功後，從多店家購物車中移除該店家
      const savedMulti = localStorage.getItem('menu_app_multi_cart');
      if (savedMulti) {
        const parsed: MultiStoreCart = JSON.parse(savedMulti);
        delete parsed[storeId];
        localStorage.setItem('menu_app_multi_cart', JSON.stringify(parsed));
      }

      localStorage.setItem('menu_app_last_order_id', submission.id);
      alert(`🎉 訂單送出成功！單號：${orderNumber}`);
      router.push(`/order-status/${submission.id}`);
    } catch (err) {
      console.error(err);
      showToast('❌ 送出失敗，請重試或檢查網路連線');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <Header />

      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-lg animate-in fade-in zoom-in duration-200">
          {toastMessage}
        </div>
      )}

      <main className="max-w-md mx-auto px-4 pt-3 space-y-4">
        <Link
          href="/cart"
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-sky-500 transition py-1"
        >
          ‹ 返回購物車修改品項
        </Link>

        <h2 className="text-xl font-extrabold text-slate-800">📋 確認點餐與結帳</h2>

        {cartItems.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 space-y-3">
            <p className="text-sm font-semibold text-slate-600">購物車目前沒有餐點喔！</p>
            <Link
              href="/"
              className="inline-block bg-sky-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-xs"
            >
              去大廳看看 ➔
            </Link>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                1. 點餐明細 ({cartItems[0]?.storeName})
              </h3>
              <div className="divide-y divide-slate-100">
                {cartItems.map((item) => (
                  <div key={item.cartItemId} className="py-2.5 space-y-1">
                    <div className="flex items-center justify-between text-sm font-bold text-slate-800">
                      <span>
                        {item.name} x {item.quantity}
                      </span>
                      <span>${item.totalPrice} 元</span>
                    </div>
                    {item.selectedOptions.length > 0 && (
                      <p className="text-xs text-slate-400">
                        {item.selectedOptions
                          .map((opt) => `${opt.groupTitle}: ${opt.itemName}`)
                          .join(' / ')}
                      </p>
                    )}
                    {item.customNotes && (
                      <p className="text-xs text-sky-600">備註：{item.customNotes}</p>
                    )}
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between font-extrabold text-base text-slate-800">
                <span>合計總金額</span>
                <span className="text-sky-600">${grandTotal} 元</span>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xs space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>2. 你的訂購暱稱 <span className="text-sky-500">*</span></span>
                <span className="text-[10px] text-slate-400">下次會自動記憶</span>
              </label>
              <input
                type="text"
                placeholder="例如：小明 / 行銷部 賢義"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
            </div>

            <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-700">3. 選擇付款方式</h3>
              <div className="space-y-2">
                {paymentMethods.map((pm) => {
                  const isSelected = selectedPayment === pm.name;
                  return (
                    <div
                      key={pm.id}
                      onClick={() => setSelectedPayment(pm.name)}
                      className={`p-3 rounded-2xl border transition cursor-pointer space-y-1.5 ${
                        isSelected
                          ? 'border-sky-500 bg-sky-50/50'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">{pm.name}</span>
                        <span className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${
                          isSelected ? 'border-sky-500 bg-sky-500 text-white' : 'border-slate-300'
                        }`}>
                          {isSelected && '✓'}
                        </span>
                      </div>
                      {pm.account_info && (
                        <div className="flex items-center justify-between bg-white p-2 rounded-xl border border-slate-100">
                          <p className="text-[11px] text-slate-500 truncate mr-2">
                            {pm.account_info}
                          </p>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyAccount(pm.account_info || '');
                            }}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold px-2.5 py-1 rounded-lg shrink-0 transition"
                          >
                            📋 複製帳號
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-700">4. 若店家品項缺貨時的備案</h3>
              <div className="space-y-2">
                {soldOutOptions.map((so) => {
                  const isSelected = selectedSoldOut === so.title;
                  return (
                    <div
                      key={so.id}
                      onClick={() => setSelectedSoldOut(so.title)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition flex items-center justify-between ${
                        isSelected
                          ? 'border-sky-500 bg-sky-50/50 text-sky-600'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>{so.title}</span>
                      {isSelected && <span className="font-bold">✓</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmitOrder}
              className="w-full bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold py-3.5 rounded-2xl text-base shadow-lg hover:brightness-105 active:scale-[0.99] transition disabled:opacity-50"
            >
              {isSubmitting ? '正在送出訂單...' : `確認送出訂單 ($${grandTotal} 元)`}
            </button>
          </>
        )}
      </main>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">載入結帳頁面中...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}