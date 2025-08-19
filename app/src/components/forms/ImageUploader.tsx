'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { DragDropZone } from '@/components/ui/DragDropZone';
import { ImagePreview } from '@/components/ui/ImagePreview';
import { Upload, FileImage, X } from 'lucide-react';
import { toast } from 'sonner';

interface ImageUploaderProps {
  onImageUploaded?: (imageUrl: string) => void;
  onImageRemoved?: () => void;
  aspectRatio?: string;
  className?: string;
  maxSize?: number; // in bytes
  accept?: string;
}

export function ImageUploader({
  onImageUploaded,
  onImageRemoved,
  aspectRatio = "16:9",
  className,
  maxSize = 5 * 1024 * 1024, // 5MB
  accept = "image/jpeg,image/png,image/webp,image/svg+xml,image/gif,image/avif,image/bmp,image/x-icon"
}: ImageUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    // ファイルサイズチェック
    if (file.size > maxSize) {
      return `ファイルサイズが大きすぎます。最大${Math.round(maxSize / 1024 / 1024)}MBまでです。`;
    }

    // ファイル形式チェック
    const acceptedTypes = accept.split(',').map(type => type.trim());
    const isValidType = acceptedTypes.some(type => {
      if (type.endsWith('/*')) {
        const baseType = type.replace('/*', '');
        return file.type.startsWith(baseType);
      }
      return file.type === type;
    });

    if (!isValidType) {
      return '対応していないファイル形式です。JPG, PNG, WebP, SVG, GIF, AVIF, BMP, ICO形式に対応しています。';
    }

    return null;
  }, [accept, maxSize]);

  const handleUploadWithFile = useCallback(async (file: File) => {
    const { logSecureDebug, validateFileUpload } = await import('@/lib/security');
    
    logSecureDebug('Image upload attempt', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });
    
    if (!file) {
      toast.error('アップロードするファイルが提供されていません');
      return;
    }

    // セキュリティ検証
    const validation = validateFileUpload(file);
    if (!validation.isValid) {
      toast.error(validation.error || 'ファイルの検証に失敗しました');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'アップロードに失敗しました');
      }

      const result = await response.json();
      logSecureDebug('Image upload success', {
        imageUrl: result.imageUrl ? '[SET]' : '[NOT_SET]'
      });
      
      // 画像URLの検証
      if (!result.imageUrl) {
        throw new Error('アップロードされた画像のURLが取得できませんでした');
      }
      
      toast.success('画像がアップロードされました');
      
      // コールバックで親コンポーネントに通知
      if (onImageUploaded) {
        onImageUploaded(result.imageUrl);
      }
      
    } catch (error) {
      const { logSecureError } = await import('@/lib/security');
      logSecureError('Image upload', error);
      toast.error(error instanceof Error ? error.message : 'アップロードに失敗しました');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [onImageUploaded]);

  const handleUpload = useCallback(async () => {
    console.log('🔥 handleUpload called, selectedFile:', selectedFile?.name);
    
    if (!selectedFile) {
      console.error('❌ No file selected for upload');
      toast.error('アップロードするファイルが選択されていません');
      return;
    }

    // 既存のhandleUploadWithFileを使用
    await handleUploadWithFile(selectedFile);
  }, [selectedFile, handleUploadWithFile]);

  const handleFileSelect = useCallback((file: File) => {
    console.log('📁 File selected:', file.name, file.size, file.type);
    
    const validationError = validateFile(file);
    if (validationError) {
      console.error('❌ File validation failed:', validationError);
      toast.error(validationError);
      return;
    }

    console.log('✅ File validation passed, setting selectedFile');
    
    // プレビューURLの作成
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    console.log('🖼️ Preview URL created:', url);
    
    // selectedFileを設定してから自動アップロードを実行
    setSelectedFile(file);
    
    // 状態更新を待ってから自動アップロードを実行（200ms後に実行）
    console.log('🚀 Auto-uploading selected file');
    setTimeout(() => {
      console.log('🔥 Auto-upload timeout reached, selectedFile:', file.name);
      // 直接ファイルを渡してアップロード
      handleUploadWithFile(file);
    }, 200);
  }, [validateFile, handleUpload]);

  const handleDrop = useCallback((files: FileList) => {
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleRemove = useCallback(() => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    onImageRemoved?.();
    
    // ファイル入力のリセット
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [previewUrl, onImageRemoved]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={className}>
      {!selectedFile ? (
        <DragDropZone
          onDrop={handleDrop}
          accept={accept}
          maxSize={maxSize}
          className="p-8"
        >
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Upload className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              画像をアップロード
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              ドラッグ&ドロップまたはクリックして画像を選択
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="mb-2"
            >
              <FileImage className="w-4 h-4 mr-2" />
              画像を選択
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept={accept}
              onChange={handleFileInputChange}
              className="hidden"
            />
            <p className="text-xs text-gray-400">
              対応形式: JPG, PNG, WebP, SVG (最大{Math.round(maxSize / 1024 / 1024)}MB)
            </p>
          </div>
        </DragDropZone>
      ) : (
        <div className="space-y-4">
          {/* プレビュー */}
          <ImagePreview
            src={previewUrl!}
            alt={selectedFile.name}
            aspectRatio={aspectRatio}
            onRemove={handleRemove}
          />
          
          {/* ファイル情報 */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(selectedFile.size)} • {selectedFile.type}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                className="ml-2"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* アップロード状態の表示 */}
          {selectedFile && !isUploading && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <div className="flex items-center">
                <div className="w-4 h-4 mr-2 bg-yellow-400 rounded-full animate-pulse" />
                <span className="text-sm text-yellow-800">
                  画像が選択されました。自動的にアップロードされます...
                </span>
              </div>
            </div>
          )}
          
          {/* アップロードボタン */}
          <Button
            type="button"
            onClick={() => {
              console.log('🖱️ Upload button clicked manually');
              handleUpload();
            }}
            disabled={isUploading}
            className="w-full"
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                アップロード中...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                アップロード
              </>
            )}
          </Button>
          
          {/* プログレスバー */}
          {isUploading && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
