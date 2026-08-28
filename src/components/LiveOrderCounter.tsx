'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Flame, TrendingUp } from 'lucide-react';

interface LiveOrderCounterProps {
  initialCount?: number;
  initialAmount?: number;
  storeId?: string;
}

export default function LiveOrderCounter({
  initialCount,
  initialAmount,
  storeId,
}: LiveOrderCounterProps) {
  const [count, setCount] = useState<number>(initialCount || 0);
  const [totalAmount, setTotalAmount] = useState<number>(initialAmount || 0);
  const [hasData, setHasData] = useState<boolean>(
    (initialCount !== undefined && initialCount > 0) || false
  );

  // P1-B：使用 ref 防止組件卸載後 setState，並加入 debounce 節流 Realtime 回呼
  const isMountedRef = useRef(true);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      let groupQuery = supabase.from('group_orders').select('id').eq('status', 'open');
      if (storeId) {
        groupQuery = groupQuery.eq('store_id', storeId);
      }

      const { data: groups } = await groupQuery;
      if (!isMountedRef.current) return;

      if (groups && groups.length > 0) {
        const groupIds = groups.map((g) => g.id);
        const { data: submissions } = await supabase
          .from('order_submissions')
          .select('id, total_amount')
          .in('group_order_id', groupIds);

        if (!isMountedRef.current) return;

        if (submissions) {
          setCount(submissions.length);
          const sum = submissions.reduce((acc, curr) => acc + (curr.total_amount || 0), 0);
          setTotalAmount(sum);
          setHasData(submissions.length > 0);
        }
      } else {
        // 沒有開放中的團購時，清空計數
        if (isMountedRef.current) {
          setCount(0);
          setTotalAmount(0);
          setHasData(false);
        }
      }
    } catch (err) {
      console.error('Fetch live order stats error:', err);
    }
  }, [storeId]);

  // 節流版 fetchStats：多筆訂單同時到達時只觸發一次
  const debouncedFetchStats = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      fetchStats();
    }, 200);
  }, [fetchStats]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchStats();

    // ⚡ 實時訂閱新送單與更新，加入 debounce 防止連發多次查詢
    const channel = supabase
      .channel('live-order-counter-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'order_submissions' },
        debouncedFetchStats
      )
      .subscribe();

    return () => {
      isMountedRef.current = false;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [fetchStats, debouncedFetchStats]);

  if (!hasData && count === 0) return null;

  return (
    <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-sky-500/10 dark:from-amber-950/30 dark:via-slate-900/40 dark:to-sky-950/30 border border-amber-200/60 dark:border-amber-900/40 text-slate-800 dark:text-slate-100 rounded-2xl p-3 shadow-xs flex items-center justify-between gap-2 animate-in fade-in duration-300">
      <div className="flex items-center gap-2 min-w-0">
        <span className="relative flex h-3 w-3 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
        </span>
        <div className="min-w-0">
          <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100 truncate flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>全團點餐進度</span>
          </p>
          <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
            目前已收到 <span className="font-extrabold text-amber-600 dark:text-amber-400">{count}</span> 筆訂單，共累計{' '}
            <span className="font-extrabold text-sky-600 dark:text-sky-400">${totalAmount} 元</span>
          </p>
        </div>
      </div>
      <div className="bg-white dark:bg-slate-800 px-2.5 py-1 rounded-xl text-[10px] font-extrabold text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40 shadow-2xs shrink-0 flex items-center gap-1">
        <span>熱烈跟風中</span>
        <TrendingUp className="w-3 h-3 text-amber-500" />
      </div>
    </div>
  );
}
