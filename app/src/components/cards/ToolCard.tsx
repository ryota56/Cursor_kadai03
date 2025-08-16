'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { isFavorite, addFavorite, removeFavorite } from '@/lib/store';
import { toast } from 'sonner';
import type { Tool } from '@/types/tool';

interface ToolCardProps {
  tool: Tool;
  onDelete?: (tool: Tool) => void;
}

export function ToolCard({ tool, onDelete }: ToolCardProps) {
  const [favorited, setFavorited] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // クライアントマウント後にお気に入り状態を読み込み
  useEffect(() => {
    setMounted(true);
    setFavorited(isFavorite(tool.slug));
  }, [tool.slug]);

  // デフォルトツールかどうかを判定
  const isDefaultTool = (toolSlug: string): boolean => {
    return toolSlug === 'rewrite';
  };

  const handleFavoriteToggle = (e: React.MouseEvent) => {
    e.preventDefault(); // Linkナビゲーションを防ぐ
    e.stopPropagation();
    
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

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!onDelete) return;
    
    // デフォルトツールの場合は削除を拒否
    if (isDefaultTool(tool.slug)) {
      toast.error('デフォルトツールは削除できません');
      return;
    }
    
    // シンプルな確認ダイアログ
    const confirmed = window.confirm(`ツール「${tool.name}」を削除しますか？\nこの操作は取り消すことができません。`);
    if (!confirmed) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/tools/${tool.slug}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'ツールの削除に失敗しました');
      }

      toast.success(`ツール「${tool.name}」を削除しました`);
      onDelete(tool);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'ツールの削除に失敗しました';
      toast.error(errorMessage);
      console.error('❌ Failed to delete tool:', error);
    } finally {
      setIsDeleting(false);
    }
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
    <Link href={`/tools/${tool.slug}`} className="block group">
      <Card className="h-full transition-all duration-200 hover:shadow-lg hover:scale-[1.02] group-hover:border-indigo-200">
                 <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className={getTypeColor(tool.type)}>
                  {getTypeLabel(tool.type)}
                </Badge>
                {/* デフォルトツールの場合は固定バッジを表示 */}
                {isDefaultTool(tool.slug) && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    固定
                  </Badge>
                )}
              </div>
              <CardTitle className="text-lg font-semibold leading-tight group-hover:text-indigo-600 transition-colors">
                {tool.name}
              </CardTitle>
            </div>
            
            {/* ボタン群 */}
            {mounted && (
              <div className="flex items-center gap-1">
                {/* お気に入りボタン */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleFavoriteToggle}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label={favorited ? 'お気に入りから削除' : 'お気に入りに追加'}
                >
                  <Heart 
                    className={`w-4 h-4 ${favorited ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} 
                  />
                </Button>
                
                {/* 削除ボタン（デフォルトツール以外のみ表示） */}
                {onDelete && !isDefaultTool(tool.slug) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    aria-label="ツールを削除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            )}
          </div>
          
                     {/* サムネイル画像 */}
           <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
             {tool.image_url ? (
               <Image
                 src={tool.image_url}
                 alt={`${tool.name}のサムネイル`}
                 fill
                 className="object-cover transition-transform duration-200 group-hover:scale-105"
                 sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                 priority={tool.slug === 'rewrite'} // LCP要素にpriorityを追加
                 onError={() => {
                   console.warn(`Failed to load image: ${tool.image_url}`);
                 }}
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
        </CardHeader>
        
                 <CardContent className="pt-0">
           <CardDescription className="text-sm text-gray-600 mb-2 line-clamp-2">
             {tool.description || 'このツールの説明はまだ追加されていません。'}
           </CardDescription>
         </CardContent>
      </Card>
    </Link>
  );
}
