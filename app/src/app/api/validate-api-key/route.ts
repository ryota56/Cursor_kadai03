import { NextRequest, NextResponse } from 'next/server';
import { validateApiKeyFormat, logSecureError, logSecurityAudit, maskApiKey } from '@/lib/security';

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
    logSecureError('API Key validation', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { apiKey } = await request.json();
    
    // セキュリティ監査ログ
    logSecurityAudit('API_KEY_VALIDATION_ATTEMPT', {
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey?.length || 0,
      maskedKey: apiKey ? maskApiKey(apiKey) : '[NONE]'
    });
    
    // セキュリティ強化された形式チェック
    const formatValidation = validateApiKeyFormat(apiKey);
    if (!formatValidation.isValid) {
      return NextResponse.json({ 
        isValid: false, 
        error: formatValidation.error || 'Invalid format' 
      });
    }
    
    // 実際のAPI呼び出しで有効性確認
    const isValid = await validateGeminiApiKey(apiKey);
    
    // 結果の監査ログ
    logSecurityAudit('API_KEY_VALIDATION_RESULT', {
      isValid,
      maskedKey: maskApiKey(apiKey)
    });
    
    return NextResponse.json({ isValid });
  } catch (error) {
    logSecureError('Validation API', error);
    return NextResponse.json({ 
      isValid: false, 
      error: 'Validation failed' 
    });
  }
}
