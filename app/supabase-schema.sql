-- AI Tools Platform Database Schema

-- 一時的にRLSを無効化（データ移行用）
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
  tool_slug TEXT NOT NULL REFERENCES tools(slug),
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
ALTER TABLE tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE runs ENABLE ROW LEVEL SECURITY;

-- Tools policies: public read access for public tools
CREATE POLICY "Public tools are viewable by everyone" ON tools
  FOR SELECT USING (status = 'public');

-- Runs policies: users can only see their own runs
CREATE POLICY "Users can view their own runs" ON runs
  FOR SELECT USING (anon_id = current_setting('request.jwt.claims', true)::json->>'sub' OR anon_id = 'anonymous');

CREATE POLICY "Users can insert their own runs" ON runs
  FOR INSERT WITH CHECK (anon_id = current_setting('request.jwt.claims', true)::json->>'sub' OR anon_id = 'anonymous');

CREATE POLICY "Users can update their own runs" ON runs
  FOR UPDATE USING (anon_id = current_setting('request.jwt.claims', true)::json->>'sub' OR anon_id = 'anonymous');
