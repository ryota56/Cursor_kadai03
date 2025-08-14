export type FieldKind = 'input' | 'textarea' | 'select' | 'switch';
export type FieldOption = { label: string; value: string };
export type Field = {
  name: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  help?: string;
  placeholder?: string;
  options?: FieldOption[];
  col?: number; // 1-12
  maxLength?: number;
};
export type ToolType = 'text' | 'image' | 'whisper' | 'movie';
export type Tool = {
  id: number;
  slug: string;
  name: string;
  description?: string;
  type: ToolType;
  image_url?: string;
  usage_count: number;
  status: 'public' | 'draft';
  form_schema_json: Field[];
  prompt_template: string;
  created_at?: string; // ISO8601（表示整形はクライアント側）
};
export type RunStatus = 'queued' | 'running' | 'succeeded' | 'failed';
export type Run = {
  id: string;
  anon_id: string;
  toolSlug: string;
  inputs_json: Record<string, unknown>;
  output_json?: Record<string, unknown>;
  status: RunStatus;
  created_at: string; // ISO8601（表示整形はクライアント側）
};
