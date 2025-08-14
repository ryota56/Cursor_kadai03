'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { FormField } from './FormField';
import { useForm } from '@/hooks/useForm';
import type { Field } from '@/types/tool';
import type { PostRunRequest, PostRunResponse, ApiError } from '@/types/api';

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

      const mode = process.env.NEXT_PUBLIC_GEMINI_API_KEY ? 'gemini' : 'mock';
      const requestBody: PostRunRequest = {
        inputs: values,
        mode
      };

      const response = await fetch(`/api/tools/${toolSlug}/runs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData: { error: ApiError } = await response.json();
        
        if (errorData.error.code === 'VALIDATION_ERROR' && errorData.error.fields) {
          setFieldErrors(errorData.error.fields);
          return;
        }
        
        throw new Error(errorData.error.message || '生成に失敗しました');
      }

      const result: PostRunResponse = await response.json();
      
      // Check for fallback usage
      const fallbackUsed = response.headers.get('X-Fallback-Used') === 'true';
      if (fallbackUsed && onFallbackUsed) {
        onFallbackUsed();
      }

      onSuccess(result);
    },
    onError: (error: string) => {
      onError(error);
    },
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {generalError && (
        <Alert variant="destructive">
          <AlertDescription>{generalError}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-6 w-full">
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

      <div className="flex justify-end pt-6">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="min-w-[120px] h-10 px-6"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              生成中...
            </>
          ) : (
            '生成する'
          )}
        </Button>
      </div>
    </form>
  );
}
