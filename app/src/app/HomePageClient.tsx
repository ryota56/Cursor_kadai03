'use client';

import { useState, useEffect } from 'react';
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

interface HomePageClientProps {
  initialTools: Tool[];
}

export function HomePageClient({ initialTools }: HomePageClientProps) {
  const { mounted } = useClientMount();
  const [tools, setTools] = useState<Tool[]>(initialTools);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'favorites'>('all');

  // ツール一覧の取得
  const fetchTools = async (tab: 'all' | 'favorites', query?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      
      if (tab === 'favorites') {
        // お気に入りタブの場合、localStorageから高速でフィルタリング
        if (!mounted) return; // マウント前は実行しない
        
        const favorites = getFavorites();
        if (favorites.length === 0) {
          setTools([]);
          return;
        }
        
        // initialToolsから直接フィルタリング（API呼び出し不要）
        const favoriteSlugs = favorites.map(fav => fav.toolSlug);
        let filteredTools = initialTools.filter(tool => favoriteSlugs.includes(tool.slug));
        
        // 検索クエリがある場合はさらにフィルタリング
        if (query && query.trim()) {
          const searchTerm = query.toLowerCase();
          filteredTools = filteredTools.filter(tool => 
            tool.name.toLowerCase().includes(searchTerm) ||
            tool.description?.toLowerCase().includes(searchTerm)
          );
        }
        
        setTools(filteredTools);
        return;
      }
      
      // allタブの場合は従来通りAPI呼び出し
      params.append('order', 'popular'); // デフォルト順序
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

  // タブ変更時の処理（高速化）
  useEffect(() => {
    if (activeTab === 'all') {
      if (!searchQuery) {
        // 検索なし: 初期データを表示
        setTools(initialTools);
      } else {
        // 検索あり: クライアント側で即座検索
        const searchTerm = searchQuery.toLowerCase();
        const filteredTools = initialTools.filter(tool => 
          tool.name.toLowerCase().includes(searchTerm) ||
          tool.description?.toLowerCase().includes(searchTerm)
        );
        setTools(filteredTools);
      }
    } else if (activeTab === 'favorites' && mounted) {
      const favorites = getFavorites();
      const favoriteSlugs = favorites.map(fav => fav.toolSlug);
      let filteredTools = initialTools.filter(tool => favoriteSlugs.includes(tool.slug));
      
      // 検索クエリがある場合はさらにフィルタリング
      if (searchQuery) {
        const searchTerm = searchQuery.toLowerCase();
        filteredTools = filteredTools.filter(tool => 
          tool.name.toLowerCase().includes(searchTerm) ||
          tool.description?.toLowerCase().includes(searchTerm)
        );
      }
      
      setTools(filteredTools);
    }
  }, [activeTab, initialTools, searchQuery, mounted]);

  // 検索処理（リアルタイム）
  useEffect(() => {
    if (!searchQuery) {
      // 検索クエリがクリアされた場合、初期データに戻す
      if (activeTab === 'all') {
        setTools(initialTools);
      } else if (activeTab === 'favorites' && mounted) {
        // お気に入りタブの場合、お気に入りツールを再表示
        const favorites = getFavorites();
        const favoriteSlugs = favorites.map(fav => fav.toolSlug);
        const filteredTools = initialTools.filter(tool => favoriteSlugs.includes(tool.slug));
        setTools(filteredTools);
      }
      setLoading(false);
      setError(null);
      return;
    }

    // 即座にクライアント側で検索実行（デバウンスなし）
    const searchTerm = searchQuery.toLowerCase();
    
    if (activeTab === 'all') {
      // ツール一覧タブ: initialToolsから検索
      const filteredTools = initialTools.filter(tool => 
        tool.name.toLowerCase().includes(searchTerm) ||
        tool.description?.toLowerCase().includes(searchTerm)
      );
      setTools(filteredTools);
    } else if (activeTab === 'favorites' && mounted) {
      // お気に入りタブ: お気に入りツールから検索
      const favorites = getFavorites();
      const favoriteSlugs = favorites.map(fav => fav.toolSlug);
      const favoriteTools = initialTools.filter(tool => favoriteSlugs.includes(tool.slug));
      const filteredTools = favoriteTools.filter(tool => 
        tool.name.toLowerCase().includes(searchTerm) ||
        tool.description?.toLowerCase().includes(searchTerm)
      );
      setTools(filteredTools);
    }
    
    setLoading(false);
    setError(null);
  }, [searchQuery, activeTab, initialTools, mounted]);

  // お気に入り変更の監視（localStorageイベント）
  useEffect(() => {
    if (!mounted) return;

    const handleStorageChange = () => {
      if (activeTab === 'favorites') {
        fetchTools('favorites', searchQuery);
      }
    };

    // localStorageの変更を監視
    window.addEventListener('storage', handleStorageChange);
    
    // カスタムイベントも監視（同じタブ内での変更）
    window.addEventListener('favoritesChanged', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('favoritesChanged', handleStorageChange);
    };
  }, [activeTab, searchQuery, mounted]);

  // 削除処理
  const handleDeleteTool = (deletedTool: Tool) => {
    setTools(prevTools => prevTools.filter(tool => tool.slug !== deletedTool.slug));
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
                {tools.map((tool) => (
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
            ) : tools.length === 0 ? (
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
                {tools.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} onDelete={handleDeleteTool} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* 結果なしの場合 (allタブのみ) */}
        {!loading && !error && tools.length === 0 && activeTab === 'all' && (
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
