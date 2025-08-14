'use client';

import React from 'react';
import { PageLayout } from './PageLayout';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';

interface ToolPageLayoutProps {
  children: React.ReactNode;
  tool?: {
    name: string;
    slug: string;
  };
}

export function ToolPageLayout({ children, tool }: ToolPageLayoutProps) {
  const breadcrumbItems = tool ? [
    { label: 'ツール一覧', href: '/' },
    { label: tool.name, href: `/tools/${tool.slug}` }
  ] : [
    { label: 'ツール一覧', href: '/' }
  ];

  return (
    <PageLayout showBackButton>
      <Breadcrumbs items={breadcrumbItems} />
      {children}
    </PageLayout>
  );
}
