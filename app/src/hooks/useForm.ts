import { useState, useCallback } from 'react';
import type { Field } from '@/types/tool';

interface ValidationErrors {
  [fieldName: string]: string;
}

interface UseFormOptions {
  fields: Field[];
  onSubmit: (values: Record<string, unknown>) => Promise<void>;
  onError?: (error: string) => void;
}

export function useForm({ fields, onSubmit, onError }: UseFormOptions) {
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateValue = useCallback((fieldName: string, value: unknown) => {
    setValues(prev => ({ ...prev, [fieldName]: value }));
    
    // Clear error when field is updated
    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  }, [errors]);

  const validateForm = useCallback((): boolean => {
    const newErrors: ValidationErrors = {};
    
    for (const field of fields) {
      const value = values[field.name];
      
      // Required field validation
      if (field.required && (!value || String(value).trim() === '')) {
        newErrors[field.name] = '必須項目です';
      }
      
      // Max length validation (warning only)
      if (field.maxLength && String(value || '').length > field.maxLength) {
        newErrors[field.name] = `長すぎます（自動要約されます）`;
      }
    }
    
    setErrors(newErrors);
    
    // Only block submission for required field errors
    const hasRequiredErrors = Object.values(newErrors).some(error => 
      error === '必須項目です'
    );
    
    return !hasRequiredErrors;
  }, [fields, values]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(values);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました';
      onError?.(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [validateForm, onSubmit, onError, values]);

  const setFieldErrors = useCallback((fieldErrors: ValidationErrors) => {
    setErrors(fieldErrors);
  }, []);

  return {
    values,
    errors,
    isSubmitting,
    updateValue,
    handleSubmit,
    setFieldErrors,
  };
}
