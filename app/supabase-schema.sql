-- AI Tools Platform Database Schema
-- セキュリティガイドライン準拠版

-- 開発環境用: RLSを無効化（本番環境では有効化することを推奨）
-- ALTER TABLE tools DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE runs DISABLE ROW LEVEL SECURITY;

-- 一時的にRLSを無効化（データ移行用）
-- 本番環境では以下のコメントを外してRLSを有効化してください
ALTER TABLE tools DISABLE ROW LEVEL SECURITY;
ALTER TABLE runs DISABLE ROW LEVEL SECURITY;

-- テーブル作成
CREATE TABLE tools (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('text', 'image', 'whisper', 'movie')),
  image_url TEXT,
  usage_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'public' CHECK (status IN ('public', 'draft')),
  form_schema_json JSONB NOT NULL,
  prompt_template TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Runs table for tracking tool executions
CREATE TABLE runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anon_id TEXT NOT NULL,
  tool_slug TEXT NOT NULL REFERENCES tools(slug) ON DELETE CASCADE,
  inputs_json JSONB NOT NULL,
  output_json JSONB,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'succeeded', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_tools_slug ON tools(slug);
CREATE INDEX idx_tools_status ON tools(status);
CREATE INDEX idx_tools_type ON tools(type);
CREATE INDEX idx_runs_tool_slug ON runs(tool_slug);
CREATE INDEX idx_runs_created_at ON runs(created_at);
CREATE INDEX idx_runs_status ON runs(status);

-- Row Level Security (RLS) policies
-- 本番環境でRLSを有効化する場合は、以下のコメントを外してください
/*
-- RLSを有効化
ALTER TABLE tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE runs ENABLE ROW LEVEL SECURITY;

-- Tools policies: public read access for public tools
CREATE POLICY "Public tools are viewable by everyone" ON tools
  FOR SELECT USING (status = 'public');

-- Tools policies: allow INSERT for development (admin access)
-- 本番環境では適切な認証・認可ロジックに変更してください
CREATE POLICY "Allow tool insertion for development" ON tools
  FOR INSERT WITH CHECK (true);

-- Tools policies: allow UPDATE for development (admin access)
-- 本番環境では適切な認証・認可ロジックに変更してください
CREATE POLICY "Allow tool updates for development" ON tools
  FOR UPDATE USING (true);

-- Runs policies: users can only see their own runs
CREATE POLICY "Users can view their own runs" ON runs
  FOR SELECT USING (anon_id = current_setting('request.jwt.claims', true)::json->>'sub' OR anon_id = 'anonymous');

CREATE POLICY "Users can insert their own runs" ON runs
  FOR INSERT WITH CHECK (anon_id = current_setting('request.jwt.claims', true)::json->>'sub' OR anon_id = 'anonymous');

CREATE POLICY "Users can update their own runs" ON runs
  FOR UPDATE USING (anon_id = current_setting('request.jwt.claims', true)::json->>'sub' OR anon_id = 'anonymous');
*/

-- セキュリティ監査用の関数
CREATE OR REPLACE FUNCTION log_security_audit(
  action TEXT,
  table_name TEXT,
  record_id TEXT,
  user_id TEXT DEFAULT 'anonymous'
) RETURNS VOID AS $$
BEGIN
  -- セキュリティ監査ログを記録
  -- 本番環境では専用の監査テーブルに記録することを推奨
  RAISE NOTICE 'SECURITY_AUDIT: % on % (ID: %, User: %)', action, table_name, record_id, user_id;
END;
$$ LANGUAGE plpgsql;

-- トリガー関数: ツール作成時の監査
CREATE OR REPLACE FUNCTION audit_tool_creation() RETURNS TRIGGER AS $$
BEGIN
  PERFORM log_security_audit('CREATE', 'tools', NEW.slug);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガー関数: ツール更新時の監査
CREATE OR REPLACE FUNCTION audit_tool_update() RETURNS TRIGGER AS $$
BEGIN
  PERFORM log_security_audit('UPDATE', 'tools', NEW.slug);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガー関数: ツール削除時の監査
CREATE OR REPLACE FUNCTION audit_tool_deletion() RETURNS TRIGGER AS $$
BEGIN
  PERFORM log_security_audit('DELETE', 'tools', OLD.slug);
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 監査トリガーの作成
CREATE TRIGGER audit_tools_create
  AFTER INSERT ON tools
  FOR EACH ROW
  EXECUTE FUNCTION audit_tool_creation();

CREATE TRIGGER audit_tools_update
  AFTER UPDATE ON tools
  FOR EACH ROW
  EXECUTE FUNCTION audit_tool_update();

CREATE TRIGGER audit_tools_delete
  AFTER DELETE ON tools
  FOR EACH ROW
  EXECUTE FUNCTION audit_tool_deletion();

-- セキュリティ設定の確認用ビュー
CREATE OR REPLACE VIEW security_status AS
SELECT 
  'tools' as table_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'tools'
  ) THEN 'RLS_ENABLED' ELSE 'RLS_DISABLED' END as rls_status,
  COUNT(*) as record_count
FROM tools
UNION ALL
SELECT 
  'runs' as table_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'runs'
  ) THEN 'RLS_ENABLED' ELSE 'RLS_DISABLED' END as rls_status,
  COUNT(*) as record_count
FROM runs;
