'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart } from 'lucide-react';
import { ToolPageLayout } from '@/components/layout/ToolPageLayout';
import { FormRenderer } from '@/components/forms/FormRenderer';
import { ResultView } from '@/components/result/ResultView';
import { useClientMount } from '@/components/providers/ClientMountProvider';
import { isFavorite, addFavorite, removeFavorite, addHistory } from '@/lib/store';
import { toast } from 'sonner';
import type { Tool } from '@/types/tool';
import type { PostRunResponse } from '@/types/api';

interface ToolDetailProps {
  tool: Tool;
}

export function ToolDetail({ tool }: ToolDetailProps) {
  const { mounted } = useClientMount();
  
  const [favorited, setFavorited] = useState(false);
  const [result, setResult] = useState<PostRunResponse | null>(null);
  const [fallbackUsed, setFallbackUsed] = useState(false);

  // Load favorite status after client mount
  useEffect(() => {
    if (mounted) {
      setFavorited(isFavorite(tool.slug));
    }
  }, [mounted, tool.slug]);

  // Toggle favorite
  const handleFavoriteToggle = () => {
    if (favorited) {
      removeFavorite(tool.slug);
      setFavorited(false);
      toast.success('お気に入りから削除しました');
    } else {
      addFavorite(tool.slug);
      setFavorited(true);
      toast.success('お気に入りに追加しました');
    }
  };

  // Handle successful generation
  const handleSuccess = (result: PostRunResponse) => {
    setResult(result);
    setFallbackUsed(false);
    
    // Auto-save to history
    const historyItem = {
      toolSlug: tool.slug,
      inputs: {},
      output: result.output,
    };
    addHistory(historyItem);
    
    toast.success('生成が完了しました');
  };

  // Handle generation error
  const handleError = () => {
    setResult(null);
    setFallbackUsed(false);
  };

  // Handle fallback usage
  const handleFallbackUsed = () => {
    setFallbackUsed(true);
    toast.warning('AI生成に失敗したため、代替の生成方法を使用しました');
  };

  // Format usage count
  const formatUsageCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M回使用`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K回使用`;
    }
    return `${count}回使用`;
  };

  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'text': return 'bg-blue-100 text-blue-800';
      case 'image': return 'bg-green-100 text-green-800';
      case 'whisper': return 'bg-purple-100 text-purple-800';
      case 'movie': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string): string => {
    switch (type) {
      case 'text': return 'テキスト';
      case 'image': return '画像';
      case 'whisper': return '音声';
      case 'movie': return '動画';
      default: return type;
    }
  };

  return (
    <ToolPageLayout tool={tool}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Tool Information */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                {tool.image_url ? (
                  <Image
                    src={tool.image_url}
                    alt={tool.name}
                    width={48}
                    height={48}
                    className="w-12 h-12"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-300 rounded-full" />
                )}
              </div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <Badge className={getTypeColor(tool.type)}>
                  {getTypeLabel(tool.type)}
                </Badge>
              </div>
              <CardTitle className="text-xl">{tool.name}</CardTitle>
              <CardDescription className="text-base">
                {tool.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-sm text-gray-600">
                {formatUsageCount(tool.usage_count)}
              </p>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleFavoriteToggle}
                className="w-full"
              >
                <Heart 
                  className={`mr-2 h-4 w-4 ${favorited ? 'fill-red-500 text-red-500' : ''}`} 
                />
                {favorited ? 'お気に入り解除' : 'お気に入り追加'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Form */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>設定</CardTitle>
              <CardDescription>
                必要な情報を入力して生成ボタンを押してください
              </CardDescription>
            </CardHeader>
            <CardContent>
              {mounted ? (
                <FormRenderer
                  toolSlug={tool.slug}
                  fields={tool.form_schema_json}
                  onSuccess={handleSuccess}
                  onError={handleError}
                  onFallbackUsed={handleFallbackUsed}
                />
              ) : (
                <div className="space-y-4">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-24 bg-gray-200 rounded mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-10 bg-gray-200 rounded mb-4"></div>
                    <div className="h-10 bg-gray-200 rounded w-24 ml-auto"></div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="mt-8">
          <ResultView
            result={result}
            toolName={tool.name}
            fallbackUsed={fallbackUsed}
          />
        </div>
      )}
    </ToolPageLayout>
  );
}
