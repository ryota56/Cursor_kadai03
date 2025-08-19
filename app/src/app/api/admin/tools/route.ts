import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { Tool } from '@/types/tool';

export async function POST(request: NextRequest) {
  try {
    const newTool: Tool = await request.json();
    
    // バリデーション
    if (!newTool.name || !newTool.description || !newTool.prompt_template) {
      return NextResponse.json(
        { error: '必須フィールドが不足しています' },
        { status: 400 }
      );
    }

    // slug重複チェック
    const { data: existingTools, error: checkError } = await supabase
      .from('tools')
      .select('slug')
      .eq('slug', newTool.slug);

    if (checkError) {
      console.error('Supabase check error:', checkError);
      return NextResponse.json(
        { error: 'データベースエラーが発生しました' },
        { status: 500 }
      );
    }

    if (existingTools && existingTools.length > 0) {
      return NextResponse.json(
        { error: `slug '${newTool.slug}' は既に使用されています` },
        { status: 400 }
      );
    }

    // 新しいツールを追加
    const { data: insertedTool, error: insertError } = await supabase
      .from('tools')
      .insert(newTool)
      .select()
      .single();

    if (insertError) {
      console.error('Supabase insert error:', insertError);
      return NextResponse.json(
        { error: 'ツールの追加に失敗しました' },
        { status: 500 }
      );
    }
    
    console.log('✅ New tool added:', newTool.name);
    
    return NextResponse.json({ 
      success: true, 
      tool: insertedTool,
      message: 'ツールが正常に追加されました'
    });
    
  } catch (error) {
    console.error('❌ Tool creation error:', error);
    return NextResponse.json(
      { error: 'ツールの追加に失敗しました' },
      { status: 500 }
    );
  }
}
