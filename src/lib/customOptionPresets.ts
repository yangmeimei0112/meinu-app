'use client';

import { CustomGroup } from '@/types/database';

export interface CustomOptionPreset {
  id: string;
  name: string;
  description?: string;
  isBuiltIn?: boolean;
  category?: 'beverage' | 'food' | 'general';
  groups: CustomGroup[];
  createdAt?: number;
}

export const BUILT_IN_CUSTOM_PRESETS: CustomOptionPreset[] = [
  {
    id: 'preset-drink-sizes',
    name: '飲料容量尺寸（中杯 / 大杯 / 特大杯 / 瓶裝）',
    description: '標準手搖飲與咖啡杯型尺寸單選規格（中杯 +$0、大杯 +$10、特大杯 +$20）',
    isBuiltIn: true,
    category: 'beverage',
    groups: [
      {
        id: 'builtin-grp-drink-size',
        title: '容量尺寸',
        type: 'single',
        options: [
          { id: 'opt-size-m', name: '中杯 (M)', price_adjustment: 0 },
          { id: 'opt-size-l', name: '大杯 (L)', price_adjustment: 10 },
          { id: 'opt-size-xl', name: '特大杯 (XL)', price_adjustment: 20 },
          { id: 'opt-size-bottle', name: '分享瓶裝 (Bottle)', price_adjustment: 35 },
        ],
      },
    ],
  },
  {
    id: 'preset-drink-full-combo',
    name: '經典茶飲全套（容量尺寸 + 甜度 + 冰塊）',
    description: '中杯/大杯尺寸選擇結合台灣標準甜度與冰塊 3 組規格全套',
    isBuiltIn: true,
    category: 'beverage',
    groups: [
      {
        id: 'builtin-grp-drink-size-combo',
        title: '容量尺寸',
        type: 'single',
        options: [
          { id: 'opt-combo-size-m', name: '中杯 (M)', price_adjustment: 0 },
          { id: 'opt-combo-size-l', name: '大杯 (L)', price_adjustment: 10 },
          { id: 'opt-combo-size-xl', name: '特大杯 (XL)', price_adjustment: 20 },
        ],
      },
      {
        id: 'builtin-grp-sweetness-combo',
        title: '甜度',
        type: 'single',
        options: [
          { id: 'opt-combo-sw-100', name: '正常糖 (100%)', price_adjustment: 0 },
          { id: 'opt-combo-sw-70', name: '少糖 (70%)', price_adjustment: 0 },
          { id: 'opt-combo-sw-50', name: '半糖 (50%)', price_adjustment: 0 },
          { id: 'opt-combo-sw-30', name: '微糖 (30%)', price_adjustment: 0 },
          { id: 'opt-combo-sw-0', name: '無糖 (0%)', price_adjustment: 0 },
        ],
      },
      {
        id: 'builtin-grp-ice-combo',
        title: '冰塊',
        type: 'single',
        options: [
          { id: 'opt-combo-ice-normal', name: '正常冰', price_adjustment: 0 },
          { id: 'opt-combo-ice-less', name: '少冰', price_adjustment: 0 },
          { id: 'opt-combo-ice-micro', name: '微冰', price_adjustment: 0 },
          { id: 'opt-combo-ice-no', name: '去冰', price_adjustment: 0 },
          { id: 'opt-combo-ice-hot', name: '溫熱', price_adjustment: 0 },
        ],
      },
    ],
  },
  {
    id: 'preset-food-portions',
    name: '餐點份量大小（小份 / 中份 / 大份）',
    description: '小份(+$0)、中份(+$15)、大份(+$30) 多尺寸單選份量規格',
    isBuiltIn: true,
    category: 'food',
    groups: [
      {
        id: 'builtin-grp-food-portion',
        title: '份量大小',
        type: 'single',
        options: [
          { id: 'opt-portion-s', name: '小份 / 標準', price_adjustment: 0 },
          { id: 'opt-portion-m', name: '中份', price_adjustment: 15 },
          { id: 'opt-portion-l', name: '大份 (加大)', price_adjustment: 30 },
        ],
      },
    ],
  },
  {
    id: 'preset-drink-sweet-ice',
    name: '經典茶飲（甜度 + 冰塊）',
    description: '台灣手搖飲最標準之甜度與冰塊 2 組規格組合',
    isBuiltIn: true,
    category: 'beverage',
    groups: [
      {
        id: 'builtin-grp-sweetness',
        title: '甜度',
        type: 'single',
        options: [
          { id: 'opt-sw-100', name: '正常糖 (100%)', price_adjustment: 0 },
          { id: 'opt-sw-70', name: '少糖 (70%)', price_adjustment: 0 },
          { id: 'opt-sw-50', name: '半糖 (50%)', price_adjustment: 0 },
          { id: 'opt-sw-30', name: '微糖 (30%)', price_adjustment: 0 },
          { id: 'opt-sw-20', name: '二分糖 (20%)', price_adjustment: 0 },
          { id: 'opt-sw-10', name: '一分糖 (10%)', price_adjustment: 0 },
          { id: 'opt-sw-0', name: '無糖 (0%)', price_adjustment: 0 },
        ],
      },
      {
        id: 'builtin-grp-ice',
        title: '冰塊',
        type: 'single',
        options: [
          { id: 'opt-ice-normal', name: '正常冰', price_adjustment: 0 },
          { id: 'opt-ice-less', name: '少冰', price_adjustment: 0 },
          { id: 'opt-ice-micro', name: '微冰', price_adjustment: 0 },
          { id: 'opt-ice-no', name: '去冰', price_adjustment: 0 },
          { id: 'opt-ice-complete-no', name: '完全去冰', price_adjustment: 0 },
          { id: 'opt-ice-room', name: '常溫', price_adjustment: 0 },
          { id: 'opt-ice-hot', name: '溫熱', price_adjustment: 0 },
        ],
      },
    ],
  },
  {
    id: 'preset-drink-toppings',
    name: '熱門手搖配料/加料',
    description: '珍珠、椰果、仙草凍等複選加料選項',
    isBuiltIn: true,
    category: 'beverage',
    groups: [
      {
        id: 'builtin-grp-toppings',
        title: '加料選擇 (可複選)',
        type: 'any',
        options: [
          { id: 'opt-top-pearl', name: '波霸珍珠', price_adjustment: 10 },
          { id: 'opt-top-coconut', name: '椰果', price_adjustment: 10 },
          { id: 'opt-top-grassjelly', name: '嫩仙草凍', price_adjustment: 10 },
          { id: 'opt-top-pudding', name: '統一布丁', price_adjustment: 15 },
          { id: 'opt-top-tea-jelly', name: '茉莉茶凍', price_adjustment: 10 },
          { id: 'opt-top-hantian', name: '寒天晶球', price_adjustment: 15 },
          { id: 'opt-top-double-pearl', name: '雙倍珍珠', price_adjustment: 15 },
        ],
      },
    ],
  },
  {
    id: 'preset-spicy-levels',
    name: '經典辣度選擇',
    description: '從不辣到地獄大辣之 6 段辣度單選規格',
    isBuiltIn: true,
    category: 'food',
    groups: [
      {
        id: 'builtin-grp-spicy',
        title: '辣度',
        type: 'single',
        options: [
          { id: 'opt-sp-0', name: '不辣 (原味)', price_adjustment: 0 },
          { id: 'opt-sp-1', name: '微辣', price_adjustment: 0 },
          { id: 'opt-sp-2', name: '小辣', price_adjustment: 0 },
          { id: 'opt-sp-3', name: '中辣', price_adjustment: 0 },
          { id: 'opt-sp-4', name: '大辣', price_adjustment: 0 },
          { id: 'opt-sp-5', name: '地獄大辣', price_adjustment: 0 },
        ],
      },
    ],
  },
  {
    id: 'preset-steak-combo',
    name: '排餐/牛排熟度與醬料',
    description: '排餐熟度（3分/5分/7分/全熟）與黑胡椒/蘑菇醬料組合',
    isBuiltIn: true,
    category: 'food',
    groups: [
      {
        id: 'builtin-grp-doneness',
        title: '肉品熟度',
        type: 'single',
        options: [
          { id: 'opt-done-3', name: '3分熟 (Rare)', price_adjustment: 0 },
          { id: 'opt-done-5', name: '5分熟 (Medium)', price_adjustment: 0 },
          { id: 'opt-done-7', name: '7分熟 (Medium Well)', price_adjustment: 0 },
          { id: 'opt-done-full', name: '全熟 (Well Done)', price_adjustment: 0 },
        ],
      },
      {
        id: 'builtin-grp-sauce',
        title: '醬料選擇',
        type: 'single',
        options: [
          { id: 'opt-sauce-black', name: '黑胡椒醬', price_adjustment: 0 },
          { id: 'opt-sauce-mushroom', name: '蘑菇醬', price_adjustment: 0 },
          { id: 'opt-sauce-both', name: '雙醬 (黑胡椒+蘑菇)', price_adjustment: 0 },
          { id: 'opt-sauce-none', name: '不加醬 / 玫瑰鹽', price_adjustment: 0 },
        ],
      },
    ],
  },
  {
    id: 'preset-bento-custom',
    name: '便當主食與客製備註',
    description: '飯量/更換主食與不加蔥/蒜/香菜等貼心備註',
    isBuiltIn: true,
    category: 'food',
    groups: [
      {
        id: 'builtin-grp-bento-staple',
        title: '主食調整',
        type: 'single',
        options: [
          { id: 'opt-staple-rice', name: '正常白飯', price_adjustment: 0 },
          { id: 'opt-staple-porkrice', name: '升級滷肉飯', price_adjustment: 15 },
          { id: 'opt-staple-half-rice', name: '飯少', price_adjustment: 0 },
          { id: 'opt-staple-no-rice', name: '不吃飯 (換青菜)', price_adjustment: 10 },
        ],
      },
      {
        id: 'builtin-grp-bento-notes',
        title: '配菜客製備註 (可複選)',
        type: 'any',
        options: [
          { id: 'opt-note-no-onion', name: '不要蔥', price_adjustment: 0 },
          { id: 'opt-note-no-coriander', name: '不要香菜', price_adjustment: 0 },
          { id: 'opt-note-no-garlic', name: '不要蒜頭', price_adjustment: 0 },
          { id: 'opt-note-more-sauce', name: '多淋滷汁', price_adjustment: 0 },
          { id: 'opt-note-more-veg', name: '加購青菜一份', price_adjustment: 20 },
        ],
      },
    ],
  },
  {
    id: 'preset-noodles-soup',
    name: '麵食/鍋物麵條與份量',
    description: '麵條種類單選與加麵/肉量增倍客製',
    isBuiltIn: true,
    category: 'food',
    groups: [
      {
        id: 'builtin-grp-noodle-type',
        title: '麵條選擇',
        type: 'single',
        options: [
          { id: 'opt-ndl-oil', name: '黃油麵', price_adjustment: 0 },
          { id: 'opt-ndl-white', name: '陽春白麵', price_adjustment: 0 },
          { id: 'opt-ndl-udon', name: '讚岐烏龍麵', price_adjustment: 15 },
          { id: 'opt-ndl-dongfen', name: '冬粉', price_adjustment: 10 },
          { id: 'opt-ndl-yimin', name: '鍋燒意麵', price_adjustment: 15 },
        ],
      },
      {
        id: 'builtin-grp-noodle-portion',
        title: '份量客製',
        type: 'single',
        options: [
          { id: 'opt-port-normal', name: '正常份量', price_adjustment: 0 },
          { id: 'opt-port-large', name: '加大份量 (加麵)', price_adjustment: 20 },
          { id: 'opt-port-meat-plus', name: '肉量加倍', price_adjustment: 35 },
        ],
      },
    ],
  },
];

