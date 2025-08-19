import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { logEnvironmentStatus, logSecureError, logSecurityAudit } from '@/lib/security';

export async function GET() {
  try {
    // セキュリティ監査ログ
    logSecurityAudit('TEST_CONNECTION_ATTEMPT', {
      endpoint: '/api/test-connection',
      method: 'GET'
    });
    
    // セキュアな環境変数確認
    logEnvironmentStatus();
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({
        error: '環境変数が設定されていません',
        supabaseUrl: !!supabaseUrl,
        supabaseAnonKey: !!supabaseAnonKey
      }, { status: 500 });
    }
    
    // データベース接続テスト
    const { data: tools, error } = await supabase
      .from('tools')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      logSecureError('Database connection', error);
      return NextResponse.json({
        error: 'データベース接続エラー',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Connection failed'
      }, { status: 500 });
    }
    
    // 成功ログ
    logSecurityAudit('TEST_CONNECTION_SUCCESS', {
      toolsCount: tools?.length || 0
    });
    
    return NextResponse.json({
      success: true,
      message: 'データベース接続が正常です',
      toolsCount: tools?.length || 0,
      tools: tools?.map(tool => ({
        id: tool.id,
        slug: tool.slug,
        name: tool.name,
        status: tool.status,
        created_at: tool.created_at
      })) || []
    });
    
  } catch (error) {
    logSecureError('Test connection', error);
    return NextResponse.json({
      error: '接続テストエラー',
      details: process.env.NODE_ENV === 'development' 
        ? (error instanceof Error ? error.message : 'Unknown error')
        : 'Connection test failed'
    }, { status: 500 });
  }
}
