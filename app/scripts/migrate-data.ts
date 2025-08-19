import { config } from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// .env.localファイルを読み込み
config({ path: path.resolve(__dirname, '../.env.local') });

// デバッグ: 環境変数の確認
console.log('Environment variables check:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET');

// Service Role Keyを使用してSupabaseクライアントを作成（RLSをバイパス）
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase environment variables are not set');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

import toolsData from '../data/tools.json';

async function migrateTools() {
  console.log('🚀 Starting data migration...');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const tool of toolsData.tools) {
    try {
      console.log(`📝 Migrating tool: ${tool.slug} (${tool.name})`);
      
      const { error } = await supabase
        .from('tools')
        .upsert(tool, { onConflict: 'slug' });
      
      if (error) {
        console.error(`❌ Error migrating tool ${tool.slug}:`, error);
        errorCount++;
      } else {
        console.log(`✅ Successfully migrated tool: ${tool.slug}`);
        successCount++;
      }
    } catch (error) {
      console.error(`❌ Unexpected error migrating tool ${tool.slug}:`, error);
      errorCount++;
    }
  }
  
  console.log('\n📊 Migration Summary:');
  console.log(`✅ Successfully migrated: ${successCount} tools`);
  console.log(`❌ Failed migrations: ${errorCount} tools`);
  console.log(`📈 Total tools processed: ${toolsData.tools.length}`);
  
  if (errorCount === 0) {
    console.log('🎉 Data migration completed successfully!');
  } else {
    console.log('⚠️  Some tools failed to migrate. Please check the logs above.');
  }
}

// 環境変数チェック
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase environment variables!');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

migrateTools().catch(console.error);