const PRESET_STORAGE_KEY = 'menu_app_custom_option_presets_v1';

/**
 * 自動生成友善的預設範本名稱（當使用者未輸入自訂名稱時自動採用）
 */
export function generateAutoPresetName(groups: CustomGroup[]): string {
  if (!groups || groups.length === 0) return '自訂規格範本';
  const titles = groups.map((g) => (g.title || '').trim()).filter(Boolean);
  const totalOptions = groups.reduce((acc, g) => acc + (g.options?.length || 0), 0);

  if (titles.length === 1) {
    return `${titles[0]} (${totalOptions}項)`;
  }
  if (titles.length > 1) {
    const summary = titles.slice(0, 3).join(' + ');
    return `${summary}${titles.length > 3 ? '等' : ''} (${groups.length}組規格 / ${totalOptions}項)`;
  }
  return `客製規格範本 (${totalOptions}項)`;
}

/**
 * 複製規格群組並賦予全新唯一 ID，避免多處引用同一 ID 產生 key 衝突
 */
export function cloneGroupsWithFreshIds(groups: CustomGroup[]): CustomGroup[] {
  const timestamp = Date.now();
  return groups.map((group, gIdx) => ({
    ...group,
    id: `grp-${timestamp}-${gIdx}-${Math.random().toString(36).substring(2, 7)}`,
    options: (group.options || []).map((opt, oIdx) => ({
      ...opt,
      id: `opt-${timestamp}-${gIdx}-${oIdx}-${Math.random().toString(36).substring(2, 7)}`,
    })),
  }));
}

