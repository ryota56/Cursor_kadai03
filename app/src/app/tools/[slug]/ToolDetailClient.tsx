'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Heart } from 'lucide-react';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { FormRenderer } from '@/components/form/FormRenderer';
import { ResultView } from '@/components/result/ResultView';
import { useClientMount } from '@/components/providers/ClientMountProvider';
import { isFavorite, addFavorite, removeFavorite, addHistory } from '@/lib/store';
import { toast } from 'sonner';
import type { Tool } from '@/types/tool';
import type { PostRunResponse } from '@/types/api';

interface ToolDetailClientProps {
  tool: Tool;
}

export function ToolDetailClient({ tool }: ToolDetailClientProps) {
  const router = useRouter();
  const { mounted } = useClientMount();
  
  const [favorited, setFavorited] = useState(false);
  const [result, setResult] = useState<PostRunResponse | null>(null);
  const [fallbackUsed, setFallbackUsed] = useState(false);

  // クライアントマウント後にお気に入り状態を読み込み
  useEffect(() => {
    if (mounted) {
      setFavorited(isFavorite(tool.slug));
    }
  }, [mounted, tool.slug]);

  // お気に入り切替
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

  // 生成成功時の処理
  const handleSuccess = (result: PostRunResponse) => {
    setResult(result);
    setFallbackUsed(false);
    
    // 履歴に自動保存
    // addHistory の第一引数は必要な形に変換
    const historyItem = {
      toolSlug: tool.slug,
      inputs: {}, // FormRenderer から直接取得できないため簡略化
      output: result.output,
    };
    addHistory(historyItem);
    
    toast.success('生成が完了しました');
  };

  // エラー時の処理
  const handleError = () => {
    setResult(null);
    setFallbackUsed(false);
    // エラーはtoastで既に表示されているため、ここでは追加処理のみ
  };

  // フォールバック使用時の処理
  const handleFallbackUsed = () => {
    setFallbackUsed(true);
    toast.warning('AI生成に失敗したため、代替の生成方法を使用しました');
  };

  // 使用回数のフォーマット
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ナビゲーション */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            戻る
          </Button>
          <Breadcrumbs 
            items={[
              { label: 'ツール一覧', href: '/' },
              { label: tool.name }
            ]}
          />
        </div>

        {/* メインコンテンツ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* ツール情報 */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="relative w-full h-48 mb-4 overflow-hidden rounded-lg bg-gray-100">
                  {tool.image_url ? (
                    <Image
                      src={tool.image_url}
                      alt={`${tool.name}のサムネイル`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Image
                        src="/images/placeholder.svg"
                        alt="プレースホルダー"
                        width={64}
                        height={64}
                        className="opacity-50"
                      />
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className={getTypeColor(tool.type)}>
                        {getTypeLabel(tool.type)}
                      </Badge>
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                      {tool.name}
                    </CardTitle>
                    <CardDescription className="text-gray-600 mb-4">
                      {tool.description || 'このツールの説明はまだ追加されていません。'}
                    </CardDescription>
                    <div className="flex items-center gap-4">
                      <Badge variant="outline">
                        {formatUsageCount(tool.usage_count)}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* お気に入りボタン */}
                  {mounted && (
                    <Button
                      variant={favorited ? "default" : "outline"}
                      size="sm"
                      onClick={handleFavoriteToggle}
                      aria-label={favorited ? 'お気に入りから削除' : 'お気に入りに追加'}
                    >
                      <Heart 
                        className={`h-4 w-4 ${favorited ? 'fill-current' : ''}`} 
                      />
                    </Button>
                  )}
                </div>
              </CardHeader>
            </Card>
          </div>

          {/* フォーム */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>設定</CardTitle>
                <CardDescription>
                  必要な情報を入力して生成ボタンを押してください
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormRenderer
                  toolSlug={tool.slug}
                  fields={tool.form_schema_json}
                  onSuccess={handleSuccess}
                  onError={handleError}
                  onFallbackUsed={handleFallbackUsed}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 結果表示 */}
        {result && (
          <div className="mt-8">
            <ResultView
              result={result}
              toolName={tool.name}
              fallbackUsed={fallbackUsed}
            />
          </div>
        )}
      </div>
    </div>
  );
}
