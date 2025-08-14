export type ApiError =
  | { code: 'VALIDATION_ERROR'; message?: string; fields?: Record<string,string> }
  | { code: 'TOOL_NOT_FOUND'; message: string }
  | { code: 'LLM_UPSTREAM_ERROR'; message: string; fallback: 'used' | 'skipped' }
  | { code: 'INTERNAL_ERROR'; message: string };

export type GetToolsResponse = { tools: import('./tool').Tool[] };
export type GetToolDetailResponse = { tool: import('./tool').Tool };
export type PostRunRequest = { inputs: Record<string, unknown>; mode?: 'mock' | 'gemini' };
export type PostRunResponse = { runId: string; output: Record<string, unknown> };
