'use client';

import React, { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Key, ExternalLink, Eye, EyeOff, Trash2 } from 'lucide-react';
import type { ApiKeyState } from '@/types/api';

interface ApiKeySectionProps {
  onApiKeyChange: (apiKey: string, isValid: boolean) => void;
  disabled?: boolean;
}

export function ApiKeySection({ onApiKeyChange, disabled }: ApiKeySectionProps) {
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [keyState, setKeyState] = useState<ApiKeyState>('not_set');
  const [isValidating, setIsValidating] = useState(false);
  const [validationTimeout, setValidationTimeout] = useState<NodeJS.Timeout | null>(null);

  // Gemini APIキーの基本検証（緩和版）
  const validateApiKey = useCallback((key: string): boolean => {
    if (!key) return false;
    // 基本的な長さと文字種のチェックのみ
    return key.length >= 30 && key.length <= 50 && /^[A-Za-z0-9_-]+$/.test(key);
  }, []);

  // API有効性検証関数
  const validateApiKeyWithGemini = useCallback(async (key: string) => {
    if (!key || key.length < 30 || key.length > 50 || !/^[A-Za-z0-9_-]+$/.test(key)) {
      return false;
    }
    
    setIsValidating(true);
    try {
      const response = await fetch('/api/validate-api-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: key })
      });
      
      if (response.ok) {
        const result = await response.json();
        return result.isValid;
      }
      return false;
    } catch (error) {
      console.error('API validation error:', error);
      return false;
    } finally {
      setIsValidating(false);
    }
  }, []);

  const handleApiKeyChange = (value: string) => {
    setApiKey(value);
    
    // デバッグ情報（開発環境のみ）
    if (process.env.NODE_ENV === 'development') {
      console.log('API Key Input Debug:', {
        value: value,
        length: value.length,
        startsWithAIza: value.startsWith('AIza-'),
        pattern: /^AIza-[A-Za-z0-9_-]{35}$/.test(value)
      });
    }

    // 既存の基本的なバリデーション
    if (!value) {
      setKeyState('not_set');
      onApiKeyChange('', false);
      return;
    }
    
    const basicValid = value.length >= 30 && value.length <= 50 && /^[A-Za-z0-9_-]+$/.test(value);
    
    if (!basicValid) {
      setKeyState('invalid');
      onApiKeyChange(value, false);
      return;
    }
    
    // 基本的な形式チェックを通過した場合、API有効性を検証
    setKeyState('validating');
    onApiKeyChange(value, false); // 一時的に無効として設定
    
    // デバウンス（1秒後）
    if (validationTimeout) {
      clearTimeout(validationTimeout);
    }
    
    const timeout = setTimeout(async () => {
      const isValid = await validateApiKeyWithGemini(value);
      setKeyState(isValid ? 'valid' : 'invalid');
      onApiKeyChange(value, isValid);
    }, 1000);
    
    setValidationTimeout(timeout);
  };

  const clearApiKey = () => {
    setApiKey('');
    setKeyState('not_set');
    onApiKeyChange('', false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Key className="w-4 h-4 text-amber-600" />
        <Label htmlFor="api-key" className="text-sm font-medium">
          Gemini APIキー
        </Label>
        <a
          href="https://makersuite.google.com/app/apikey"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          取得方法 <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      <div className="relative">
        <Input
          id="api-key"
          type={showApiKey ? 'text' : 'password'}
          placeholder="AIza-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
          value={apiKey}
          onChange={(e) => handleApiKeyChange(e.target.value)}
          disabled={disabled}
          className={`pr-20 ${
            keyState === 'valid' ? 'border-green-500' : 
            keyState === 'invalid' ? 'border-red-500' : 
            'border-gray-300'
          }`}
        />

        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {apiKey && (
            <>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowApiKey(!showApiKey)}
                className="h-6 w-6 p-0"
              >
                {showApiKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearApiKey}
                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ステータス表示 */}
      {keyState === 'valid' && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">
            ✅ 有効なAPIキーです。Gemini AIを利用できます。
          </AlertDescription>
        </Alert>
      )}

      {keyState === 'validating' && (
        <Alert className="border-blue-200 bg-blue-50">
          <AlertDescription className="text-blue-800">
            🔍 APIキーの有効性を確認中...
          </AlertDescription>
        </Alert>
      )}

      {keyState === 'invalid' && apiKey && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">
            ❌ APIキーが無効です。
            <br />
            • 正しいGemini APIキーを入力してください
            <br />
            • APIキーが有効で、利用制限に達していないことを確認してください
          </AlertDescription>
        </Alert>
      )}

      {keyState === 'invalid' && !apiKey && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">
            ❌ APIキーの形式が正しくありません。
            <br />
            • 30文字以上50文字以下の英数字・アンダースコア・ハイフンで構成してください
            <br />
            • 入力されたキー: {apiKey.substring(0, 10)}...（{apiKey.length}文字）
          </AlertDescription>
        </Alert>
      )}

      {keyState === 'not_set' && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertDescription className="text-amber-800">
            ⚠️ APIキーが設定されていません。Mockモードで動作します。
          </AlertDescription>
        </Alert>
      )}

      <p className="text-xs text-gray-500">
        💡 APIキーは安全に暗号化送信され、一切保存されません。
      </p>
    </div>
  );
}
