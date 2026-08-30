/**
 * ⚡ 瀏覽器端原生圖片智慧壓縮器
 * 無須引入肥大套件，純 HTML5 Canvas 實現高畫質、低體積與 EXIF 旋轉適配
 */
export interface CompressedImageResult {
  base64: string;
  mimeType: string;
  originalSize: number;
  compressedSize: number;
  width: number;
  height: number;
}

export async function compressMenuImage(
  file: File | Blob,
  maxDimension = 2400,
  quality = 0.90
): Promise<CompressedImageResult> {
  return new Promise((resolve, reject) => {
    const originalSize = file.size;
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('讀取圖片檔案失敗'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('解析圖片資料失敗'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // 計算等比例縮放尺寸
        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          return reject(new Error('無法初始化 Canvas 2D 上下文'));
        }

        // 填入白色底色，避免 PNG 透明區塊變黑
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

        // 繪製縮放後的圖片
        ctx.drawImage(img, 0, 0, width, height);

        // 轉換為 JPEG Base64
        const mimeType = 'image/jpeg';
        const dataUrl = canvas.toDataURL(mimeType, quality);
        const base64Data = dataUrl.split(',')[1] || '';

        // 計算壓縮後大小 (Base64 長度 * 0.75 約等於位元組大小)
        const compressedSize = Math.round((base64Data.length * 3) / 4);

        resolve({
          base64: base64Data,
          mimeType,
          originalSize,
          compressedSize,
          width,
          height,
        });
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}
