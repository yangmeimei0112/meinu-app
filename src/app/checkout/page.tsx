'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import OfflineBanner from '@/components/OfflineBanner';
import BudgetLimitNotice from '@/components/BudgetLimitNotice';
import CheckoutSummary from './components/CheckoutSummary';
import CheckoutCustomerForm from './components/CheckoutCustomerForm';
import CheckoutOptions from './components/CheckoutOptions';
import OrderSuccessModal from '@/components/OrderSuccessModal';
import DoubleConfirmModal from '@/components/DoubleConfirmModal';
import { ChevronLeft, ClipboardList, ArrowRight, Loader2 } from 'lucide-react';
import { useCheckoutOrder } from './hooks/useCheckoutOrder';

function CheckoutContent() {
  const searchParams = useSearchParams();
  const targetStoreId = searchParams.get('storeId') || '';

  const {
    cartItems,
    paymentMethods,
    soldOutOptions,
    activeGroupOrder,
    nickname,
    setNickname,
    selectedPayment,
    setSelectedPayment,
    selectedSoldOut,
    setSelectedSoldOut,
    checkingDuplicate,
    hasDuplicateNickname,
    honeypotTrap,
    setHoneypotTrap,
    toastMessage,
    isSubmitting,
    successModalData,
    duplicateConfirmModal,
    setDuplicateConfirmModal,
    grandTotal,
    handleCopyAccount,
    handleSubmitOrder,
  } = useCheckoutOrder({ targetStoreId });

  return (
    <div className="min-h-[100dvh] bg-slate-50 dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 pb-[calc(7rem+env(safe-area-inset-bottom,0px))] transition-colors duration-200">
      <OfflineBanner />
      <Header />

      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900 dark:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-lg border border-slate-700 animate-in fade-in zoom-in duration-200">
          {toastMessage}
        </div>
      )}

      <main className="max-w-md mx-auto px-4 pt-3 space-y-4">
        <Link
          href="/cart"
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-sky-500 dark:hover:text-sky-400 transition py-1"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>返回購物車修改品項</span>
        </Link>

        <div className="flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-sky-500" />
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">確認點餐與結帳</h2>
        </div>

        {/* 🍯 蜜罐陷阱欄位：視覺不可見，捕捉自動化機器人腳本 */}
        <div
          aria-hidden="true"
          style={{ opacity: 0, position: 'absolute', top: -9999, left: -9999, height: 0, width: 0, zIndex: -1, overflow: 'hidden' }}
        >
          <label htmlFor="user_website_trap">請勿填寫此欄位</label>
          <input
            id="user_website_trap"
            type="text"
            name="user_website_trap"
            tabIndex={-1}
            autoComplete="off"
            value={honeypotTrap}
            onChange={(e) => setHoneypotTrap(e.target.value)}
          />
        </div>

        {cartItems.length === 0 ? (
          <div className="bg-white dark:bg-[#131B2B] rounded-3xl p-8 text-center border border-slate-100 dark:border-slate-800 space-y-3">
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">購物車目前沒有餐點喔！</p>
            <Link
              href="/"
              className="inline-flex items-center gap-1 bg-sky-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-xs"
            >
              <span>去大廳看看</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <>
            {/* 個人預算補貼提醒 */}
            {activeGroupOrder?.enable_budget_limit && activeGroupOrder?.budget_limit_amount && (
              <BudgetLimitNotice
                budgetLimit={activeGroupOrder.budget_limit_amount}
                totalAmount={grandTotal}
              />
            )}

            {/* 1. 點餐明細 */}
            <CheckoutSummary cartItems={cartItems} grandTotal={grandTotal} />

            {/* 2. 顧客訂購暱稱表單 */}
            <CheckoutCustomerForm
              nickname={nickname}
              onNicknameChange={setNickname}
              checkingDuplicate={checkingDuplicate}
              hasDuplicateNickname={hasDuplicateNickname}
            />

            {/* 3. 付款方式與 4. 缺貨備案 */}
            <CheckoutOptions
              paymentMethods={paymentMethods}
              selectedPayment={selectedPayment}
              onSelectPayment={setSelectedPayment}
              soldOutOptions={soldOutOptions}
              selectedSoldOut={selectedSoldOut}
              onSelectSoldOut={setSelectedSoldOut}
              onCopyAccount={handleCopyAccount}
            />

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmitOrder}
              className="w-full bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold py-3.5 rounded-2xl text-base shadow-lg hover:brightness-105 active:scale-[0.99] transition disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>正在送出訂單...</span>
                </>
              ) : (
                `確認送出訂單 ($${grandTotal} 元)`
              )}
            </button>
          </>
        )}
      </main>

      {/* 🎉 訂單送出成功精緻動態轉場視窗 */}
      <OrderSuccessModal
        isOpen={successModalData.isOpen}
        orderNumber={successModalData.orderNumber}
        submissionId={successModalData.submissionId}
        storeName={successModalData.storeName}
        totalAmount={successModalData.totalAmount}
      />

      {/* ⚠️ 同暱稱防撞二次確認自訂彈窗 */}
      <DoubleConfirmModal
        isOpen={duplicateConfirmModal.isOpen}
        title={duplicateConfirmModal.title}
        message={duplicateConfirmModal.message}
        confirmText={duplicateConfirmModal.confirmText}
        cancelText={duplicateConfirmModal.cancelText}
        isDanger={false}
        onConfirm={duplicateConfirmModal.onConfirm}
        onCancel={() => setDuplicateConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
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