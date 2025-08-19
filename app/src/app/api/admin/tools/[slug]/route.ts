import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { ApiError } from '@/types/api';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    // デフォルトツールの削除を拒否
    if (slug === 'rewrite') {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'デフォルトツールは削除できません' } },
        { status: 403 }
      );
    }
    
    // slugのバリデーション
    if (!slug || typeof slug !== 'string' || slug.trim() === '') {
      const errorResponse: { error: ApiError } = {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'slugが指定されていません'
        }
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Supabaseから削除対象ツールを取得
    const { data: tools, error: fetchError } = await supabase
      .from('tools')
      .select('*')
      .eq('slug', slug)
      .limit(1);

    if (fetchError) {
      console.error('❌ Supabase fetch error:', fetchError);
      const errorResponse: { error: ApiError } = {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'ツールデータの取得に失敗しました'
        }
      };
      return NextResponse.json(errorResponse, { status: 500 });
    }

    if (!tools || tools.length === 0) {
      const errorResponse: { error: ApiError } = {
        error: {
          code: 'TOOL_NOT_FOUND',
          message: '指定されたツールが見つかりません'
        }
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    const deletedTool = tools[0];
    
    // Supabaseからツールを削除
    const { error: deleteError } = await supabase
      .from('tools')
      .delete()
      .eq('slug', slug);

    if (deleteError) {
      console.error('❌ Supabase delete error:', deleteError);
      const errorResponse: { error: ApiError } = {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'ツールの削除に失敗しました'
        }
      };
      return NextResponse.json(errorResponse, { status: 500 });
    }
    
    console.log('✅ Tool deleted:', deletedTool.name, 'slug:', deletedTool.slug);
    
    return NextResponse.json({
      success: true,
      message: 'ツールが正常に削除されました',
      deletedTool
    });
    
  } catch (error) {
    console.error('❌ Tool deletion error:', error);
    const errorResponse: { error: ApiError } = {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'ツールの削除に失敗しました'
      }
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
