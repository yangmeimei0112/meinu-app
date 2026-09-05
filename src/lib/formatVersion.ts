import { CHANGELOG_RELEASES } from '@/app/changelog/changelogData';

export const CURRENT_APP_VERSION = CHANGELOG_RELEASES[0]?.version || 'v10.5.0';

/**
 * 智慧版本號格式化（自動同步 Changelog 權威版號與 Git Commit 雜湊）
 * 可從任意組件匯入使用
 */
export function formatVersionDisplay(msg?: string, hash?: string): string {
  // 1. 優先匹配 Commit 訊息中的英數語意化版本號（如 v10.5.0, v10.4.9）
  if (msg) {
    const vMatch = msg.match(/v\d+\.\d+(\.\d+)?/i);
    if (vMatch) {
      const ver = vMatch[0];
      const validHash =
        hash &&
        hash !== 'v1.0.0' &&
        hash !== 'dev' &&
        !hash.startsWith('v')
          ? ` (${hash.substring(0, 7)})`
          : '';
      return `${ver}${validHash}`;
    }
  }

  // 2. 匹配中文版號（例如：第十之五版 ➔ v10.5）
  const cnNums: Record<string, number> = {
    '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
    '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
    '十一': 11, '十二': 12, '十三': 13, '十四': 14, '十五': 15,
    '十六': 16, '十七': 17, '十八': 18, '十九': 19, '二十': 20,
    '二十一': 21,
  };

  if (msg) {
    const compoundMatch = msg.match(/第([一二三四五六七八九十]+)之([一二三四五六七八九十]+)版/);
    if (compoundMatch) {
      const major = cnNums[compoundMatch[1]] || compoundMatch[1];
      const minor = cnNums[compoundMatch[2]] || compoundMatch[2];
      const validHash =
        hash && hash !== 'v1.0.0' && hash !== 'dev' && !hash.startsWith('v')
          ? ` (${hash.substring(0, 7)})`
          : '';
      return `v${major}.${minor}${validHash}`;
    }
  }

  // 3. 若 hash 本身是有效版本號（且非老舊預設值 v1.0.0）
  if (hash && hash.startsWith('v') && hash !== 'v1.0.0') {
    return hash;
  }

  // 4. 若有具體的 Git Short SHA（例如 2ee2ad2）
  if (hash && hash !== 'v1.0.0' && hash !== 'dev' && !hash.startsWith('v')) {
    return `${CURRENT_APP_VERSION} (${hash.substring(0, 7)})`;
  }

  // 5. 預設返回官方最新版本號
  return CURRENT_APP_VERSION;
}
