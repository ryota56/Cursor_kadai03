import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import type { Tool } from '@/types/tool';
import type { GetToolDetailResponse, ApiError } from '@/types/api';

interface Params {
  slug: string;
}

// ツール詳細取得API
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { slug } = await params;

    // データファイル読み込み
    const dataPath = path.join(process.cwd(), 'data', 'tools.json');
    const fileContents = await fs.readFile(dataPath, 'utf8');
    const data = JSON.parse(fileContents);
    
    const tool: Tool | undefined = data.tools.find(
      (t: Tool) => t.slug === slug && t.status === 'public'
    );

    if (!tool) {
      const errorResponse: { error: ApiError } = {
        error: {
          code: 'TOOL_NOT_FOUND',
          message: `ツール '${slug}' が見つかりません`
        }
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    const response: GetToolDetailResponse = { tool };
    return NextResponse.json(response);

  } catch (error) {
    console.error('Tool detail API error:', error);
    const errorResponse: { error: ApiError } = {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'ツール詳細の取得に失敗しました'
      }
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}