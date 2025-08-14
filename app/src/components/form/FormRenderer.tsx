'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import type { Field } from '@/types/tool';
import type { PostRunRequest, PostRunResponse, ApiError } from '@/types/api';

interface FormRendererProps {
  toolSlug: string;
  fields: Field[];
  onSuccess: (result: PostRunResponse) => void;
  onError: (error: string) => void;
  onFallbackUsed?: () => void;
}

interface ValidationErrors {
  [fieldName: string]: string;
}

export function FormRenderer({ 
  toolSlug, 
  fields, 
  onSuccess, 
  onError,
  onFallbackUsed 
}: FormRendererProps) {
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // フィールド値更新
  const updateValue = (fieldName: string, value: unknown) => {
    setValues(prev => ({ ...prev, [fieldName]: value }));
    
    // エラーをクリア
    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  // バリデーション
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};
    
    for (const field of fields) {
      const value = values[field.name];
      
      // 必須チェック
      if (field.required && (!value || String(value).trim() === '')) {
        newErrors[field.name] = '必須項目です';
      }
      
      // 長さチェック（警告のみ）
      if (field.maxLength && String(value || '').length > field.maxLength) {
        newErrors[field.name] = `長すぎます（自動要約されます）`;
      }
    }
    
    setErrors(newErrors);
    
    // 必須エラーのみブロック
    const hasRequiredErrors = Object.values(newErrors).some(error => 
      error === '必須項目です'
    );
    
    return !hasRequiredErrors;
  };

  // フォーム送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setGeneralError(null);

    try {
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
          setErrors(errorData.error.fields);
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
      const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました';
      setGeneralError(errorMessage);
      onError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // フィールドレンダリング
  const renderField = (field: Field) => {
    const fieldError = errors[field.name];
    const value = values[field.name] || '';
    const fieldId = `field-${field.name}`;

    const baseProps = {
      id: fieldId,
      'aria-invalid': !!fieldError,
      'aria-describedby': fieldError ? `${fieldId}-error` : undefined,
    };

    let fieldElement: React.ReactNode;

    switch (field.kind) {
      case 'input':
        fieldElement = (
          <Input
            {...baseProps}
            type="text"
            value={String(value || '')}
            placeholder={field.placeholder}
            onChange={(e) => updateValue(field.name, e.target.value)}
            className={fieldError ? 'border-red-500' : ''}
          />
        );
        break;

      case 'textarea':
        fieldElement = (
          <Textarea
            {...baseProps}
            value={String(value || '')}
            placeholder={field.placeholder}
            onChange={(e) => updateValue(field.name, e.target.value)}
            className={`min-h-[120px] ${fieldError ? 'border-red-500' : ''}`}
            rows={6}
          />
        );
        break;

      case 'select':
        fieldElement = (
          <Select
            value={String(value || '')}
            onValueChange={(newValue) => updateValue(field.name, newValue)}
          >
            <SelectTrigger className={fieldError ? 'border-red-500' : ''}>
              <SelectValue placeholder={field.placeholder || '選択してください'} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
        break;

      case 'switch':
        fieldElement = (
          <div className="flex items-center space-x-2">
            <Switch
              {...baseProps}
              checked={!!value}
              onCheckedChange={(checked) => updateValue(field.name, checked)}
            />
            <Label htmlFor={fieldId} className="text-sm font-medium">
              {field.label}
            </Label>
          </div>
        );
        break;

      default:
        fieldElement = <div>未対応のフィールドタイプ: {field.kind}</div>;
    }

    const colSpan = field.col || 12;
    const colClass = `col-span-${Math.min(12, Math.max(1, colSpan))}`;

    return (
      <div key={field.name} className={colClass}>
        <div className="space-y-2">
          {field.kind !== 'switch' && (
            <Label htmlFor={fieldId} className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
          )}
          
          {fieldElement}
          
          {field.help && (
            <p className="text-xs text-gray-500">{field.help}</p>
          )}
          
          {fieldError && (
            <p id={`${fieldId}-error`} className="text-sm text-red-600" role="alert">
              {fieldError}
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {generalError && (
        <Alert variant="destructive">
          <AlertDescription>{generalError}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-12 gap-4">
        {fields.map(renderField)}
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="min-w-[120px]"
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
