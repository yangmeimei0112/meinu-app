'use client';

import { Suspense, useState, useMemo } from 'react';
import Header from '@/components/Header';
import OfflineBanner from '@/components/OfflineBanner';
import MobileBottomNav from '@/components/MobileBottomNav';
import Link from 'next/link';
import {
  History,
  Sparkles,
  ArrowLeft,
  Search,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  Share2,
  Printer,
  ChevronRight,
  Zap,
  Wrench,
  Layers,
  Award,
} from 'lucide-react';
import { CHANGELOG_RELEASES, ChangelogRelease, ChangelogItem } from './changelogData';

type FilterType = 'all' | 'Major' | 'Minor' | 'Patch';

function ChangelogPageContent() {
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedToast, setCopiedToast] = useState(false);

  // 篩選與搜尋處理
  const filteredReleases = useMemo(() => {
    return CHANGELOG_RELEASES.filter((rel) => {
      const matchFilter = selectedFilter === 'all' || rel.tag === selectedFilter;
      if (!matchFilter) return false;

      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      const matchVersion = rel.version.toLowerCase().includes(query);
      const matchSummary = rel.summary.toLowerCase().includes(query);
      const matchHighlights = rel.highlights.some((h) => h.toLowerCase().includes(query));
      const matchItems = rel.items.some(
        (i) => i.title.toLowerCase().includes(query) || i.description.toLowerCase().includes(query)
      );

      return matchVersion || matchSummary || matchHighlights || matchItems;
    });
  }, [selectedFilter, searchQuery]);

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2500);
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const getItemIcon = (type: ChangelogItem['type']) => {
    switch (type) {
      case 'major':
        return <Award className="w-3.5 h-3.5 text-amber-500" />;
      case 'feature':
        return <Zap className="w-3.5 h-3.5 text-sky-500" />;
      case 'enhancement':
        return <Sparkles className="w-3.5 h-3.5 text-indigo-500" />;
      case 'security_legal':
        return <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />;
      case 'fix':
        return <Wrench className="w-3.5 h-3.5 text-orange-500" />;
      default:
        return <Zap className="w-3.5 h-3.5 text-sky-500" />;
    }
  };

  const getTagBadgeStyle = (tag: ChangelogRelease['tag']) => {
    switch (tag) {
      case 'Major':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
      case 'Minor':
        return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30';
      case 'Patch':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
      default:
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="min-h-[100dvh] bg-slate-50 dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] transition-colors duration-200">
      <OfflineBanner />
      <Header />

      {/* 浮動複製提示 Toast */}
      {copiedToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] bg-slate-900/95 dark:bg-slate-800/95 text-white px-4 py-2.5 rounded-2xl text-xs font-bold shadow-2xl border border-slate-700/80 backdrop-blur-md flex items-center gap-2 animate-in fade-in zoom-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>已複製更新日誌連結至剪貼簿！</span>
        </div>
      )}

      <main className="max-w-3xl mx-auto px-4 pt-4 space-y-5">
        {/* 頂部導航與功能按鈕 */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400 transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>返回美食大廳</span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/legal"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:text-sky-600 dark:hover:text-sky-400 text-xs font-bold transition shadow-2xs"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>條款中心</span>
            </Link>

            <button
              type="button"
              onClick={handlePrint}
              className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-sky-500 transition cursor-pointer shadow-2xs"
              title="列印此更新日誌"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-sky-500 transition cursor-pointer shadow-2xs"
              title="分享此更新日誌連結"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 🌟 更新日誌 Header Banner */}
        <div className="relative overflow-hidden bg-gradient-to-br from-white via-sky-50/50 to-indigo-50/40 dark:from-[#131B2B] dark:via-[#162136] dark:to-[#0E1524] rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-[10px] font-extrabold text-sky-600 dark:text-sky-400 bg-sky-500/10 dark:bg-sky-500/20 border border-sky-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
              <History className="w-3 h-3" />
              <span>咩nu 官方版本發布中心</span>
            </span>

            <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold">
              目前最新版本：{CHANGELOG_RELEASES[0]?.version}
            </span>
          </div>

          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>平台更新日誌</span>
            <span className="text-xs text-sky-500 font-mono font-bold bg-sky-500/10 px-2 py-0.5 rounded-lg">
              Changelog
            </span>
          </h1>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">
            詳細記錄「咩nu 團購外送點餐平台」自初始版本以來的各項重大功能里程碑、視覺設計演進、效能提升、資安架構及法規遵循更新。
          </p>

          {/* 數據統計小指標 */}
          <div className="pt-2 grid grid-cols-3 gap-2.5 sm:gap-4 border-t border-slate-100 dark:border-slate-800/80">
            <div className="bg-white/80 dark:bg-slate-900/60 p-2.5 rounded-2xl border border-slate-200/60 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 font-semibold block">歷史版本總數</span>
              <span className="text-base font-black text-slate-800 dark:text-slate-100 font-mono">
                {CHANGELOG_RELEASES.length} 個版本
              </span>
            </div>
            <div className="bg-white/80 dark:bg-slate-900/60 p-2.5 rounded-2xl border border-slate-200/60 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 font-semibold block">重大里程碑 (Major)</span>
              <span className="text-base font-black text-amber-500 font-mono">
                {CHANGELOG_RELEASES.filter((r) => r.tag === 'Major').length} 次躍升
              </span>
            </div>
            <div className="bg-white/80 dark:bg-slate-900/60 p-2.5 rounded-2xl border border-slate-200/60 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 font-semibold block">最新更新生效</span>
              <span className="text-base font-black text-sky-500 font-mono">
                {CHANGELOG_RELEASES[0]?.releaseDate}
              </span>
            </div>
          </div>
        </div>

        {/* 🔍 搜尋與版本篩選列 */}
        <div className="sticky top-2 z-20 space-y-2 bg-slate-50/90 dark:bg-[#0B0F17]/90 backdrop-blur-md py-1">
          {/* 搜尋欄位 */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜尋版本號、重大突破、功能關鍵字 (例如：Passkey, AI, 語音, 簽名)..."
              className="w-full pl-10 pr-4 py-2 rounded-2xl bg-white dark:bg-[#131B2B] border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:border-sky-500 shadow-sm transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* 篩選標籤膠囊 */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            {[
              { id: 'all', label: '全部版本', count: CHANGELOG_RELEASES.length },
              {
                id: 'Major',
                label: '🌟 重大突破 (Major)',
                count: CHANGELOG_RELEASES.filter((r) => r.tag === 'Major').length,
              },
              {
                id: 'Minor',
                label: '🚀 功能擴充 (Minor)',
                count: CHANGELOG_RELEASES.filter((r) => r.tag === 'Minor').length,
              },
              {
                id: 'Patch',
                label: '🛡️ 修復與法規 (Patch)',
                count: CHANGELOG_RELEASES.filter((r) => r.tag === 'Patch').length,
              },
            ].map((f) => {
              const isActive = selectedFilter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSelectedFilter(f.id as FilterType)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-sky-500 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <span>{f.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {f.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 📜 時間軸版本卡片列表 */}
        <div className="relative pl-4 sm:pl-6 space-y-6 before:absolute before:top-3 before:bottom-3 before:left-[19px] sm:before:left-[27px] before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
          {filteredReleases.length === 0 ? (
            <div className="bg-white/90 dark:bg-slate-900/90 rounded-3xl p-8 text-center space-y-2 border border-slate-200 dark:border-slate-800">
              <Layers className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                找不到符合「{searchQuery}」的更新版本
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedFilter('all');
                }}
                className="text-xs text-sky-500 font-bold hover:underline cursor-pointer"
              >
                重設篩選條件
              </button>
            </div>
          ) : (
            filteredReleases.map((release) => (
              <div key={release.version} className="relative group">
                {/* 時間軸節點指示燈 */}
                <div
                  className={`absolute -left-[23px] sm:-left-[31px] top-6 w-4 h-4 rounded-full border-2 bg-white dark:bg-[#0B0F17] flex items-center justify-center transition-all group-hover:scale-125 z-10 ${
                    release.isLatest
                      ? 'border-emerald-500 text-emerald-500 shadow-md shadow-emerald-500/30'
                      : release.tag === 'Major'
                      ? 'border-amber-500 text-amber-500'
                      : release.tag === 'Minor'
                      ? 'border-sky-500 text-sky-500'
                      : 'border-slate-400 text-slate-400'
                  }`}
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${
                      release.isLatest
                        ? 'bg-emerald-500 animate-pulse'
                        : release.tag === 'Major'
                        ? 'bg-amber-500'
                        : release.tag === 'Minor'
                        ? 'bg-sky-500'
                        : 'bg-slate-400'
                    }`}
                  />
                </div>

                {/* 版本內容卡片 */}
                <article className="bg-white/95 dark:bg-[#131B2B]/95 backdrop-blur-xl rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-lg shadow-slate-200/40 dark:shadow-none space-y-4 hover:border-sky-300 dark:hover:border-sky-600/60 transition-all">
                  {/* 版本卡片頭部 */}
                  <div className="flex items-start justify-between flex-wrap gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-lg font-black text-slate-900 dark:text-white font-mono tracking-tight">
                          {release.version}
                        </span>

                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${getTagBadgeStyle(
                            release.tag
                          )}`}
                        >
                          {release.tag} Release
                        </span>

                        {release.isLatest && (
                          <span className="text-[10px] font-extrabold bg-emerald-500 text-white px-2 py-0.5 rounded-md shadow-xs animate-in zoom-in-50 duration-200">
                            最新版本 Current
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                        <Calendar className="w-3 h-3" />
                        <span>發布日期：{release.releaseDate}</span>
                      </div>
                    </div>
                  </div>

                  {/* 重點摘要 */}
                  <p className="text-xs text-slate-700 dark:text-slate-200 font-medium leading-relaxed bg-slate-50/80 dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/60">
                    {release.summary}
                  </p>

                  {/* 亮點快速條列 */}
                  {release.highlights && release.highlights.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                        重點項目亮點
                      </span>
                      <ul className="space-y-1 pl-1">
                        {release.highlights.map((hl, hlIdx) => (
                          <li
                            key={hlIdx}
                            className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2 font-medium"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
                            <span>{hl}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 詳細更新項目清單 */}
                  {release.items && release.items.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                        詳細更新內容
                      </span>
                      <div className="space-y-2">
                        {release.items.map((item, itemIdx) => (
                          <div
                            key={itemIdx}
                            className="p-3 rounded-2xl bg-white dark:bg-[#182234] border border-slate-150 dark:border-slate-700/60 space-y-1 hover:shadow-xs transition"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                                {getItemIcon(item.type)}
                                <span>{item.title}</span>
                              </h4>
                              {item.badgeText && (
                                <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md border border-slate-200/60 dark:border-slate-700/60 shrink-0">
                                  {item.badgeText}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed pl-5">
                              {item.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </article>
              </div>
            ))
          )}
        </div>

        {/* 底部保障與返回 */}
        <div className="p-4 rounded-3xl bg-white/95 dark:bg-[#131B2B]/95 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 flex-wrap gap-2 shadow-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sky-500 shrink-0" />
            <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px] sm:text-xs">
              咩nu 持續為您提供安全、極速、好用的團購點餐體驗
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/legal"
              className="text-sky-600 dark:text-sky-400 font-bold hover:underline flex items-center gap-0.5"
            >
              <span>查看法律條款</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
            <Link
              href="/"
              className="text-sky-600 dark:text-sky-400 font-bold hover:underline flex items-center gap-0.5"
            >
              <span>回大廳點餐</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </main>

      {/* 底部導覽列 */}
      <MobileBottomNav />
    </div>
  );
}

export default function ChangelogPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[100dvh] bg-slate-50 dark:bg-[#0B0F17] flex items-center justify-center text-slate-400 text-xs">
          正在載入更新日誌...
        </div>
      }
    >
      <ChangelogPageContent />
    </Suspense>
  );
}
