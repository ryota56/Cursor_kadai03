'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PageLayoutProps {
  children: React.ReactNode;
  title?: string;
  showBackButton?: boolean;
  className?: string;
}

export function PageLayout({ 
  children, 
  title, 
  showBackButton = false,
  className = ""
}: PageLayoutProps) {
  const router = useRouter();

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {(showBackButton || title) && (
          <div className="flex items-center justify-between mb-6">
            {showBackButton && (
              <Button variant="ghost" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                戻る
              </Button>
            )}
            {title && !showBackButton && (
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
