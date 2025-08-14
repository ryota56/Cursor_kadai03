'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ToolCard } from '@/components/cards/ToolCard';
import type { Tool } from '@/types/tool';
import type { GetToolsResponse } from '@/types/api';

interface HomePageClientProps {
  initialTools: Tool[];
}

export function HomePageClient({ initialTools }: HomePageClientProps) {
  const [tools, setTools] = useState<Tool[]>(initialTools);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'popular' | 'latest'>('popular');

  // ツール一覧の取得
  const fetchTools = async (order: 'popular' | 'latest', query?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({ order });
      if (query) params.append('q', query);
      
      const response = await fetch(`/api/tools?${params}`);
      
      if (!response.ok) {
        throw new Error('ツールの取得に失敗しました');
      }
      
      const data: GetToolsResponse = await response.json();
      setTools(data.tools);
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  // タブ変更時の再取得
  useEffect(() => {
    // 初期データがあり、検索クエリがない場合はスキップ
    if (initialTools.length > 0 && !searchQuery && activeTab === 'popular') {
      return;
    }
    fetchTools(activeTab, searchQuery);
  }, [activeTab, initialTools.length, searchQuery]);

  // 検索処理（デバウンス）
  useEffect(() => {
    if (!searchQuery) {
      // 検索クエリがクリアされた場合、初期データに戻すかAPI取得
      if (activeTab === 'popular' && initialTools.length > 0) {
        setTools(initialTools);
        setLoading(false);
        setError(null);
        return;
      }
    }

    const timer = setTimeout(() => {
      fetchTools(activeTab, searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, activeTab, initialTools]);

  // スケルトンUI
  const SkeletonCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-indigo-600">
                AIツールMVP
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Input
                type="search"
                placeholder="ツールを検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64"
              />
              <a
                href="https://example.com/help"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-gray-900"
              >
                ヘルプ
              </a>
              <button className="text-gray-600 hover:text-gray-900">
                設定
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* タブ */}
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'popular' | 'latest')}
          className="mb-8"
        >
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="popular">人気</TabsTrigger>
            <TabsTrigger value="latest">新着</TabsTrigger>
          </TabsList>

          <TabsContent value="popular" className="mt-6">
            {error ? (
              <Alert>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : loading ? (
              <SkeletonCards />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tools.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="latest" className="mt-6">
            {error ? (
              <Alert>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : loading ? (
              <SkeletonCards />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tools.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* 結果なしの場合 */}
        {!loading && !error && tools.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {searchQuery ? '検索結果が見つかりませんでした' : 'ツールがありません'}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
