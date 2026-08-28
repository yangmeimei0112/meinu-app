/**
 * 智慧版本號格式化（自動支援 v6.5, v6.3 等英數版號與中文版號互轉）
 * 可從任意組件匯入使用
 */
export function formatVersionDisplay(msg: string, hash: string): string {
  // 1. 優先匹配英數語意化版本號（如 v6.5, v6.3, v5.21）
  const vMatch = msg.match(/v\d+\.\d+(\.\d+)?/i);
  if (vMatch) {
    return `${vMatch[0]} (${hash})`;
  }

  // 2. 匹配中文版號（例如：第六之五版 ➔ v6.5，第五之二十一版 ➔ v5.21）
  const cnNums: Record<string, number> = {
    '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
    '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
    '十一': 11, '十二': 12, '十三': 13, '十四': 14, '十五': 15,
    '十六': 16, '十七': 17, '十八': 18, '十九': 19, '二十': 20,
    '二十一': 21,
  };

  const compoundMatch = msg.match(/第([一二三四五六七八九十]+)之([一二三四五六七八九十]+)版/);
  if (compoundMatch) {
    const major = cnNums[compoundMatch[1]] || compoundMatch[1];
    const minor = cnNums[compoundMatch[2]] || compoundMatch[2];
    return `v${major}.${minor} (${hash})`;
  }

  const singleMatch = msg.match(/第([一二三四五六七八九十]+)版/);
  if (singleMatch) {
    const major = cnNums[singleMatch[1]] || singleMatch[1];
    return `v${major}.0 (${hash})`;
  }

  return hash.startsWith('v') ? hash : `v9.1 (${hash})`;
}
