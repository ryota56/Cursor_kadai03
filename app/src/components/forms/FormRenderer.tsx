'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { FormField } from './FormField';
import { ApiKeySection } from './ApiKeySection'; // New import
import { ModelSelection } from './ModelSelection'; // New import
import { useForm } from '@/hooks/useForm';
import type { Field } from '@/types/tool';
import type { PostRunRequest, PostRunResponse, ApiError, GeminiModel } from '@/types/api'; // Updated import

interface FormRendererProps {
  toolSlug: string;
  fields: Field[];
  onSuccess: (result: PostRunResponse) => void;
  onError: (error: string) => void;
  onFallbackUsed?: () => void;
}

export function FormRenderer({
  toolSlug,
  fields,
  onSuccess,
  onError,
  onFallbackUsed
}: FormRendererProps) {
  const [generalError, setGeneralError] = React.useState<string | null>(null);
  const [apiKey, setApiKey] = useState(''); // New state
  const [isApiKeyValid, setIsApiKeyValid] = useState(false); // New state
  const [selectedModel, setSelectedModel] = useState<GeminiModel>('gemini-2.5-flash'); // New state

  const {
    values,
    errors,
    isSubmitting,
    updateValue,
    handleSubmit,
    setFieldErrors,
  } = useForm({
    fields,
    onSubmit: async (values: Record<string, unknown>) => {
      setGeneralError(null);

      // セキュア送信設定
      const mode = isApiKeyValid ? 'gemini' : 'mock';
      const requestBody: PostRunRequest = {
        inputs: values,
        mode,
        model: mode === 'gemini' ? selectedModel : undefined,
        userApiKey: mode === 'gemini' ? apiKey : undefined
      };

      try {
        const response = await fetch(`/api/tools/${toolSlug}/runs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        // 送信後即座にAPIキーをメモリから削除（セキュリティ）
        if (apiKey) {
          requestBody.userApiKey = undefined;
          delete requestBody.userApiKey;
        }

        if (!response.ok) {
          const errorData: { error: ApiError } = await response.json();

          if (errorData.error.code === 'VALIDATION_ERROR' && errorData.error.fields) {
            setFieldErrors(errorData.error.fields);
            return;
          }

          throw new Error(errorData.error.message || '生成に失敗しました');
        }

        const result: PostRunResponse = await response.json();

        // フォールバック使用の確認
        const fallbackUsed = response.headers.get('X-Fallback-Used') === 'true';
        if (fallbackUsed && onFallbackUsed) {
          onFallbackUsed();
        }

        onSuccess(result);
      } catch (error) {
        // エラー時もAPIキーを確実にクリア
        if (apiKey) {
          requestBody.userApiKey = undefined;
          delete requestBody.userApiKey;
        }
        throw error;
      }
    },
    onError: (error: string) => {
      onError(error);
    },
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* APIキー設定セクション */}
      <ApiKeySection
        onApiKeyChange={(key, valid) => {
          setApiKey(key);
          setIsApiKeyValid(valid);
        }}
        disabled={isSubmitting}
      />

      {/* モデル選択セクション */}
      <ModelSelection
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        disabled={isSubmitting || !isApiKeyValid}
      />

      {/* 区切り線 */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-sm font-medium text-gray-900 mb-4">入力パラメータ</h3>

        {/* 既存のフィールド */}
        {fields.map((field) => (
          <FormField
            key={field.name}
            field={field}
            value={values[field.name]}
            error={errors[field.name]}
            onChange={(value) => updateValue(field.name, value)}
          />
        ))}
      </div>

      {/* エラー表示 */}
      {generalError && (
        <Alert>
          <AlertDescription>{generalError}</AlertDescription>
        </Alert>
      )}

      {/* 送信ボタン */}
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isSubmitting || !isApiKeyValid}
          className="min-w-[140px]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {isApiKeyValid ? 'AI生成中...' : 'Mock生成中...'}
            </>
          ) : (
            <>
              {isApiKeyValid ? `${selectedModel}で生成` : 'Mock生成'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
