import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { Tool, Field } from '@/types/tool';
import type { PostRunRequest, PostRunResponse, ApiError } from '@/types/api';

interface Params {
  slug: string;
}

// フィールドバリデーション
function validateField(field: Field, value: unknown): string | null {
  if (field.required && (!value || String(value).trim() === '')) {
    return '必須項目です';
  }
  
  if (field.maxLength && String(value).length > field.maxLength) {
    return `長すぎます（自動要約されます）`;
  }
  
  return null;
}

// プロンプトテンプレート処理
function buildPrompt(template: string, inputs: Record<string, unknown>): string {
  let prompt = template;
  
  // %s_fieldname% パターンを inputs[fieldname] で置換
  for (const [key, value] of Object.entries(inputs)) {
    const pattern = new RegExp(`%s_${key}%`, 'g');
    prompt = prompt.replace(pattern, String(value || ''));
  }
  
  return prompt;
}

// Mock生成
function generateMockResponse(tool: Tool, inputs: Record<string, unknown>): Record<string, unknown> {
  const body = String(inputs.body || inputs.source || '');
  
  if (tool.slug === 'rewrite') {
    const tone = String(inputs.tone || '丁寧');
    // 簡易リライト（単語レベルでの置換例）
    const rewritten = body
      .replace(/です/g, tone.includes('カジュアル') ? 'だよ' : 'でございます')
      .replace(/ます/g, tone.includes('カジュアル') ? 'るよ' : 'ございます')
      .replace(/である/g, tone.includes('丁寧') ? 'でございます' : 'だ');
    
    return { text: rewritten || `【${tone}なトーンで】リライトされた文章です。` };
  }
  
  if (tool.slug === 'tiktok-5picks') {
    // 5つの要点に分割する簡易ロジック
    const sentences = body.split(/[。．！？\n]/).filter(s => s.trim());
    const items = [];
    
    for (let i = 0; i < Math.min(5, sentences.length || 5); i++) {
      items.push({
        title: `ポイント${i + 1}`,
        body: sentences[i] || `要点${i + 1}の内容です。`
      });
    }
    
    return { items };
  }
  
  // デフォルト
  return { text: `${tool.name}の結果: ${body.substring(0, 100)}...` };
}

// Gemini API呼び出し（実装簡略化）
async function callGemini(
  prompt: string,
  model: string = 'gemini-2.5-flash',
  userApiKey?: string
): Promise<string> {
  // 優先順位: userApiKey > 環境変数（既存ロジックを保持）
  const apiKey = userApiKey || process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('APIキーが設定されていません。Google AI Studioでキーを取得してください。');
  }

  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // 動的モデル設定（既存の固定モデルを拡張）
    const geminiModel = genAI.getGenerativeModel({ model });
    
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini API error:', error);
    
    // APIキーエラーの詳細化（既存エラーハンドリングを拡張）
    if (error instanceof Error) {
      if (error.message.includes('API_KEY_INVALID')) {
        throw new Error('APIキーが無効です。正しいGemini APIキーを入力してください。');
      }
      if (error.message.includes('QUOTA_EXCEEDED')) {
        throw new Error('APIの利用制限に達しました。しばらく時間をおいてお試しください。');
      }
    }
    
    throw error;
  }
}

// ツール実行API
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { slug } = await params;
    const body: PostRunRequest = await request.json();
    const { inputs, mode = 'mock', model = 'gemini-2.5-flash', userApiKey } = body;
    
    // セキュリティ: userApiKeyの基本バリデーション（緩和版）
    if (userApiKey) {
      // 基本的な長さと文字種のチェックのみ
      if (userApiKey.length < 30 || userApiKey.length > 50 || !/^[A-Za-z0-9_-]+$/.test(userApiKey)) {
        const errorResponse: { error: ApiError } = {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'APIキーの形式が正しくありません'
          }
        };
        return NextResponse.json(errorResponse, { status: 400 });
      }
    }

    // Supabaseからツール情報取得
    const { data: tools, error: toolError } = await supabase
      .from('tools')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'public')
      .limit(1);

    if (toolError) {
      console.error('Supabase tool error:', toolError);
      throw toolError;
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

    // バリデーション
    const validationErrors: Record<string, string> = {};
    for (const field of tool.form_schema_json) {
      const error = validateField(field, inputs[field.name]);
      if (error) {
        validationErrors[field.name] = error;
      }
    }

    // 必須エラーのみで停止（maxLength超過は警告のみ）
    const requiredErrors = Object.entries(validationErrors).filter(([, error]) => 
      error === '必須項目です'
    );

    if (requiredErrors.length > 0) {
      const errorResponse: { error: ApiError } = {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'バリデーションエラー',
          fields: Object.fromEntries(requiredErrors)
        }
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // 実行履歴をSupabaseに保存（開始）
    const runId = crypto.randomUUID();
    const anonId = 'anonymous'; // 匿名ユーザー用
    
    const { error: insertError } = await supabase
      .from('runs')
      .insert({
        id: runId,
        anon_id: anonId,
        tool_slug: slug,
        inputs_json: inputs,
        status: 'running'
      });

    if (insertError) {
      console.error('Failed to insert run record:', insertError);
    }

    // AI生成実行（既存ロジックを拡張）
    let output: Record<string, unknown>;
    let usedFallback = false;
    let status: 'succeeded' | 'failed' = 'succeeded';

    try {
      if (mode === 'gemini' && (userApiKey || process.env.GEMINI_API_KEY)) {
        const prompt = buildPrompt(tool.prompt_template, inputs);
        const result = await callGemini(prompt, model, userApiKey);
        output = { text: result };
      } else {
        output = generateMockResponse(tool, inputs);
      }
    } catch (error) {
      console.error('Generation error:', error);
      // フォールバック（既存）
      output = generateMockResponse(tool, inputs);
      usedFallback = true;
      status = 'failed';
    }

    // 実行履歴を更新（完了）
    const { error: updateError } = await supabase
      .from('runs')
      .update({
        output_json: output,
        status: status
      })
      .eq('id', runId);

    if (updateError) {
      console.error('Failed to update run record:', updateError);
    }

    // 使用回数を更新
    const { error: usageError } = await supabase
      .from('tools')
      .update({ usage_count: tool.usage_count + 1 })
      .eq('slug', slug);

    if (usageError) {
      console.error('Failed to update usage count:', usageError);
    }

    const response: PostRunResponse = { runId, output };

    if (usedFallback) {
      // フォールバック使用をヘッダーで通知
      return NextResponse.json(response, {
        headers: { 'X-Fallback-Used': 'true' }
      });
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Run API error:', error);
    const errorResponse: { error: ApiError } = {
      error: {
        code: 'INTERNAL_ERROR',
        message: '生成に失敗しました'
      }
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}