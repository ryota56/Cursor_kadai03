import { notFound } from 'next/navigation';
import { ClientMountProvider } from '@/components/providers/ClientMountProvider';
import { ToolDetailClient } from './ToolDetailClient';
import type { Tool } from '@/types/tool';

interface ToolDetailPageProps {
  params: Promise<{ slug: string }>;
}

// Server Component - 動的データの取得
export default async function ToolDetailPage({ params }: ToolDetailPageProps) {
  const { slug } = await params;
  // URLデコード処理
  const decodedSlug = decodeURIComponent(slug);
  
  try {
    // APIエンドポイントからツールデータを取得
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/tools/${decodedSlug}`, {
      cache: 'no-store' // 動的データのためキャッシュを無効化
    });
    
    if (!response.ok) {
      console.log('Tool not found:', decodedSlug);
      notFound();
    }
    
    const data = await response.json();
    const tool: Tool = data.tool;
    
    // デバッグ用ログ
    console.log('Requested slug:', slug);
    console.log('Decoded slug:', decodedSlug);
    console.log('Found tool:', tool.name);

    if (!tool || tool.status !== 'public') {
      notFound();
    }

    return (
      <ClientMountProvider>
        <ToolDetailClient tool={tool} />
      </ClientMountProvider>
    );
  } catch (error) {
    console.error('Tool detail loading error:', error);
    notFound();
  }
}