/**
 * 讀取使用者自訂範本清單
 */
export function getUserCustomPresets(): CustomOptionPreset[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(PRESET_STORAGE_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (err) {
    console.error('讀取自訂客製範本庫失敗:', err);
  }
  return [];
}

/**
 * 取得全部範本（包含系統內建範本 + 使用者自訂範本）
 */
export function getAllCustomOptionPresets(): CustomOptionPreset[] {
  const userPresets = getUserCustomPresets();
  return [...userPresets, ...BUILT_IN_CUSTOM_PRESETS];
}

/**
 * 儲存一組客製化規格為常用範本
 * @param groups 規格群組清單
 * @param customName 使用者自訂名稱（選填，若留空則智慧自動命名）
 * @param description 描述備註（選填）
 */
export function saveCustomOptionPreset(
  groups: CustomGroup[],
  customName?: string,
  description?: string
): CustomOptionPreset {
  const trimmedName = (customName || '').trim();
  const finalName = trimmedName || generateAutoPresetName(groups);

  const newPreset: CustomOptionPreset = {
    id: `custom-preset-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: finalName,
    description: (description || '').trim() || undefined,
    isBuiltIn: false,
    category: 'general',
    groups: cloneGroupsWithFreshIds(groups),
    createdAt: Date.now(),
  };

  if (typeof window !== 'undefined') {
    try {
      const existing = getUserCustomPresets();
      const updated = [newPreset, ...existing];
      localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('儲存常用客製範本失敗:', err);
    }
  }

  return newPreset;
}

/**
 * 刪除自訂範本（內建範本不可刪除）
 */
export function deleteCustomOptionPreset(presetId: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const existing = getUserCustomPresets();
    const updated = existing.filter((p) => p.id !== presetId);
    localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(updated));
    return true;
  } catch (err) {
    console.error('刪除常用客製範本失敗:', err);
    return false;
  }
}

/**
 * 重新命名自訂範本
 */
export function renameCustomOptionPreset(presetId: string, newName: string): boolean {
  if (typeof window === 'undefined') return false;
  const trimmed = newName.trim();
  if (!trimmed) return false;

  try {
    const existing = getUserCustomPresets();
    const updated = existing.map((p) => (p.id === presetId ? { ...p, name: trimmed } : p));
    localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(updated));
    return true;
  } catch (err) {
    console.error('重新命名客製範本失敗:', err);
    return false;
  }
}
