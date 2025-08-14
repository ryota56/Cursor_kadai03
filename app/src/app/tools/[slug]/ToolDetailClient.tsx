'use client';

import { ToolDetail } from '@/components/features/ToolDetail';
import type { Tool } from '@/types/tool';

interface ToolDetailClientProps {
  tool: Tool;
}

export function ToolDetailClient({ tool }: ToolDetailClientProps) {
  return <ToolDetail tool={tool} />;
}