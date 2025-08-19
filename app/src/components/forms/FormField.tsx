import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

import type { Field } from '@/types/tool';

interface FormFieldProps {
  field: Field;
  value: unknown;
  error?: string;
  onChange: (value: unknown) => void;
}

export function FormField({ field, value, error, onChange }: FormFieldProps) {
  const fieldId = `field-${field.name}`;
  const hasError = !!error;

  const renderFieldElement = () => {
    const baseProps = {
      id: fieldId,
      'aria-invalid': hasError,
      'aria-describedby': hasError ? `${fieldId}-error` : undefined,
    };

    switch (field.kind) {
      case 'input':
        return (
          <Input
            {...baseProps}
            type="text"
            value={String(value || '')}
            placeholder={field.placeholder}
            onChange={(e) => onChange(e.target.value)}
            className={`h-10 ${hasError ? 'border-red-500' : ''}`}
          />
        );

      case 'textarea':
        return (
          <Textarea
            {...baseProps}
            value={String(value || '')}
            placeholder={field.placeholder}
            onChange={(e) => onChange(e.target.value)}
            error={hasError}
            className="w-full resize-y min-h-[140px] max-h-[480px]"
          />
        );

      case 'select':
        return (
          <Select
            value={String(value || '')}
            onValueChange={(newValue) => onChange(newValue)}
          >
            <SelectTrigger className={hasError ? 'border-red-500' : ''}>
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

      case 'switch':
        return (
          <div className="flex items-center space-x-2">
            <Switch
              {...baseProps}
              checked={!!value}
              onCheckedChange={(checked) => onChange(checked)}
            />
            <Label htmlFor={fieldId} className="text-sm font-medium">
              {field.label}
            </Label>
          </div>
        );

      default:
        return <div>未対応のフィールドタイプ: {field.kind}</div>;
    }
  };

  // 日本語に優しいグリッドレイアウト：固定幅ラベル + 伸縮入力領域
  if (field.kind === 'switch') {
    return (
      <div className="grid grid-cols-[12rem_1fr] gap-3 items-start w-full">
        <div></div> {/* 空のラベル領域 */}
        <div className="min-w-0 w-full">
          {renderFieldElement()}
          {field.help && !error && (
            <p className="text-xs text-gray-500 mt-1">{field.help}</p>
          )}
          {error && (
            <p id={`${fieldId}-error`} className="text-sm text-red-600 mt-1" role="alert">
              {error}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[12rem_1fr] gap-3 items-start w-full">
      <Label 
        htmlFor={fieldId} 
        className="pt-2 whitespace-nowrap break-keep text-sm font-medium text-gray-700"
      >
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <div className="min-w-0 w-full">
        {renderFieldElement()}
        {field.help && !error && (
          <p className="text-xs text-gray-500 mt-1">{field.help}</p>
        )}
        {error && (
          <p id={`${fieldId}-error`} className="text-sm text-red-600 mt-1" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
