import { supabase } from '@/lib/supabase';
import { compressImageToWebP } from '@/lib/imageCompressor';

export interface ImageUploadResult {
  url: string;
  isBase64: boolean;
  error?: string;
}

// 記憶體斷路器：若已知 Bucket 不存在且無法自動建立，避免重複觸發 400 網路請求
let isBucketUnavailable = false;

/**
 * 重設 Bucket 狀態（供測試或手動重試使用）
 */
export function resetStorageBucketStatus(): void {
  isBucketUnavailable = false;
}

/**
 * 檢測圖片網址是否為格式損毀或無效的 Storage 網址
 */
export function isBrokenStorageUrl(url?: string | null): boolean {
  if (!url) return true;
  if (typeof url !== 'string') return true;
  const trimmed = url.trim();
  if (!trimmed) return true;

  // 阻擋無效字串字面量
  if (
    trimmed === 'null' ||
    trimmed === 'undefined' ||
    trimmed === '[object Object]' ||
    trimmed === 'NaN'
  ) {
    return true;
  }

  // 阻擋危險偽協議
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:text/html') ||
    lower.startsWith('data:application/') ||
    lower.startsWith('vbscript:')
  ) {
    return true;
  }

  return false;
}

/**
 * 智慧過濾與規範化店家圖片網址
 * 1. 阻擋損毀、無效字串與危險協議
 * 2. 自動補全與修復 Supabase Storage 遺漏 /public/ 造成之 HTTP 400 錯誤路徑
 */
export function sanitizeStoreImageUrl(url?: string | null): string | null {
  if (!url || typeof url !== 'string') return null;
  let trimmed = url.trim();
  if (!trimmed) return null;

  if (isBrokenStorageUrl(trimmed)) {
    return null;
  }

  // 🛡️ 自動修復 Supabase Storage 遺漏 /public/ 之公開讀取路徑
  // 例如: https://xxx.supabase.co/storage/v1/object/store-images/stores/...
  // 修復為: https://xxx.supabase.co/storage/v1/object/public/store-images/stores/...
  if (trimmed.includes('/storage/v1/object/') && !trimmed.includes('/storage/v1/object/public/')) {
    trimmed = trimmed.replace(/\/storage\/v1\/object\/(?!public\/)/, '/storage/v1/object/public/');
  }

  return trimmed;
}

/**
 * 🛡️ 智慧圖片上傳與自動備援核心模組
 * 1. 優先壓縮圖片至輕量 WebP 格式 (~50KB-100KB)
 * 2. 嘗試上傳至 Supabase Storage `store-images` Bucket
 * 3. 若 Bucket 未建立，嘗試自動建立；若權限不足或異常，平滑降級為 WebP Base64 DataURL，
 *    直接持久化於 PostgreSQL stores.image_url 欄位，100% 杜絕 HTTP 400 與破圖。
 */
export async function uploadStoreImage(
  file: File,
  fallbackBase64?: string
): Promise<ImageUploadResult> {
  // 1. 先產生高壓縮比 WebP DataURL 作為穩定降級備援
  let compressedDataUrl = fallbackBase64 || '';
  try {
    if (!compressedDataUrl || !compressedDataUrl.startsWith('data:image/webp')) {
      compressedDataUrl = await compressImageToWebP(file, 1200, 0.82);
    }
  } catch (compressErr) {
    console.warn('圖片 WebP 壓縮略過，採用原始檔案:', compressErr);
  }

  // 若已知 Bucket 不可用，直接返回輕量 Base64，避免瀏覽器控制台噴 400 錯誤
  if (isBucketUnavailable) {
    if (compressedDataUrl) {
      return {
        url: compressedDataUrl,
        isBase64: true,
      };
    }
  }

  // 2. 嘗試上傳至 Supabase Storage store-images bucket
  try {
    const fileExt = file.name.split('.').pop() || 'webp';
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `stores/${fileName}`;

    let { error: uploadError } = await supabase.storage
      .from('store-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    // 若 Bucket 未建立 (400 / Bucket not found)，嘗試自動建立 Bucket 並重試
    if (uploadError) {
      const errMsg = (uploadError.message || '').toLowerCase();
      if (errMsg.includes('bucket not found') || (uploadError as any).statusCode === '400') {
        try {
          const { error: createErr } = await supabase.storage.createBucket('store-images', {
            public: true,
            fileSizeLimit: 10485760,
          });

          if (!createErr) {
            const retryRes = await supabase.storage
              .from('store-images')
              .upload(filePath, file, {
                cacheControl: '3600',
                upsert: true,
              });
            uploadError = retryRes.error;
          }
        } catch {
          // 建立失敗 (可能 anon key 權限不足)，繼續走降級邏輯
        }
      }
    }

    if (uploadError) {
      // 記錄斷路器狀態
      isBucketUnavailable = true;
      if (compressedDataUrl) {
        return {
          url: compressedDataUrl,
          isBase64: true,
        };
      }
      return {
        url: '',
        isBase64: false,
        error: uploadError.message,
      };
    }

    // 上傳成功，獲取並規範化公開 URL
    const { data } = supabase.storage.from('store-images').getPublicUrl(filePath);
    const sanitizedUrl = sanitizeStoreImageUrl(data.publicUrl) || data.publicUrl;
    return {
      url: sanitizedUrl,
      isBase64: false,
    };
  } catch (err: any) {
    isBucketUnavailable = true;
    if (compressedDataUrl) {
      return {
        url: compressedDataUrl,
        isBase64: true,
      };
    }
    return {
      url: '',
      isBase64: false,
      error: err?.message || '圖片上傳異常',
    };
  }
}
