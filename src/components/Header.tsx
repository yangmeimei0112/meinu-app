'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';

export default function Header() {
  const [shortCode, setShortCode] = useState<string>('');

  const handleSearchCode = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!shortCode.trim()) return;
    alert(`搜尋團購快碼：#${shortCode}`);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-sky-100 shadow-xs">
      <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between gap-2">
        {/* 品牌名稱 */}
        <Link href="/" className="flex items-center gap-1.5 shrink-0">
          <span className="text-2xl">🍱</span>
          <h1 className="text-xl font-extrabold bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent">
            咩nu
          </h1>
        </Link>

        {/* 4 位數團購快碼搜尋 */}
        <form onSubmit={handleSearchCode} className="flex-1 max-w-[170px]">
          <div className="relative">
            <input
              type="text"
              maxLength={4}
              placeholder="輸入快碼 #8888"
              value={shortCode}
              onChange={(e) => setShortCode(e.target.value)}
              className="w-full bg-slate-100 text-xs text-slate-800 rounded-full py-1.5 pl-3 pr-7 focus:outline-none focus:ring-2 focus:ring-sky-400 border border-transparent transition"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-sky-500 text-xs p-1"
            >
              🔍
            </button>
          </div>
        </form>

        {/* 📱 團購 QR Code 按鈕 */}
        <button
          type="button"
          onClick={() => alert('📱 現場 QR Code 展示：掃碼直達「咩nu」大廳')}
          className="bg-sky-50 hover:bg-sky-100 text-sky-600 p-2 rounded-full text-sm font-medium transition flex items-center justify-center shrink-0 border border-sky-100"
          title="顯示現場 QR Code"
        >
          📱
        </button>
      </div>
    </header>
  );
}