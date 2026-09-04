'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import OfflineBanner from '@/components/OfflineBanner';
import MobileBottomNav from '@/components/MobileBottomNav';
import {
  FileText,
  Shield,
  UserCheck,
  Lock,
  ArrowLeft,
  Calendar,
  Sparkles,
  ChevronRight,
  Printer,
  Share2,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import { LEGAL_DOCS, LegalDoc } from './legalContent';

const VALID_TABS: ('terms' | 'privacy' | 'user-terms' | 'security')[] = [
  'terms',
  'privacy',
  'user-terms',
  'security',
];

function LegalPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const rawTab = searchParams.get('tab') || 'terms';

  const initialTab = VALID_TABS.includes(rawTab as any) ? (rawTab as any) : 'terms';
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy' | 'user-terms' | 'security'>(initialTab);
  const [copiedToast, setCopiedToast] = useState(false);

  useEffect(() => {
    if (rawTab && VALID_TABS.includes(rawTab as any)) {
      setActiveTab(rawTab as any);
    }
  }, [rawTab]);

  const handleTabChange = (tab: 'terms' | 'privacy' | 'user-terms' | 'security') => {
    setActiveTab(tab);
    router.replace(`/legal?tab=${tab}`, { scroll: false });
  };

  const currentDoc: LegalDoc = LEGAL_DOCS[activeTab] || LEGAL_DOCS.terms;

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

  const getTabIcon = (id: string) => {
    switch (id) {
      case 'terms':
        return <FileText className="w-4 h-4" />;
      case 'privacy':
        return <Shield className="w-4 h-4" />;
      case 'user-terms':
        return <UserCheck className="w-4 h-4" />;
      case 'security':
        return <Lock className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
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
          <span>已複製條款連結至剪貼簿！</span>
        </div>
      )}

      <main className="max-w-3xl mx-auto px-4 pt-4 space-y-4">
        {/* 頂部導航與標題 */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400 transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>返回大廳</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-sky-500 transition cursor-pointer shadow-2xs"
              title="列印此條款"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-sky-500 transition cursor-pointer shadow-2xs"
              title="分享此條款連結"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 🌟 條款中心 Header Banner */}
        <div className="relative overflow-hidden bg-gradient-to-br from-white via-sky-50/40 to-blue-50/50 dark:from-[#131B2B] dark:via-[#162136] dark:to-[#0E1524] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold text-sky-600 dark:text-sky-400 bg-sky-500/10 dark:bg-sky-500/20 border border-sky-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>咩nu 平台法律與安全中心</span>
            </span>
          </div>

          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            服務協議、隱私與安全政策
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            我們致力於保障您的點餐權益、個人資料隱私與最高標準的生物辨識資安防護。請詳細審閱下列各項協議條款。
          </p>
        </div>

        {/* 🏷️ 4 大協議分頁切換膠囊導覽 */}
        <div className="sticky top-2 z-20 bg-slate-50/90 dark:bg-[#0B0F17]/90 backdrop-blur-md py-1">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-slate-200/80 dark:bg-slate-900/90 rounded-2xl border border-slate-300/80 dark:border-slate-800 shadow-inner">
            {[
              { id: 'terms', label: '服務協議' },
              { id: 'privacy', label: '隱私政策' },
              { id: 'user-terms', label: '使用者條款' },
              { id: 'security', label: '安全協議' },
            ].map((t) => {
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleTabChange(t.id as any)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-white dark:bg-sky-600 text-sky-600 dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {getTabIcon(t.id)}
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 📜 條款主要內容卡片 */}
        <article className="bg-white/95 dark:bg-[#131B2B]/95 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-6">
          {/* 文件標題區 */}
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4 space-y-1.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center">
                  {getTabIcon(currentDoc.id)}
                </span>
                <span>{currentDoc.title}</span>
              </h2>

              <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                最後更新生效日：{currentDoc.lastUpdated}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {currentDoc.subtitle}
            </p>
          </div>

          {/* 各章節條款列表 */}
          <div className="space-y-6">
            {currentDoc.sections.map((sec, idx) => (
              <section key={idx} className="space-y-2.5">
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-500" />
                  <span>{sec.title}</span>
                </h3>

                <div className="space-y-2 pl-3.5 border-l-2 border-slate-100 dark:border-slate-800/80">
                  {sec.content.map((paragraph, pIdx) => (
                    <p
                      key={pIdx}
                      className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          {/* 底部保障標語 */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-500" />
              <span className="font-bold text-slate-700 dark:text-slate-300">
                咩nu 平台遵循中華民國法律規範與國際 FIDO2 安全標準
              </span>
            </div>
            <Link
              href="/"
              className="text-sky-600 dark:text-sky-400 font-bold hover:underline flex items-center gap-0.5"
            >
              <span>回首頁點餐</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </article>
      </main>

      {/* 底部導覽列 */}
      <MobileBottomNav />
    </div>
  );
}

export default function LegalPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[100dvh] bg-slate-50 dark:bg-[#0B0F17] flex items-center justify-center text-slate-400 text-xs">
          正在載入條款與安全中心...
        </div>
      }
    >
      <LegalPageContent />
    </Suspense>
  );
}
