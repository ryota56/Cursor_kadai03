'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import type { PostRunResponse } from '@/types/api';

interface TikTokItem {
  title: string;
  body: string;
}



interface OutputWithText {
  text: string;
}

interface OutputWithItems {
  items: TikTokItem[];
}

interface ResultViewProps {
  result: PostRunResponse;
  toolName: string;
  fallbackUsed?: boolean;
}

export function ResultView({ result, toolName, fallbackUsed }: ResultViewProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set());

  // コピー機能
  const copyToClipboard = async (text: string, itemId: string = 'main') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItems(prev => new Set(prev).add(itemId));
      toast.success('クリップボードにコピーしました');
      
      // 3秒後にコピー状態をリセット
      setTimeout(() => {
        setCopiedItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(itemId);
          return newSet;
        });
      }, 3000);
    } catch {
      toast.error('コピーに失敗しました');
    }
  };

  // 結果データの解析
  const renderOutput = () => {
    const { output } = result;

    // テキスト結果
    if (output.text) {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">生成結果</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(String((output as unknown as OutputWithText).text), 'text')}
              className="gap-2"
            >
              {copiedItems.has('text') ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              コピー
            </Button>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg border">
            <p className="whitespace-pre-wrap leading-relaxed">{(output as unknown as OutputWithText).text}</p>
          </div>
        </div>
      );
    }

    // リスト形式結果（TikTok 5選など）
    if (output.items && Array.isArray(output.items)) {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">生成結果</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const outputWithItems = output as unknown as OutputWithItems;
                const allText = outputWithItems.items
                  .map((item, index: number) => `${index + 1}. ${item.title}\n${item.body}`)
                  .join('\n\n');
                copyToClipboard(allText, 'all-items');
              }}
              className="gap-2"
            >
              {copiedItems.has('all-items') ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              全てコピー
            </Button>
          </div>
          
          <div className="space-y-3">
            {(output as unknown as OutputWithItems).items.map((item, index: number) => (
              <Card key={index} className="border-l-4 border-l-indigo-500">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const itemText = `${item.title}\n${item.body}`;
                        copyToClipboard(itemText, `item-${index}`);
                      }}
                      className="gap-1 text-xs"
                    >
                      {copiedItems.has(`item-${index}`) ? (
                        <Check className="w-3 h-3 text-green-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">{item.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      );
    }

    // その他の形式
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">生成結果</h4>
          <Button
            variant="outline"
            size="sm"
            onClick={() => copyToClipboard(JSON.stringify(output, null, 2), 'json')}
            className="gap-2"
          >
            {copiedItems.has('json') ? (
              <Check className="w-4 h-4 text-green-600" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            コピー
          </Button>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg border">
          <pre className="text-sm whitespace-pre-wrap">{JSON.stringify(output, null, 2)}</pre>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* フォールバック通知 */}
      {fallbackUsed && (
        <Alert>
          <AlertDescription>
            AI生成に失敗したため、代替の生成方法を使用しました。
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">{toolName} の結果</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="gap-2"
            >
              {isCollapsed ? (
                <>
                  <ChevronDown className="w-4 h-4" />
                  展開
                </>
              ) : (
                <>
                  <ChevronUp className="w-4 h-4" />
                  折りたたみ
                </>
              )}
            </Button>
          </div>
          <Separator />
        </CardHeader>

        {!isCollapsed && (
          <CardContent>
            {renderOutput()}
          </CardContent>
        )}
      </Card>

      {/* 実行情報 */}
      <div className="text-xs text-gray-500 text-center">
        実行ID: {result.runId}
      </div>
    </div>
  );
}
