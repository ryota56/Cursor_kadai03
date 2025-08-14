import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
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
async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini API error:', error);
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
    const { inputs, mode = 'mock' } = body;

    // ツール情報取得
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

    // 生成実行
    let output: Record<string, unknown>;
    let usedFallback = false;

    try {
      if (mode === 'gemini' && process.env.GEMINI_API_KEY) {
        const prompt = buildPrompt(tool.prompt_template, inputs);
        const result = await callGemini(prompt);
        output = { text: result };
      } else {
        output = generateMockResponse(tool, inputs);
      }
    } catch (error) {
      console.error('Generation error:', error);
      // フォールバック
      output = generateMockResponse(tool, inputs);
      usedFallback = true;
    }

    const runId = crypto.randomUUID();
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