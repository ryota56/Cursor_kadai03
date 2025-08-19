import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { Tool } from '@/types/tool';

export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json();
    
    // 自動生成フィールドを除外してツールデータを構築
    const newTool = {
      slug: requestData.slug,
      name: requestData.name,
      description: requestData.description,
      type: requestData.type,
      image_url: requestData.image_url,
      usage_count: requestData.usage_count || 0,
      status: requestData.status || 'public',
      form_schema_json: requestData.form_schema_json,
      prompt_template: requestData.prompt_template
    };
    
    console.log('📋 Received tool data:', newTool);
    
    // バリデーション
    if (!newTool.name || !newTool.description || !newTool.prompt_template) {
      console.error('❌ Validation failed: missing required fields');
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
      console.error('❌ Supabase check error:', checkError);
      return NextResponse.json(
        { error: 'データベースエラーが発生しました' },
        { status: 500 }
      );
    }

    if (existingTools && existingTools.length > 0) {
      console.error('❌ Slug already exists:', newTool.slug);
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
      console.error('❌ Supabase insert error:', insertError);
      return NextResponse.json(
        { error: `ツールの追加に失敗しました: ${insertError.message}` },
        { status: 500 }
      );
    }
    
    console.log('✅ New tool added successfully:', insertedTool);
    
    return NextResponse.json({ 
      success: true, 
      tool: insertedTool,
      message: 'ツールが正常に追加されました'
    });
    
  } catch (error) {
    console.error('❌ Tool creation error:', error);
    return NextResponse.json(
      { error: `ツールの追加に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
