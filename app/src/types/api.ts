export type ApiError =
  | { code: 'VALIDATION_ERROR'; message?: string; fields?: Record<string,string> }
  | { code: 'TOOL_NOT_FOUND'; message: string }
  | { code: 'LLM_UPSTREAM_ERROR'; message: string; fallback: 'used' | 'skipped' }
  | { code: 'INTERNAL_ERROR'; message: string };

export type GetToolsResponse = { tools: import('./tool').Tool[] };
export type GetToolDetailResponse = { tool: import('./tool').Tool };

// Geminiモデル選択用の型定義
export type GeminiModel =
  | 'gemini-2.5-pro'
  | 'gemini-2.5-flash'
  | 'gemini-2.5-flash-lite';

// APIキー設定状態
export type ApiKeyState = 'not_set' | 'valid' | 'invalid' | 'validating';

// 拡張されたリクエスト型（既存フィールドを保持し、新規フィールドを追加）
export type PostRunRequest = { 
  inputs: Record<string, unknown>; 
  mode?: 'mock' | 'gemini';
  // 新規フィールド（オプショナル）
  model?: GeminiModel;
  userApiKey?: string; // セキュア送信用
};

export type PostRunResponse = { runId: string; output: Record<string, unknown> };
