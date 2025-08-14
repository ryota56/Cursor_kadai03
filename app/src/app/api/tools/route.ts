import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import type { Tool } from '@/types/tool';
import type { GetToolsResponse, ApiError } from '@/types/api';

// ツール一覧取得API
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const order = searchParams.get('order') || 'popular';
    const query = searchParams.get('q');

    // データファイル読み込み
    const dataPath = path.join(process.cwd(), 'data', 'tools.json');
    const fileContents = await fs.readFile(dataPath, 'utf8');
    const data = JSON.parse(fileContents);
    let tools: Tool[] = data.tools.filter((tool: Tool) => tool.status === 'public');

    // 検索フィルタ
    if (query && query.trim()) {
      const searchTerm = query.toLowerCase();
      tools = tools.filter(tool => 
        tool.name.toLowerCase().includes(searchTerm) ||
        tool.description?.toLowerCase().includes(searchTerm)
      );
    }

    // ソート
    if (order === 'popular') {
      tools.sort((a, b) => b.usage_count - a.usage_count);
    } else if (order === 'latest') {
      tools.sort((a, b) => {
        const aTime = new Date(a.created_at || '').getTime();
        const bTime = new Date(b.created_at || '').getTime();
        return bTime - aTime;
      });
    }

    const response: GetToolsResponse = { tools };
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