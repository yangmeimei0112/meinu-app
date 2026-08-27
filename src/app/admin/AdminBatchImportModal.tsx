'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { CustomGroup } from '@/types/database';
import { Download, X, Coffee, UtensilsCrossed, FileText, Upload } from 'lucide-react';

interface AdminBatchImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: string | null;
  storeName: string;
  onImportSuccess: () => void;
}

export default function AdminBatchImportModal({
  isOpen,
  onClose,
  storeId,
  storeName,
  onImportSuccess,
}: AdminBatchImportModalProps) {
  const [csvContent, setCsvContent] = useState<string>('');
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; isError: boolean } | null>(null);

  if (!isOpen || !storeId) return null;

  // 下載連鎖店範本 CSV
  const handleDownloadTemplate = (templateType: '50lan' | 'mcdonalds' | 'blank') => {
    let csvText = '餐點名稱,價格,簡介,是否售完,客製選項設定\n';

    if (templateType === '50lan') {
      csvText += `珍珠奶茶,50,招牌必喝波霸奶茶,false,甜度[正常甜:0|少糖:0|半糖:0|微糖:0|無糖:0];冰塊[正常冰:0|少冰:0|微冰:0|去冰:0];加料[波霸:10|椰果:10|仙草:10]\n`;
      csvText += `四季春茶,35,高山嚴選清香回甘四季春,false,甜度[正常甜:0|少糖:0|半糖:0|微糖:0|無糖:0];冰塊[正常冰:0|少冰:0|微冰:0|去冰:0];加料[波霸:10|椰果:10|仙草:10]\n`;
      csvText += `紅茶拿鐵,60,斯里蘭卡紅茶搭配濃醇鮮乳,false,甜度[正常甜:0|少糖:0|半糖:0|微糖:0|無糖:0];冰塊[正常冰:0|少冰:0|微冰:0|去冰:0];加料[波霸:10|椰果:10]\n`;
      csvText += `八冰綠,50,桔子檸檬搭配綠茶酸甜解膩,false,甜度[正常甜:0|少糖:0|半糖:0|微糖:0|無糖:0];冰塊[正常冰:0|少冰:0|微冰:0|去冰:0]\n`;
    } else if (templateType === 'mcdonalds') {
      csvText += `大麥克套餐,145,雙層純牛肉經典美味,false,配餐[經典薯條:0|地瓜條:10|麥克鷄塊:15];飲料[可樂:0|雪碧:0|檸檬紅茶:0|無糖綠茶:0]\n`;
      csvText += `麥克鷄塊(6塊)套餐,125,經典酥脆麥克鷄塊,false,沾醬[糖醋醬:0|蜂蜜芥末醬:0|泰式香辣醬:0];配餐[經典薯條:0|地瓜條:10];飲料[可樂:0|雪碧:0|無糖綠茶:0]\n`;
      csvText += `勁辣鷄腿堡套餐,145,整塊辣味去骨鷄腿肉,false,配餐[經典薯條:0|地瓜條:10];飲料[可樂:0|雪碧:0|無糖綠茶:0]\n`;
      csvText += `蛋捲冰淇淋,18,濃郁奶香甜筒冰淇淋,false,\n`;
    } else {
      csvText += `餐點名稱A,60,餐點簡介描述,false,規格名稱[選項1:0|選項2:10]\n`;
    }

    const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csvText], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${templateType}_menu_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 讀取上傳的 CSV 檔案
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatusMsg(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      setCsvContent(text);
    };
    reader.readAsText(file, 'utf-8');
  };

  // 解析並執行批次匯入
  const handleExecuteImport = async () => {
    setStatusMsg(null);
    if (!csvContent.trim()) {
      setStatusMsg({ text: '請先貼上或上傳 CSV 內容！', isError: true });
      return;
    }

    setIsImporting(true);
    try {
      const lines = csvContent.trim().split('\n');
      const rows = lines.map((l) => l.trim()).filter(Boolean);

      // 去掉第一行標題
      const dataRows = rows.slice(1);
      if (dataRows.length === 0) {
        setStatusMsg({ text: 'CSV 內容為空或無有效資料列！', isError: true });
        setIsImporting(false);
        return;
      }

      let successCount = 0;

      for (const line of dataRows) {
        const parts = line.split(',');
        if (parts.length < 2) continue;

        const name = parts[0]?.trim();
        const price = Number(parts[1]?.trim()) || 0;
        const description = parts[2]?.trim() || null;
        const isSoldOut = parts[3]?.trim().toLowerCase() === 'true';
        const customRulesStr = parts[4]?.trim() || '';

        // 解析客製化規則: 甜度[正常甜:0|半糖:0];加料[波霸:10]
        const customGroups: CustomGroup[] = [];
        if (customRulesStr) {
          const groupBlocks = customRulesStr.split(';');
          groupBlocks.forEach((block, idx) => {
            const match = block.match(/(.+?)\[(.+?)\]/);
            if (match) {
              const title = match[1].trim();
              const optionsRaw = match[2].trim().split('|');
              const options = optionsRaw.map((optStr, optIdx) => {
                const [optName, optPrice] = optStr.split(':');
                return {
                  id: `opt-${idx}-${optIdx}-${Date.now()}`,
                  name: optName.trim(),
                  price_adjustment: Number(optPrice?.trim()) || 0,
                };
              });

              customGroups.push({
                id: `grp-${idx}-${Date.now()}`,
                title,
                type: title.includes('加料') || title.includes('加購') ? 'any' : 'single',
                options,
              });
            }
          });
        }

        const { error } = await supabase.from('menu_items').insert({
          store_id: storeId,
          name,
          price,
          description,
          is_sold_out: isSoldOut,
          custom_groups: customGroups.length > 0 ? customGroups : null,
        });

        if (!error) {
          successCount++;
        }
      }

      setStatusMsg({
        text: `成功匯入 ${successCount} 個菜單品項至「${storeName}」！`,
        isError: false,
      });
      setTimeout(() => {
        setCsvContent('');
        onImportSuccess();
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Batch import error:', err);
      setStatusMsg({ text: '匯入失敗，請檢查 CSV 格式是否符合範本', isError: true });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#131B2B] w-full max-w-lg rounded-3xl p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150 border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-100">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-sky-500" />
            <div>
              <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">
                菜單 CSV 批量匯入 ({storeName})
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-400">快速上傳整間店家的餐點、價格與客製選項</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center font-bold text-xs cursor-pointer"
            aria-label="關閉"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 狀態與錯誤自訂通知橫幅 */}
        {statusMsg && (
          <div
            className={`p-3 rounded-2xl text-xs font-bold border animate-in fade-in zoom-in-95 duration-150 ${
              statusMsg.isError
                ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-900/70 text-rose-700 dark:text-rose-300'
                : 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-900/70 text-emerald-700 dark:text-emerald-300'
            }`}
          >
            {statusMsg.text}
          </div>
        )}

        {/* 範本下載按鈕群 */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">下載連鎖店菜單範本</label>
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => handleDownloadTemplate('50lan')}
              className="bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-300 font-bold text-[11px] px-3 py-1.5 rounded-xl border border-sky-100 dark:border-sky-800/60 transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <Coffee className="w-3.5 h-3.5" />
              <span>50嵐飲料範本</span>
            </button>
            <button
              type="button"
              onClick={() => handleDownloadTemplate('mcdonalds')}
              className="bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-bold text-[11px] px-3 py-1.5 rounded-xl border border-amber-100 dark:border-amber-800/60 transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <UtensilsCrossed className="w-3.5 h-3.5" />
              <span>麥當勞套餐範本</span>
            </button>
            <button
              type="button"
              onClick={() => handleDownloadTemplate('blank')}
              className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[11px] px-3 py-1.5 rounded-xl border border-transparent dark:border-slate-700 transition active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>空白 CSV 範本</span>
            </button>
          </div>
        </div>

        {/* 上傳檔案與文字輸入 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="csv-batch-textarea" className="text-xs font-bold text-slate-700 dark:text-slate-300">上傳 CSV 檔案或貼上內容</label>
            <label htmlFor="csv-file-upload-input" className="cursor-pointer bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold px-2.5 py-1 rounded-lg border border-transparent dark:border-slate-700 transition flex items-center gap-1">
              <Upload className="w-3 h-3" />
              <span>選擇檔案</span>
              <input
                id="csv-file-upload-input"
                name="csvFileUpload"
                aria-label="選擇 CSV 檔案上傳"
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          <textarea
            id="csv-batch-textarea"
            name="csvBatchContent"
            aria-label="CSV 批次匯入內容"
            rows={7}
            placeholder={`餐點名稱,價格,簡介,是否售完,客製選項設定\n珍珠奶茶,50,波霸奶茶,false,甜度[半糖:0|微糖:0];加料[波霸:10]`}
            value={csvContent}
            onChange={(e) => setCsvContent(e.target.value)}
            className="w-full bg-slate-50 dark:bg-[#182234] font-mono text-[11px] border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400"
          />
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-2 px-4 rounded-xl text-xs transition cursor-pointer"
          >
            取消
          </button>

          <button
            type="button"
            disabled={isImporting || !csvContent.trim()}
            onClick={handleExecuteImport}
            className="bg-gradient-to-r from-sky-500 to-blue-600 hover:brightness-105 text-white font-bold py-2 px-5 rounded-xl text-xs shadow-md transition active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{isImporting ? '正在批量匯入...' : '開始批量匯入'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
