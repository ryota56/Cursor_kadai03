import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getToolsFromFile } from '@/lib/supabase-fallback';
import type { Tool } from '@/types/tool';
import type { GetToolsResponse, ApiError } from '@/types/api';

// ツール一覧取得API
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const order = searchParams.get('order') || 'popular';
    const query = searchParams.get('q');
    const favorites = searchParams.get('favorites'); // 新規: お気に入りフィルタ

    let tools: Tool[] = [];
    let useFallback = false;

    try {
      // Supabaseからツールデータを取得
      let supabaseQuery = supabase
        .from('tools')
        .select('*')
        .eq('status', 'public');

      // お気に入りフィルタ
      if (favorites && favorites.trim()) {
        const favoriteSlugs = favorites.split(',').map(slug => slug.trim()).filter(Boolean);
        if (favoriteSlugs.length > 0) {
          supabaseQuery = supabaseQuery.in('slug', favoriteSlugs);
        }
      }

      // 検索フィルタ
      if (query && query.trim()) {
        const searchTerm = query.toLowerCase();
        supabaseQuery = supabaseQuery.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      const { data, error } = await supabaseQuery;

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      tools = data || [];
    } catch (error) {
      console.error('Supabase failed, using fallback:', error);
      useFallback = true;
      
      // フォールバック: JSONファイルから読み込み
      tools = await getToolsFromFile();
      
      // フィルタリング（クライアント側で実行）
      if (favorites && favorites.trim()) {
        const favoriteSlugs = favorites.split(',').map(slug => slug.trim()).filter(Boolean);
        if (favoriteSlugs.length > 0) {
          tools = tools.filter(tool => favoriteSlugs.includes(tool.slug));
        }
      }

      if (query && query.trim()) {
        const searchTerm = query.toLowerCase();
        tools = tools.filter(tool => 
          tool.name.toLowerCase().includes(searchTerm) ||
          tool.description?.toLowerCase().includes(searchTerm)
        );
      }
    }

    // ソート（Supabaseでソートできない場合はクライアント側で実行）
    const sortedTools = [...tools];
    if (order === 'popular') {
      sortedTools.sort((a: Tool, b: Tool) => b.usage_count - a.usage_count);
    } else if (order === 'latest') {
      sortedTools.sort((a: Tool, b: Tool) => {
        const aTime = new Date(a.created_at || '').getTime();
        const bTime = new Date(b.created_at || '').getTime();
        return bTime - aTime;
      });
    }

    const response: GetToolsResponse = { tools: sortedTools };
    
    // フォールバック使用をヘッダーで通知
    if (useFallback) {
      return NextResponse.json(response, {
        headers: { 'X-Fallback-Used': 'true' }
      });
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Tools API error:', error);
    const errorResponse: { error: ApiError } = {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'ツールの取得に失敗しました'
      }
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}