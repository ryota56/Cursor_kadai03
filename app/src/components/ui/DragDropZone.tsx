'use client';

import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface DragDropZoneProps {
  onDrop: (files: FileList) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  accept?: string;
  maxSize?: number; // in bytes
  children: React.ReactNode;
  className?: string;
}

export function DragDropZone({
  onDrop,
  onDragOver,
  onDragLeave,
  accept = 'image/*',
  maxSize = 5 * 1024 * 1024, // 5MB default
  children,
  className
}: DragDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = useCallback((file: File): string | null => {
    // ファイルサイズチェック
    if (file.size > maxSize) {
      return `ファイルサイズが大きすぎます。最大${Math.round(maxSize / 1024 / 1024)}MBまでです。`;
    }

    // ファイル形式チェック
    if (accept !== '*/*') {
      const acceptedTypes = accept.split(',').map(type => type.trim());
      const isValidType = acceptedTypes.some(type => {
        if (type.endsWith('/*')) {
          const baseType = type.replace('/*', '');
          return file.type.startsWith(baseType);
        }
        return file.type === type;
      });

      if (!isValidType) {
        return '対応していないファイル形式です。';
      }
    }

    return null;
  }, [accept, maxSize]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
    setError(null);
    onDragOver?.(e);
  }, [onDragOver]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    onDragLeave?.(e);
  }, [onDragLeave]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setError(null);

    const files = e.dataTransfer.files;
    if (files.length === 0) return;

    // 最初のファイルのみ処理
    const file = files[0];
    const validationError = validateFile(file);
    
    if (validationError) {
      setError(validationError);
      return;
    }

    onDrop(files);
  }, [onDrop, validateFile]);

  return (
    <div
      className={cn(
        'relative border-2 border-dashed rounded-lg transition-colors duration-200',
        isDragOver
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-300 hover:border-gray-400',
        error && 'border-red-500 bg-red-50',
        className
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {children}
      
      {/* ドラッグオーバー時のオーバーレイ */}
      {isDragOver && (
        <div className="absolute inset-0 bg-blue-500 bg-opacity-10 rounded-lg flex items-center justify-center">
          <div className="text-blue-600 font-medium">
            ファイルをドロップしてください
          </div>
        </div>
      )}
      
      {/* エラーメッセージ */}
      {error && (
        <div className="absolute inset-0 bg-red-500 bg-opacity-10 rounded-lg flex items-center justify-center">
          <div className="text-red-600 font-medium text-center px-4">
            {error}
          </div>
        </div>
      )}
    </div>
  );
}
