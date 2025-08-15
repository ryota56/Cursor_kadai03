import { NextRequest, NextResponse } from 'next/server';

async function validateGeminiApiKey(apiKey: string): Promise<boolean> {
  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    // 軽量なテスト呼び出し
    const result = await model.generateContent('test');
    await result.response;
    return true;
  } catch (error) {
    console.error('API Key validation error:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { apiKey } = await request.json();
    
    // 基本的な形式チェック
    if (!apiKey || apiKey.length < 30 || apiKey.length > 50 || !/^[A-Za-z0-9_-]+$/.test(apiKey)) {
      return NextResponse.json({ isValid: false, error: 'Invalid format' });
    }
    
    // 実際のAPI呼び出しで有効性確認
    const isValid = await validateGeminiApiKey(apiKey);
    
    return NextResponse.json({ isValid });
  } catch (error) {
    console.error('Validation API error:', error);
    return NextResponse.json({ isValid: false, error: 'Validation failed' });
  }
}
