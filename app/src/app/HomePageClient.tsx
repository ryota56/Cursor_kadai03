'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ToolCard } from '@/components/cards/ToolCard';
import { getFavorites } from '@/lib/store';
import { useClientMount } from '@/components/providers/ClientMountProvider';
import { Heart } from 'lucide-react';
import type { Tool } from '@/types/tool';
import type { GetToolsResponse } from '@/types/api';
import { Button } from '@/components/ui/button';

export function HomePageClient() {
  const { mounted } = useClientMount();
  const [allTools, setAllTools] = useState<Tool[]>([]);
  const [favoriteTools, setFavoriteTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'favorites'>('all');
  const [favoritesLoaded, setFavoritesLoaded] = useState(false);

  // 全ツールの取得
  const fetchAllTools = useCallback(async (query?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      params.append('order', 'popular');
      if (query) params.append('q', query);
      
      const response = await fetch(`/api/tools?${params}`);
      
      if (!response.ok) {
        throw new Error('ツールの取得に失敗しました');
      }
      
      const data: GetToolsResponse = await response.json();
      setAllTools(data.tools);
      
      // 全ツール取得後、お気に入りツールも事前に準備
      if (!favoritesLoaded && mounted) {
        prepareFavoriteTools(data.tools);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    } finally {
      setLoading(false);
    }
  }, [favoritesLoaded, mounted]);

  // お気に入りツールの事前準備（全ツールから抽出）
  const prepareFavoriteTools = useCallback((tools: Tool[]) => {
    if (!mounted) return;
    
    const favorites = getFavorites();
    if (favorites.length === 0) {
      setFavoriteTools([]);
      setFavoritesLoaded(true);
      return;
    }
    
    const favoriteSlugs = favorites.map(fav => fav.toolSlug);
    const filteredTools = tools.filter(tool => favoriteSlugs.includes(tool.slug));
    setFavoriteTools(filteredTools);
    setFavoritesLoaded(true);
  }, [mounted]);

  // お気に入りツールの取得（検索時のみ使用）
  const fetchFavoriteTools = useCallback(async (query?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!mounted) return;
      
      const favorites = getFavorites();
      if (favorites.length === 0) {
        setFavoriteTools([]);
        setLoading(false);
        return;
      }
      
      // お気に入りのツールをAPIから取得
      const favoriteSlugs = favorites.map(fav => fav.toolSlug);
      const params = new URLSearchParams();
      params.append('favorites', favoriteSlugs.join(','));
      if (query) params.append('q', query);
      
      const response = await fetch(`/api/tools?${params}`);
      if (!response.ok) {
        throw new Error('ツールの取得に失敗しました');
      }
      
      const data: GetToolsResponse = await response.json();
      setFavoriteTools(data.tools);
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    } finally {
      setLoading(false);
    }
  }, [mounted]);

  // 現在のタブに応じたツールを取得
  const currentTools = activeTab === 'all' ? allTools : favoriteTools;

  // 初期データ取得
  useEffect(() => {
    fetchAllTools();
  }, [fetchAllTools]);

  // タブ変更時の処理（検索時のみAPIリクエスト）
  useEffect(() => {
    if (activeTab === 'all') {
      fetchAllTools(searchQuery);
    } else if (searchQuery) {
      // お気に入りタブで検索時のみAPIリクエスト
      fetchFavoriteTools(searchQuery);
    } else if (favoritesLoaded) {
      // 検索なしの場合は事前準備したデータを使用
      prepareFavoriteTools(allTools);
    }
  }, [activeTab, searchQuery, fetchAllTools, fetchFavoriteTools, favoritesLoaded]);

  // お気に入り変更の監視
  useEffect(() => {
    if (!mounted) return;

    const handleStorageChange = () => {
      if (activeTab === 'favorites') {
        // お気に入り変更時は事前準備したデータを更新
        prepareFavoriteTools(allTools);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('favoritesChanged', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('favoritesChanged', handleStorageChange);
    };
  }, [activeTab, mounted]);

  // 削除処理
  const handleDeleteTool = (deletedTool: Tool) => {
    setAllTools(prevTools => prevTools.filter(tool => tool.slug !== deletedTool.slug));
    setFavoriteTools(prevTools => prevTools.filter(tool => tool.slug !== deletedTool.slug));
  };

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
      {/* ヒーローセクション */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            AIツールハブ
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-6 max-w-3xl mx-auto">
            最新のAI技術を活用したツールを、簡単に試せるプラットフォーム
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-2 text-base shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5">
              ツールを探す
            </Button>
          </div>
        </div>
      </div>

      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-indigo-600">
                AIツールハブ
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

              <Link 
                href="/admin/add-tool"
                className="text-gray-600 hover:text-gray-900 font-medium px-3 py-2 rounded-md hover:bg-gray-100 transition-colors flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                ツール追加
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* タブ */}
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'all' | 'favorites')}
          className="mb-8"
        >
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="all">ツール一覧</TabsTrigger>
            <TabsTrigger value="favorites">お気に入り</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            {error ? (
              <Alert>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : loading ? (
              <SkeletonCards />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentTools.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} onDelete={handleDeleteTool} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="favorites" className="mt-6">
            {error ? (
              <Alert>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : loading ? (
              <SkeletonCards />
            ) : currentTools.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">お気に入りがありません</h3>
                <p className="text-gray-500 mb-4">
                  ツールカードのハートボタンを押してお気に入りに追加できます
                </p>
                <button
                  onClick={() => setActiveTab('all')}
                  className="text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  ツール一覧を見る →
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentTools.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} onDelete={handleDeleteTool} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* 結果なしの場合 (allタブのみ) */}
        {!loading && !error && currentTools.length === 0 && activeTab === 'all' && (
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
