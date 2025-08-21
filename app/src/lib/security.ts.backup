/**
 * セキュリティガイドラインに基づくセキュアなログ出力とAPIキー管理
 */

// APIキーのマスキング関数
export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 8) {
    return '[INVALID]';
  }
  
  const prefix = apiKey.substring(0, 4);
  const suffix = apiKey.substring(apiKey.length - 4);
  return `${prefix}...${suffix}`;
}

// 環境変数のセキュアなログ出力
export function logEnvironmentStatus(): void {
  const env = process.env.NODE_ENV;
  
  console.log('🔍 Environment Status:');
  console.log('NODE_ENV:', env);
  console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '[SET]' : '[NOT_SET]');
  console.log('SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '[SET]' : '[NOT_SET]');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '[SET]' : '[NOT_SET]');
  console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '[SET]' : '[NOT_SET]');
}

// セキュアなエラーログ出力
export function logSecureError(context: string, error: unknown, includeStack = false): void {
  const env = process.env.NODE_ENV;
  
  // 本番環境では詳細情報を制限
  if (env === 'production') {
    console.error(`[${context}] Error occurred`);
    return;
  }
  
  // 開発環境では詳細情報を表示（機密情報はマスク）
  console.error(`[${context}] Error:`, {
    message: error instanceof Error ? error.message : 'Unknown error',
    name: error instanceof Error ? error.name : 'Unknown',
    stack: includeStack && error instanceof Error ? error.stack : undefined
  });
}

// APIキーのバリデーション（セキュリティ強化版）
export function validateApiKeyFormat(apiKey: string): { isValid: boolean; error?: string } {
  if (!apiKey) {
    return { isValid: false, error: 'APIキーが入力されていません' };
  }
  
  // 基本的な形式チェック
  if (apiKey.length < 30 || apiKey.length > 50) {
    return { isValid: false, error: 'APIキーの長さが正しくありません' };
  }
  
  // 文字種チェック（Gemini APIキーの形式）
  if (!/^[A-Za-z0-9_-]+$/.test(apiKey)) {
    return { isValid: false, error: 'APIキーに無効な文字が含まれています' };
  }
  
  // Gemini APIキーのプレフィックスチェック
  if (!apiKey.startsWith('AIza')) {
    return { isValid: false, error: 'Gemini APIキーの形式が正しくありません' };
  }
  
  return { isValid: true };
}

// セキュアなデバッグ情報出力
export function logSecureDebug(context: string, data: Record<string, unknown>): void {
  const env = process.env.NODE_ENV;
  
  if (env !== 'development') {
    return; // 開発環境以外では出力しない
  }
  
  // 機密情報をマスク
  const sanitizedData = { ...data };
  
  if ('apiKey' in sanitizedData) {
    sanitizedData.apiKey = maskApiKey(sanitizedData.apiKey as string);
  }
  
  if ('userApiKey' in sanitizedData) {
    sanitizedData.userApiKey = maskApiKey(sanitizedData.userApiKey as string);
  }
  
  if ('password' in sanitizedData) {
    sanitizedData.password = '[MASKED]';
  }
  
  console.log(`[DEBUG:${context}]`, sanitizedData);
}

// ファイルアップロードのセキュリティ検証
export function validateFileUpload(file: File): { isValid: boolean; error?: string } {
  // ファイルサイズチェック（5MB制限）
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return { isValid: false, error: 'ファイルサイズが5MBを超えています' };
  }
  
  // ファイルタイプチェック
  const allowedTypes = [
    'image/jpeg',
    'image/png', 
    'image/webp',
    'image/svg+xml',
    'image/gif',
    'image/avif',
    'image/bmp',
    'image/x-icon'
  ];
  
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: '許可されていないファイル形式です' };
  }
  
  return { isValid: true };
}

// 入力値のサニタイゼーション
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // 基本的なXSS対策
    .substring(0, 1000); // 長さ制限
}

// セキュリティ監査ログ
export function logSecurityAudit(action: string, details: Record<string, unknown>): void {
  const timestamp = new Date().toISOString();
  const env = process.env.NODE_ENV;
  
  const auditLog = {
    timestamp,
    environment: env,
    action,
    details: env === 'production' ? { action } : details, // 本番環境では詳細を制限
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
  };
  
  console.log('[SECURITY_AUDIT]', auditLog);
}
