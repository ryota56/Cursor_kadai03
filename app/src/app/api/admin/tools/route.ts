import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
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
    const dataPath = path.join(process.cwd(), 'data', 'tools.json');
    const fileContents = await fs.readFile(dataPath, 'utf8');
    const data = JSON.parse(fileContents);
    
    const existingTool = data.tools.find((tool: Tool) => tool.slug === newTool.slug);
    if (existingTool) {
      return NextResponse.json(
        { error: `slug '${newTool.slug}' は既に使用されています` },
        { status: 400 }
      );
    }

    // バックアップ作成（安全策）
    const backupPath = path.join(process.cwd(), 'data', `tools.backup.${Date.now()}.json`);
    await fs.writeFile(backupPath, fileContents, 'utf8');

    // 新しいツールを追加
    data.tools.push(newTool);
    
    // ファイルに保存
    await fs.writeFile(dataPath, JSON.stringify(data, null, 2), 'utf8');
    
    console.log('✅ New tool added:', newTool.name);
    
    return NextResponse.json({ 
      success: true, 
      tool: newTool,
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
