import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import type { Tool } from '@/types/tool';
import type { ApiError } from '@/types/api';

// ツール削除API
export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    
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

    // データファイル読み込み
    const dataPath = path.join(process.cwd(), 'data', 'tools.json');
    
    let fileContents: string;
    try {
      fileContents = await fs.readFile(dataPath, 'utf8');
    } catch (error) {
      console.error('❌ Failed to read tools.json:', error);
      const errorResponse: { error: ApiError } = {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'ツールデータの読み込みに失敗しました'
        }
      };
      return NextResponse.json(errorResponse, { status: 500 });
    }

    const data = JSON.parse(fileContents);
    
    // 削除対象ツールの検索
    const toolIndex = data.tools.findIndex((tool: Tool) => tool.slug === slug);
    if (toolIndex === -1) {
      const errorResponse: { error: ApiError } = {
        error: {
          code: 'TOOL_NOT_FOUND',
          message: '指定されたツールが見つかりません'
        }
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    const deletedTool = data.tools[toolIndex];
    
    // バックアップ作成（削除前の安全策）
    const timestamp = Date.now();
    const backupPath = path.join(process.cwd(), 'data', `tools.backup.delete.${timestamp}.json`);
    
    try {
      await fs.writeFile(backupPath, fileContents, 'utf8');
      console.log('✅ Backup created:', backupPath);
    } catch (error) {
      console.error('❌ Failed to create backup:', error);
      const errorResponse: { error: ApiError } = {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'バックアップの作成に失敗しました'
        }
      };
      return NextResponse.json(errorResponse, { status: 500 });
    }

    // ツールをリストから削除
    data.tools.splice(toolIndex, 1);
    
    // ファイルに保存（atomic操作）
    try {
      await fs.writeFile(dataPath, JSON.stringify(data, null, 2), 'utf8');
      console.log('✅ Tool deleted:', deletedTool.name, 'slug:', deletedTool.slug);
    } catch (error) {
      console.error('❌ Failed to save tools.json:', error);
      const errorResponse: { error: ApiError } = {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'ツールの削除に失敗しました'
        }
      };
      return NextResponse.json(errorResponse, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'ツールが正常に削除されました',
      deletedTool,
      backupPath: path.basename(backupPath)
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
