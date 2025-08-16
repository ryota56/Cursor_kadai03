import { promises as fs } from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import { ClientMountProvider } from '@/components/providers/ClientMountProvider';
import { ToolDetailClient } from './ToolDetailClient';
import type { Tool } from '@/types/tool';

interface ToolDetailPageProps {
  params: Promise<{ slug: string }>;
}

// Server Component - 静的データの取得
export default async function ToolDetailPage({ params }: ToolDetailPageProps) {
  const { slug } = await params;
  // URLデコード処理
  const decodedSlug = decodeURIComponent(slug);
  
  try {
    // サーバー側でdata/tools.jsonを読み込み
    const dataPath = path.join(process.cwd(), 'data', 'tools.json');
    const fileContents = await fs.readFile(dataPath, 'utf8');
    const data = JSON.parse(fileContents);
    
    // デバッグ用ログ
    console.log('Requested slug:', slug);
    console.log('Decoded slug:', decodedSlug);
    console.log('Available slugs:', data.tools.map((t: Tool) => t.slug));
    
    const tool: Tool | undefined = data.tools.find(
      (t: Tool) => t.slug === decodedSlug && t.status === 'public'
    );

    if (!tool) {
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

// generateStaticParams for SSG
export async function generateStaticParams() {
  try {
    const dataPath = path.join(process.cwd(), 'data', 'tools.json');
    const fileContents = await fs.readFile(dataPath, 'utf8');
    const data = JSON.parse(fileContents);
    
    return data.tools
      .filter((tool: Tool) => tool.status === 'public')
      .map((tool: Tool) => ({
        slug: tool.slug,
      }));
  } catch (error) {
    console.error('generateStaticParams error:', error);
    return [];
  }
}

