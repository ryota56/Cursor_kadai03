import { promises as fs } from 'fs';
import path from 'path';
import { ClientMountProvider } from '@/components/providers/ClientMountProvider';
import { HomePageClient } from './HomePageClient';
import type { Tool } from '@/types/tool';

export default async function HomePage() {
  let initialTools: Tool[] = [];
  
  try {
    const dataPath = path.join(process.cwd(), 'data', 'tools.json');
    const fileContents = await fs.readFile(dataPath, 'utf8');
    const data = JSON.parse(fileContents);
    initialTools = data.tools.filter((tool: Tool) => tool.status === 'public');
    initialTools.sort((a, b) => b.usage_count - a.usage_count);
  } catch (error) {
    console.error('Error:', error);
  }

  return (
    <ClientMountProvider>
      <HomePageClient initialTools={initialTools} />
    </ClientMountProvider>
  );
}
