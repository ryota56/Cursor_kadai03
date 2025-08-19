import { promises as fs } from 'fs';
import path from 'path';
import type { Tool } from '@/types/tool';

// フォールバック用のJSONファイル読み込み
export async function getToolsFromFile(): Promise<Tool[]> {
  try {
    const dataPath = path.join(process.cwd(), 'data', 'tools.json');
    const fileContents = await fs.readFile(dataPath, 'utf8');
    const data = JSON.parse(fileContents);
    return data.tools.filter((tool: Tool) => tool.status === 'public');
  } catch (error) {
    console.error('Failed to read tools from file:', error);
    return [];
  }
}

export async function getToolFromFile(slug: string): Promise<Tool | undefined> {
  try {
    const tools = await getToolsFromFile();
    return tools.find(tool => tool.slug === slug);
  } catch (error) {
    console.error('Failed to read tool from file:', error);
    return undefined;
  }
}

// フォールバック用の使用回数更新（ファイルベース）
export async function updateUsageCountInFile(slug: string): Promise<void> {
  try {
    const dataPath = path.join(process.cwd(), 'data', 'tools.json');
    const fileContents = await fs.readFile(dataPath, 'utf8');
    const data = JSON.parse(fileContents);
    
    const toolIndex = data.tools.findIndex((tool: Tool) => tool.slug === slug);
    if (toolIndex !== -1) {
      data.tools[toolIndex].usage_count += 1;
      await fs.writeFile(dataPath, JSON.stringify(data, null, 2), 'utf8');
    }
  } catch (error) {
    console.error('Failed to update usage count in file:', error);
  }
}
