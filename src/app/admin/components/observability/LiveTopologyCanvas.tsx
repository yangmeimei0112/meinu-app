'use client';

import React from 'react';
import {
  Smartphone,
  ShieldCheck,
  Cpu,
  Database,
  Radio,
  Volume2,
  Activity,
  Zap,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import type { TelemetryNodeId, TelemetryEvent } from '@/lib/telemetry/telemetryHub';

interface LiveTopologyCanvasProps {
  events: TelemetryEvent[];
  errorCount: number;
  activeNode: TelemetryNodeId | null;
  onSelectNode: (node: TelemetryNodeId) => void;
}

interface NodeConfig {
  id: TelemetryNodeId;
  name: string;
  role: string;
  icon: React.ElementType;
  gradient: string;
  borderActive: string;
  glow: string;
}

const NODES: NodeConfig[] = [
  {
    id: 'customer',
    name: '顧客前台 (Customer UI)',
    role: '探索 / 客製規格 / 簽名結帳 / 狀態追蹤',
    icon: Smartphone,
    gradient: 'from-sky-500/20 to-blue-500/10 text-sky-500',
    borderActive: 'border-sky-500 shadow-sky-500/30',
    glow: 'bg-sky-500',
  },
  {
    id: 'gateway',
    name: 'API 閘道 (API Gateway)',
    role: '9 大 API 路由 / CSRF 防禦 / 16KB DoS 檢驗',
    icon: ShieldCheck,
    gradient: 'from-indigo-500/20 to-purple-500/10 text-indigo-500',
    borderActive: 'border-indigo-500 shadow-indigo-500/30',
    glow: 'bg-indigo-500',
  },
  {
    id: 'logic',
    name: '商業邏輯引擎 (Logic Engine)',
    role: '金額累加 / 平攤演算法 / 5 階段狀態機',
    icon: Cpu,
    gradient: 'from-purple-500/20 to-pink-500/10 text-purple-500',
    borderActive: 'border-purple-500 shadow-purple-500/30',
    glow: 'bg-purple-500',
  },
  {
    id: 'database',
    name: 'PostgreSQL 資料庫 (Supabase)',
    role: '8 大資料表 / RLS 隔離 / SWR 本地持久化',
    icon: Database,
    gradient: 'from-emerald-500/20 to-teal-500/10 text-emerald-500',
    borderActive: 'border-emerald-500 shadow-emerald-500/30',
    glow: 'bg-emerald-500',
  },
  {
    id: 'realtime',
    name: 'Realtime 廣播網 (WebSocket)',
    role: '訂單 INSERT / UPDATE / DELETE 毫秒級推播',
    icon: Radio,
    gradient: 'from-amber-500/20 to-orange-500/10 text-amber-500',
    borderActive: 'border-amber-500 shadow-amber-500/30',
    glow: 'bg-amber-500',
  },
  {
    id: 'audio',
    name: '語音合成與警示 (TTS Audio)',
    role: '臺灣國語語音播報 / 訂單取消彈窗佇列',
    icon: Volume2,
    gradient: 'from-rose-500/20 to-pink-500/10 text-rose-500',
    borderActive: 'border-rose-500 shadow-rose-500/30',
    glow: 'bg-rose-500',
  },
];

export function LiveTopologyCanvas({
  events,
  errorCount,
  activeNode,
  onSelectNode,
}: LiveTopologyCanvasProps) {
  // 最新觸發的節點
  const latestEvent = events[0];
  const activeNodeId = activeNode || latestEvent?.node || 'customer';

  return (
    <div className="bg-white/90 dark:bg-[#111827]/90 backdrop-blur-xl rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-lg space-y-6">
      {/* 頂部全景監控儀表列 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <h3 className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span>全景流程即時拓撲畫布</span>
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                LIVE 觀測中
              </span>
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
            點擊任一架構節點可聚焦該模組，右側將圖解解讀運作邏輯與公式推導。
          </p>
        </div>

        {/* 系統即時指標計數 */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700 text-xs font-bold">
            <Activity className="w-3.5 h-3.5 text-sky-500 animate-pulse" />
            <span className="text-slate-500 dark:text-slate-400">總事件:</span>
            <span className="text-slate-800 dark:text-slate-100 font-black">{events.length}</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700 text-xs font-bold">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-slate-500 dark:text-slate-400">響應延遲:</span>
            <span className="text-slate-800 dark:text-slate-100 font-black">~18ms</span>
          </div>

          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl border text-xs font-bold ${
              errorCount > 0
                ? 'bg-rose-500/10 border-rose-500/40 text-rose-600 dark:text-rose-400'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {errorCount > 0 ? (
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500 animate-bounce" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            )}
            <span>異常報錯:</span>
            <span className="font-black">{errorCount}</span>
          </div>
        </div>
      </div>

      {/* 🌐 6 大核心拓撲節點格狀畫布 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {NODES.map((node, index) => {
          const Icon = node.icon;
          const isActive = activeNodeId === node.id;
          const isSource = latestEvent?.node === node.id;
          const isTarget = latestEvent?.targetNode === node.id;

          return (
            <button
              key={node.id}
              type="button"
              onClick={() => onSelectNode(node.id)}
              className={`relative text-left p-4 rounded-3xl border transition-all duration-300 group cursor-pointer overflow-hidden ${
                isActive
                  ? `bg-slate-50 dark:bg-slate-800/90 ${node.borderActive} shadow-lg ring-2 ring-sky-500/20`
                  : 'bg-slate-50/50 dark:bg-[#161F30]/60 border-slate-200/70 dark:border-slate-800/80 hover:bg-white dark:hover:bg-slate-800'
              }`}
            >
              {/* 動態光流脈衝背景 (當節點觸發時) */}
              {(isSource || isTarget) && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-sky-500/10 to-transparent animate-pulse pointer-events-none" />
              )}

              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center bg-gradient-to-br ${node.gradient} shadow-xs transition-transform group-hover:scale-105`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black text-slate-400 dark:text-slate-500">
                        NODE 0{index + 1}
                      </span>
                      {isSource && (
                        <span className="text-[9px] font-black px-1.5 py-0.2 rounded-md bg-sky-500 text-white animate-pulse">
                          發送端
                        </span>
                      )}
                      {isTarget && (
                        <span className="text-[9px] font-black px-1.5 py-0.2 rounded-md bg-indigo-500 text-white animate-pulse">
                          接收端
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100">
                      {node.name}
                    </h4>
                  </div>
                </div>

                {/* 節點狀態呼吸燈 */}
                <div className="flex items-center gap-1 mt-1">
                  <span className={`w-2 h-2 rounded-full ${node.glow} animate-pulse`} />
                </div>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-2.5 line-clamp-1">
                {node.role}
              </p>

              {/* 節點連線指示 */}
              <div className="mt-3 pt-2.5 border-t border-slate-200/50 dark:border-slate-800/60 flex items-center justify-between text-[10px] font-bold text-slate-400">
                <span>點擊透視運作邏輯</span>
                <span className="group-hover:translate-x-0.5 transition-transform text-sky-500 font-black">
                  檢視詳情 →
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* 📡 動態訊號光點流動流水線視覺條 */}
      <div className="relative overflow-hidden bg-slate-100 dark:bg-[#0B101D] p-3 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between gap-2 text-[11px] font-black text-slate-600 dark:text-slate-300">
        <div className="flex items-center gap-1.5 shrink-0 text-sky-500">
          <Zap className="w-4 h-4" />
          <span>訊號動態流：</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5">
          <span className="px-2 py-0.5 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 shrink-0">顧客端送單</span>
          <span className="text-slate-400">➔</span>
          <span className="px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">API 閘道消毒</span>
          <span className="text-slate-400">➔</span>
          <span className="px-2 py-0.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">金額/狀態機運算</span>
          <span className="text-slate-400">➔</span>
          <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">PostgreSQL 寫入</span>
          <span className="text-slate-400">➔</span>
          <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">Realtime 推播</span>
          <span className="text-slate-400">➔</span>
          <span className="px-2 py-0.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 shrink-0">臺灣國語報單</span>
        </div>
      </div>
    </div>
  );
}
