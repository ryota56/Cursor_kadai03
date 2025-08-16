'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImagePreviewProps {
  src: string;
  alt: string;
  onRemove?: () => void;
  aspectRatio?: string; // "16:9", "4:3", "1:1" etc.
  className?: string;
  showRemoveButton?: boolean;
}

export function ImagePreview({
  src,
  alt,
  onRemove,
  aspectRatio = "16:9",
  className,
  showRemoveButton = true
}: ImagePreviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // アスペクト比の計算
  const getAspectRatioClass = (ratio: string) => {
    switch (ratio) {
      case "16:9":
        return "aspect-video";
      case "4:3":
        return "aspect-[4/3]";
      case "1:1":
        return "aspect-square";
      case "3:2":
        return "aspect-[3/2]";
      default:
        return "aspect-video";
    }
  };

  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
    console.warn(`Failed to load image: ${src}`);
  };

  return (
    <div className={cn("relative group", className)}>
      <div className={cn(
        "relative overflow-hidden rounded-lg bg-gray-100",
        getAspectRatioClass(aspectRatio)
      )}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        )}
        
        {hasError ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-center text-gray-500">
              <div className="w-12 h-12 mx-auto mb-2 bg-gray-200 rounded-lg flex items-center justify-center">
                <X className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm">画像の読み込みに失敗しました</p>
              <p className="text-xs text-gray-400 mt-1">{src}</p>
            </div>
          </div>
        ) : (
          <Image
            src={src}
            alt={alt}
            fill
            className={cn(
              "object-cover transition-opacity duration-200",
              isLoading ? "opacity-0" : "opacity-100"
            )}
            onLoad={handleImageLoad}
            onError={handleImageError}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={src.includes('rewrite.svg')} // LCP要素にpriorityを追加
          />
        )}
      </div>

      {/* 削除ボタン */}
      {showRemoveButton && onRemove && (
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={onRemove}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg"
        >
          <X className="w-4 h-4" />
        </Button>
      )}

      {/* ファイル情報 */}
      <div className="mt-2 text-xs text-gray-500">
        <p className="truncate">{alt}</p>
      </div>
    </div>
  );
}
