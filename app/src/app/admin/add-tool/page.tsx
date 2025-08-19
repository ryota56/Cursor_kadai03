'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Plus, Save } from 'lucide-react';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { ImageUploader } from '@/components/forms/ImageUploader';
import { toast } from 'sonner';

export default function AddToolPage() {
  const [toolData, setToolData] = useState({
    name: '',
    description: '',
    slug: '',
    prompt_template: '',
    input_label: '',
    input_placeholder: '',
    input_help: ''
  });

  const [imageUrl, setImageUrl] = useState<string>('/images/placeholder.svg');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageUploaded, setImageUploaded] = useState(false);
  
  // 自動遷移機能の状態
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(0);
  const [redirectTimer, setRedirectTimer] = useState<NodeJS.Timeout | null>(null);
  
  // 最新のimageUrl値を保持するためのref
  const imageUrlRef = useRef<string>('/images/placeholder.svg');

  const handleInputChange = (field: string, value: string) => {
    setToolData(prev => ({ ...prev, [field]: value }));
    
    // ツール名が変更された時、自動でslugを生成
    if (field === 'name') {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9あ-ん\s-]/g, '')
        .replace(/[\s　]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      setToolData(prev => ({ ...prev, slug }));
    }
  };

  const handleImageUploaded = useCallback((uploadedImageUrl: string) => {
    console.log('📤 handleImageUploaded called with:', uploadedImageUrl);
    console.log('🔄 Previous imageUrl state:', imageUrl);
    
    // 画像URLの検証
    if (!uploadedImageUrl) {
      console.error('❌ Empty image URL received');
      toast.error('画像URLが無効です');
      return;
    }
    
    // プレースホルダー画像の場合は警告を表示
    if (uploadedImageUrl === '/images/placeholder.svg') {
      console.warn('⚠️ Placeholder image detected, this might indicate an upload issue');
    }
    
    // refとstateの両方を更新
    imageUrlRef.current = uploadedImageUrl;
    setImageUrl(uploadedImageUrl);
    setImageUploaded(true);
    console.log('✅ imageUrl state updated to:', uploadedImageUrl);
    toast.success('画像がアップロードされました');
  }, []); // 依存関係を空配列に変更

  const handleImageRemoved = useCallback(() => {
    console.log('handleImageRemoved called');
    imageUrlRef.current = '/images/placeholder.svg';
    setImageUrl('/images/placeholder.svg');
    setImageUploaded(false);
  }, []);

  // クリーンアップ処理
  useEffect(() => {
    return () => {
      if (redirectTimer) {
        clearInterval(redirectTimer);
      }
    };
  }, [redirectTimer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // バリデーション
      if (!toolData.name.trim()) {
        toast.error('ツール名を入力してください');
        return;
      }
      if (!toolData.description.trim()) {
        toast.error('説明を入力してください');
        return;
      }
      if (!toolData.prompt_template.trim()) {
        toast.error('プロンプトを入力してください');
        return;
      }

      // 画像URLの検証と処理（refの最新値も確認）
      let finalImageUrl = imageUrl;
      
      // デバッグログを追加
      console.log('🔍 Current imageUrl state in handleSubmit:', imageUrl);
      console.log('🔍 Current imageUrlRef.current:', imageUrlRef.current);
      console.log('🔍 Image uploaded flag:', imageUploaded);
      
      // refの最新値も考慮して最終的な画像URLを決定
      if (!imageUrl || imageUrl === '/images/placeholder.svg') {
        if (imageUrlRef.current && imageUrlRef.current !== '/images/placeholder.svg') {
          console.log('🔄 Using ref value instead of state:', imageUrlRef.current);
          finalImageUrl = imageUrlRef.current;
        } else {
          console.warn('⚠️ Using placeholder image for tool - no image uploaded');
          finalImageUrl = '/images/placeholder.svg';
        }
      } else {
        console.log('✅ Using uploaded image:', imageUrl);
        finalImageUrl = imageUrl;
      }
      
      // 新ツールデータの構築（自動生成フィールドは除外）
      const newTool = {
        slug: toolData.slug || toolData.name.toLowerCase().replace(/\s+/g, '-'),
        name: toolData.name.trim(),
        description: toolData.description.trim(),
        type: "text" as const,
        image_url: finalImageUrl,
        usage_count: 0,
        status: "public" as const,
        form_schema_json: [
          {
            name: "content",
            label: toolData.input_label.trim() || "入力内容",
            kind: "textarea" as const,
            required: true,
            help: toolData.input_help.trim() || "",
            placeholder: toolData.input_placeholder.trim() || "",
            col: 12,
            maxLength: 8000
          }
        ],
        prompt_template: toolData.prompt_template.trim()
      };

      // デバッグログ追加
      console.log('📋 Tool data image_url:', newTool.image_url);
      console.log('📋 Full tool data being sent:', JSON.stringify(newTool, null, 2));

      // APIエンドポイントに送信
      const response = await fetch('/api/admin/tools', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTool),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ API Error Response:', errorData);
        throw new Error(errorData.error || `HTTP ${response.status}: ツールの追加に失敗しました`);
      }

      await response.json();
      
      // 成功状態を設定
      setShowSuccessMessage(true);
      
      // カウントダウン開始
      let countdown = 2;
      setRedirectCountdown(countdown);
      
      const timer = setInterval(() => {
        countdown--;
        setRedirectCountdown(countdown);
        
        if (countdown <= 0) {
          clearInterval(timer);
          window.location.href = '/';
        }
      }, 1000);
      
      setRedirectTimer(timer);
      
      // フォームをリセット（既存処理を維持）
      setToolData({
        name: '',
        description: '',
        slug: '',
        prompt_template: '',
        input_label: '',
        input_placeholder: '',
        input_help: ''
      });
      setImageUrl('/images/placeholder.svg');
      setImageUploaded(false);
      imageUrlRef.current = '/images/placeholder.svg';

    } catch (error) {
      console.error('❌ Tool creation error:', error);
      
      // タイマーのクリーンアップ
      if (redirectTimer) {
        clearInterval(redirectTimer);
        setRedirectTimer(null);
      }
      // 状態のリセット
      setShowSuccessMessage(false);
      setRedirectCountdown(0);
      
      // より詳細なエラーメッセージ
      let errorMessage = 'エラーが発生しました';
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          errorMessage = 'ネットワークエラーが発生しました。インターネット接続を確認してください。';
        } else if (error.message.includes('image')) {
          errorMessage = '画像の処理中にエラーが発生しました。';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ナビゲーション */}
        <div className="mb-6">
          <Breadcrumbs 
            items={[
              { label: 'ツール一覧', href: '/' },
              { label: 'ツール追加' }
            ]}
          />
        </div>

        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">新しいツールを追加</h1>
              <p className="text-gray-600">AIツールを追加してプラットフォームを拡張します</p>
            </div>
          </div>
        </div>

        {/* メインコンテンツ */}
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* 基本情報 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                基本情報
              </CardTitle>
              <CardDescription>
                新しいAIツールの基本情報を入力してください
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-[12rem_1fr] gap-3 items-start w-full">
                <Label htmlFor="name" className="pt-2 whitespace-nowrap break-keep text-sm font-medium text-gray-700">
                  ツール名 <span className="text-red-500">*</span>
                </Label>
                <div className="min-w-0 w-full">
                  <Input
                    id="name"
                    value={toolData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="例：メール文章作成"
                    className="w-full"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-[12rem_1fr] gap-3 items-start w-full">
                <Label htmlFor="description" className="pt-2 whitespace-nowrap break-keep text-sm font-medium text-gray-700">
                  説明 <span className="text-red-500">*</span>
                </Label>
                <div className="min-w-0 w-full">
                  <Input
                    id="description"
                    value={toolData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="例：ビジネスメールを自動生成します"
                    className="w-full"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-[12rem_1fr] gap-3 items-start w-full">
                <Label htmlFor="slug" className="pt-2 whitespace-nowrap break-keep text-sm font-medium text-gray-700">
                  URL用ID
                </Label>
                <div className="min-w-0 w-full">
                  <Input
                    id="slug"
                    value={toolData.slug}
                    onChange={(e) => handleInputChange('slug', e.target.value)}
                    placeholder="自動生成されます"
                    className="w-full bg-gray-50"
                  />
                  <p className="text-xs text-gray-500 mt-1">URL: /tools/{toolData.slug}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 画像設定 */}
          <Card>
            <CardHeader>
              <CardTitle>画像設定</CardTitle>
              <CardDescription>
                ツールのサムネイル画像をアップロードしてください
              </CardDescription>
            </CardHeader>
            <CardContent>
                             <ImageUploader
                 onImageUploaded={handleImageUploaded}
                 onImageRemoved={handleImageRemoved}
                 aspectRatio="16:9"
                 maxSize={5 * 1024 * 1024} // 5MB
                 accept="image/jpeg,image/png,image/webp,image/svg+xml,image/gif,image/avif,image/bmp,image/x-icon"
               />
            </CardContent>
          </Card>

          {/* プロンプト設定 */}
          <Card>
            <CardHeader>
              <CardTitle>プロンプト設定</CardTitle>
              <CardDescription>
                AIに指示するプロンプトを設定してください
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-[12rem_1fr] gap-3 items-start w-full">
                <Label htmlFor="prompt" className="pt-2 whitespace-nowrap break-keep text-sm font-medium text-gray-700">
                  プロンプト <span className="text-red-500">*</span>
                </Label>
                <div className="min-w-0 w-full">
                  <Textarea
                    id="prompt"
                    value={toolData.prompt_template}
                    onChange={(e) => handleInputChange('prompt_template', e.target.value)}
                    placeholder={`あなたは○○の専門家です。以下の内容をもとに○○を作成してください。

内容: %s_content%

制約条件:
- 〇〇
- 〇〇`}
                    className="w-full resize-y min-h-[140px] max-h-[480px]"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    %s_content% で入力内容を参照できます
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 入力フォーム設定 */}
          <Card>
            <CardHeader>
              <CardTitle>入力フォーム設定</CardTitle>
              <CardDescription>
                ユーザーが入力するフォームの設定
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-[12rem_1fr] gap-3 items-start w-full">
                <Label htmlFor="input_label" className="pt-2 whitespace-nowrap break-keep text-sm font-medium text-gray-700">
                  入力欄ラベル
                </Label>
                <div className="min-w-0 w-full">
                  <Input
                    id="input_label"
                    value={toolData.input_label}
                    onChange={(e) => handleInputChange('input_label', e.target.value)}
                    placeholder="例：メール内容"
                    className="w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-[12rem_1fr] gap-3 items-start w-full">
                <Label htmlFor="input_placeholder" className="pt-2 whitespace-nowrap break-keep text-sm font-medium text-gray-700">
                  プレースホルダー
                </Label>
                <div className="min-w-0 w-full">
                  <Input
                    id="input_placeholder"
                    value={toolData.input_placeholder}
                    onChange={(e) => handleInputChange('input_placeholder', e.target.value)}
                    placeholder="例：送信したいメールの要点を入力してください"
                    className="w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-[12rem_1fr] gap-3 items-start w-full">
                <Label htmlFor="input_help" className="pt-2 whitespace-nowrap break-keep text-sm font-medium text-gray-700">
                  ヘルプテキスト
                </Label>
                <div className="min-w-0 w-full">
                  <Input
                    id="input_help"
                    value={toolData.input_help}
                    onChange={(e) => handleInputChange('input_help', e.target.value)}
                    placeholder="例：500文字程度で入力してください"
                    className="w-full"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 保存ボタン */}
          <div className="flex justify-end pt-6">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="min-w-[120px] h-10 px-6"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  ツールを追加
                </>
              )}
            </Button>
          </div>

        </form>
      </div>

      {/* 成功メッセージモーダル */}
      {showSuccessMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <div className="text-center">
              <div className="text-green-600 text-6xl mb-4">✓</div>
              <h3 className="text-lg font-semibold mb-2">ツール追加完了！</h3>
              <p className="text-gray-600 mb-4">
                {redirectCountdown}秒後にツール一覧に移動します
              </p>
              <div className="flex justify-center space-x-2">
                <Button
                  onClick={() => {
                    setShowSuccessMessage(false);
                    if (redirectTimer) {
                      clearInterval(redirectTimer);
                    }
                    window.location.href = '/';
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  今すぐ移動
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowSuccessMessage(false);
                    if (redirectTimer) {
                      clearInterval(redirectTimer);
                    }
                  }}
                >
                  キャンセル
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
