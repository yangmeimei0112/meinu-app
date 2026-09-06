/**
 * 🏷️ 標準化商家編號為 S-001 格式
 */
export function formatStoreCode(rawInput: string | number): string {
  if (typeof rawInput === 'number') {
    if (isNaN(rawInput) || rawInput <= 0) return 'S-001';
    return `S-${String(Math.floor(rawInput)).padStart(3, '0')}`;
  }
  const str = String(rawInput || '').trim();
  const rawNum = parseInt(str, 10);
  if (!isNaN(rawNum) && rawNum <= 0) return 'S-001';

  const digitsOnly = str.replace(/\D/g, '');
  if (!digitsOnly) return 'S-001';
  const num = parseInt(digitsOnly, 10);
  if (isNaN(num) || num <= 0) return 'S-001';
  return `S-${String(num).padStart(3, '0')}`;
}
