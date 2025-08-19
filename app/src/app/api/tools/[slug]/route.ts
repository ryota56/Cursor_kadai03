import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
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

    // Supabaseからツールデータを取得
    const { data: tools, error } = await supabase
      .from('tools')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'public')
      .limit(1);

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    const tool: Tool | undefined = tools?.[0];

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