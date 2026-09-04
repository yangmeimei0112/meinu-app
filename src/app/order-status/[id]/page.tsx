'use client';

import { use } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import OfflineBanner from '@/components/OfflineBanner';
import DoubleConfirmModal from '@/components/DoubleConfirmModal';
import OrderStatusActions from './components/OrderStatusActions';
import OrderStatusReceipt from './components/OrderStatusReceipt';
import { OrderStatusHeaderCard } from './components/OrderStatusHeaderCard';
import { OrderStatusProgressTracker } from './components/OrderStatusProgressTracker';
import { useOrderStatus } from './hooks/useOrderStatus';
import { parseOrderProgressStatus } from '@/types/orderStatus';
import { ChevronLeft, ArrowRight, HelpCircle } from 'lucide-react';

export default function OrderStatusPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const submissionId = resolvedParams.id;

  const {
    order,
    orderItems,
    loading,
    timeLeft,
    isClosed,
    isActionDisabled,
    isOrderOwner,
    toastMessage,
    confirmModalConfig,
    setConfirmModalConfig,
    setIsTimerPaused,
    handleOpenModifyModal,
    handleOpenCancelModal,
    handleExecuteModalAction,
  } = useOrderStatus(submissionId);

  const progressStatus = order ? parseOrderProgressStatus(order.signature_url) : 'pending';

  return (
    <div className="min-h-[100dvh] bg-slate-50 dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] transition-colors duration-200">
      <OfflineBanner />
      <Header />

      {/* 自訂浮動通知視窗 */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 dark:bg-slate-800/95 text-white text-xs font-bold px-5 py-3 rounded-full shadow-2xl border border-slate-700 backdrop-blur-md animate-in fade-in zoom-in duration-200 flex items-center gap-2">
          <span>{toastMessage}</span>
        </div>
      )}

      <main className="max-w-md mx-auto px-4 pt-3 space-y-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-sky-500 dark:hover:text-sky-400 transition py-1"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>返回「咩nu」大廳</span>
        </Link>

        {loading ? (
          <div className="bg-white dark:bg-[#131B2B] rounded-3xl p-8 text-center text-slate-400 dark:text-slate-500 text-sm animate-pulse border border-slate-100 dark:border-slate-800">
            正在載入訂單狀態與明細...
          </div>
        ) : !order ? (
          <div className="bg-white dark:bg-[#131B2B] rounded-3xl p-8 text-center text-slate-500 dark:text-slate-400 space-y-3 border border-slate-100 dark:border-slate-800">
            <HelpCircle className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto stroke-[1.5]" />
            <p className="font-extrabold text-slate-700 dark:text-slate-200">找不到該筆訂單資訊</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">訂單可能已被取消或連結單號不正確。</p>
            <Link
              href="/"
              className="inline-flex items-center gap-1 bg-sky-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs"
            >
              <span>返回大廳</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <>
            {/* 🌟 實時訂單進度流程表 (Visual Stepper & Progress Tracker) */}
            <OrderStatusProgressTracker
              status={progressStatus}
              orderNumber={order.order_number}
              userNickname={order.user_nickname}
            />

            {/* 訂單成功與對帳標籤卡片 */}
            <OrderStatusHeaderCard
              orderNumber={order.order_number}
              isPaid={order.is_paid}
              progressStatus={progressStatus}
            />

            {/* 1 分鐘限時自主修改/取消卡片（僅訂單擁有者裝置且店家尚未接單製作時可操作） */}
            {isOrderOwner && progressStatus === 'pending' && (
              <OrderStatusActions
                timeLeft={timeLeft}
                isClosed={isClosed}
                isActionDisabled={isActionDisabled}
                onOpenModify={handleOpenModifyModal}
                onOpenCancel={handleOpenCancelModal}
              />
            )}

            {/* 明細收據卡片 */}
            <OrderStatusReceipt
              order={order}
              orderItems={orderItems}
            />
          </>
        )}
      </main>

      {/* 雙重確認視窗 (開啟期間暫停倒數計時) */}
      <DoubleConfirmModal
        isOpen={confirmModalConfig.isOpen}
        title={confirmModalConfig.title}
        message={confirmModalConfig.message}
        confirmText={confirmModalConfig.confirmText}
        cancelText="保留訂單"
        isDanger={confirmModalConfig.isDanger}
        onConfirm={handleExecuteModalAction}
        onCancel={() => setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }))}
        onTimerPause={(pause) => setIsTimerPaused(pause)}
      />
    </div>
  );
}