'use client';

import React, { useState, useEffect } from 'react';
import { Store as DefaultStoreIcon } from 'lucide-react';
import { sanitizeStoreImageUrl } from '@/lib/imageStorage';

interface StoreImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackIcon?: React.ReactNode;
  fallbackClassName?: string;
}

export function StoreImage({
  src,
  alt,
  className = 'w-full h-full object-cover',
  fallbackIcon,
  fallbackClassName = 'w-full h-full flex items-center justify-center text-sky-500',
}: StoreImageProps) {
  const sanitized = sanitizeStoreImageUrl(src);
  const [hasError, setHasError] = useState<boolean>(!sanitized);
  const [currentSrc, setCurrentSrc] = useState<string | null>(sanitized);

  useEffect(() => {
    const validUrl = sanitizeStoreImageUrl(src);
    if (validUrl) {
      setHasError(false);
      setCurrentSrc(validUrl);
    } else {
      setHasError(true);
      setCurrentSrc(null);
    }
  }, [src]);

  // 若無圖片或載入失敗 (400, 404, Network Error)
  if (!currentSrc || hasError) {
    return (
      <div className={fallbackClassName} aria-label={alt}>
        {fallbackIcon || <DefaultStoreIcon className="w-7 h-7 text-sky-500 stroke-[1.8]" />}
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={className}
      onError={() => {
        // 🛡️ 捕捉 400 / 404 等 Storage 錯誤，自動切換至優雅備援圖示，不噴破圖
        setHasError(true);
      }}
    />
  );
}

export default StoreImage;
