'use client';

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Cpu } from 'lucide-react';
import type { GeminiModel } from '@/types/api';

interface ModelSelectionProps {
  selectedModel: GeminiModel;
  onModelChange: (model: GeminiModel) => void;
  disabled?: boolean;
}

export function ModelSelection({ selectedModel, onModelChange, disabled }: ModelSelectionProps) {
  const modelOptions = [
    {
      value: 'gemini-2.5-pro' as GeminiModel,
      label: 'Gemini 2.5 Pro',
      description: '高性能・高精度（テキスト、画像、動画対応）',
      icon: '🚀',
      recommended: false
    },
    {
      value: 'gemini-2.5-flash' as GeminiModel,
      label: 'Gemini 2.5 Flash',
      description: '高速・バランス型（推論付き軽量モデル）',
      icon: '⚡',
      recommended: true
    },
    {
      value: 'gemini-2.5-flash-lite' as GeminiModel,
      label: 'Gemini 2.5 Flash-Lite',
      description: '超高速・軽量（エッジ・モバイル最適化）',
      icon: '💨',
      recommended: false
    }
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Cpu className="w-4 h-4 text-indigo-600" />
        <Label htmlFor="model-select" className="text-sm font-medium">
          AIモデル選択
        </Label>
      </div>

      <Select value={selectedModel} onValueChange={onModelChange} disabled={disabled}>
        <SelectTrigger id="model-select">
          <SelectValue placeholder="モデルを選択してください" />
        </SelectTrigger>
        <SelectContent>
          {modelOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex items-center gap-2 w-full">
                <span className="text-lg">{option.icon}</span>
                <div className="flex flex-col flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{option.label}</span>
                    {option.recommended && (
                      <span className="px-1.5 py-0.5 text-xs bg-green-100 text-green-700 rounded">
                        推奨
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">{option.description}</span>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <p className="text-xs text-gray-500">
        🎯 初回利用時はFlashモデルがおすすめです。Pro版は画像・動画生成に対応しています。
      </p>
    </div>
  );
}
