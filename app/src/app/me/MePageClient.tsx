'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

import { Heart, Clock, Trash2, ExternalLink } from 'lucide-react';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { useClientMount } from '@/components/providers/ClientMountProvider';
import { getFavorites, getHistory, removeFavorite, clearHistory } from '@/lib/store';
import { toast } from 'sonner';
import type { FavoriteItem, HistoryItem } from '@/lib/store';

export function MePageClient() {
  const { mounted } = useClientMount();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<'history' | 'favorites'>('history');

  // クライアントマウント後にデータを読み込み
  useEffect(() => {
    if (mounted) {
      setFavorites(getFavorites());
      setHistory(getHistory());
    }
  }, [mounted]);

  // お気に入り削除
  const handleRemoveFavorite = (toolSlug: string) => {
    removeFavorite(toolSlug);
    setFavorites(getFavorites());
    toast.success('お気に入りから削除しました');
  };

  // 履歴全削除
  const handleClearHistory = () => {
    clearHistory();
    setHistory([]);
    toast.success('履歴を削除しました');
  };

  // 日時フォーマット（クライアント側でのみ実行）
  const formatDate = (isoString: string): string => {
    if (!mounted) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  // スケルトンUI
  const SkeletonList = () => (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-4 w-full" />
          </CardHeader>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ナビゲーション */}
        <div className="mb-6">
          <Breadcrumbs 
            items={[
              { label: 'ツール一覧', href: '/' },
              { label: 'マイページ' }
            ]}
          />
        </div>

        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">マイページ</h1>
          <p className="text-gray-600">お気に入りや履歴を管理できます</p>
        </div>

        {/* タブコンテンツ */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'history' | 'favorites')}>
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
            <TabsTrigger value="history">履歴</TabsTrigger>
            <TabsTrigger value="favorites">お気に入り</TabsTrigger>
          </TabsList>

          {/* 履歴タブ */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    実行履歴
                  </CardTitle>
                  {mounted && history.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClearHistory}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      全削除
                    </Button>
                  )}
                </div>
                <CardDescription>
                  {mounted ? `${history.length}件の実行履歴があります` : '履歴を読み込み中...'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!mounted ? (
                  <SkeletonList />
                ) : history.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>まだ履歴がありません</p>
                    <p className="text-sm">ツールを実行すると履歴が表示されます</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {history.map((item) => (
                      <Card key={item.id} className="border border-gray-200">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {item.toolSlug}
                              </Badge>
                              <span className="text-sm text-gray-500">
                                {formatDate(item.createdAt)}
                              </span>
                            </div>
                            <Link href={`/tools/${item.toolSlug}`}>
                              <Button variant="ghost" size="sm">
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                            </Link>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="text-sm">
                            <div className="mb-2">
                              <span className="font-medium text-gray-700">入力:</span>
                              <div className="mt-1 p-2 bg-gray-50 rounded text-xs">
                                {JSON.stringify(item.inputs, null, 2).substring(0, 100)}...
                              </div>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">結果:</span>
                              <div className="mt-1 p-2 bg-gray-50 rounded text-xs">
                                {String(item.output || JSON.stringify(item.output, null, 2) || '').substring(0, 100)}...
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* お気に入りタブ */}
          <TabsContent value="favorites">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5" />
                  お気に入り
                </CardTitle>
                <CardDescription>
                  {mounted ? `${favorites.length}件のお気に入りがあります` : 'お気に入りを読み込み中...'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!mounted ? (
                  <SkeletonList />
                ) : favorites.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Heart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>まだお気に入りがありません</p>
                    <p className="text-sm">ツール詳細画面でハートボタンを押してお気に入りに追加できます</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {favorites.map((item) => (
                      <Card key={item.toolSlug} className="border border-gray-200">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {item.toolSlug}
                              </Badge>
                              <span className="text-sm text-gray-500">
                                {formatDate(item.addedAt)}に追加
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Link href={`/tools/${item.toolSlug}`}>
                                <Button variant="ghost" size="sm">
                                  <ExternalLink className="w-4 h-4" />
                                </Button>
                              </Link>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveFavorite(item.toolSlug)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
