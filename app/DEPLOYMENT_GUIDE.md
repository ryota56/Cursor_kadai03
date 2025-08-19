# AI Tools Platform - Supabase + Vercel デプロイガイド

## 概要
このガイドでは、AI Tools PlatformをSupabaseデータベースとVercelにデプロイする手順を説明します。

## 前提条件
- Supabaseアカウント
- Vercelアカウント
- GitHubリポジトリ（推奨）

## 手順

### 1. Supabaseプロジェクトの設定

#### 1.1 Supabaseプロジェクトの作成
1. [Supabaseダッシュボード](https://supabase.com/dashboard)にアクセス
2. 「New Project」をクリック
3. プロジェクト名: `ai-tools-platform`
4. データベースパスワードを設定
5. リージョンを選択（推奨: Asia Pacific (Tokyo)）
6. 「Create new project」をクリック

#### 1.2 データベーススキーマの作成
1. Supabaseダッシュボードで「SQL Editor」を開く
2. `supabase-schema.sql`の内容をコピーして実行
3. テーブルとインデックスが作成されることを確認

#### 1.3 環境変数の取得
1. 「Settings」→「API」を開く
2. 以下の値をコピー：
   - Project URL
   - anon public key
   - service_role key（管理者用）

### 2. ローカル環境の設定

#### 2.1 環境変数の設定
```bash
# app/.env.local を作成
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GEMINI_API_KEY=your_gemini_api_key  # オプション
```

#### 2.2 データ移行の実行
```bash
cd app
npm run build  # TypeScriptコンパイル
npx tsx scripts/migrate-data.ts
```

### 3. Vercelデプロイ

#### 3.1 Vercelプロジェクトの作成
1. [Vercelダッシュボード](https://vercel.com/dashboard)にアクセス
2. 「New Project」をクリック
3. GitHubリポジトリを選択
4. フレームワーク: Next.js
5. ルートディレクトリ: `app`
6. 「Deploy」をクリック

#### 3.2 環境変数の設定
Vercelダッシュボードで以下を設定：
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`（オプション）

#### 3.3 デプロイの確認
1. デプロイが成功したことを確認
2. アプリケーションが正常に動作することを確認
3. ツール一覧が表示されることを確認
4. ツールの実行が正常に動作することを確認

### 4. 動作確認

#### 4.1 基本機能の確認
- [ ] ツール一覧の表示
- [ ] ツール詳細の表示
- [ ] ツールの実行
- [ ] 検索機能
- [ ] お気に入り機能

#### 4.2 管理者機能の確認
- [ ] ツールの追加
- [ ] ツールの削除
- [ ] 画像アップロード

#### 4.3 データベースの確認
- [ ] Supabaseダッシュボードでデータが正しく保存されていることを確認
- [ ] 実行履歴が記録されていることを確認
- [ ] 使用回数が更新されていることを確認

### 5. トラブルシューティング

#### 5.1 よくある問題
1. **環境変数が設定されていない**
   - Vercelダッシュボードで環境変数を確認
   - ローカル環境で`.env.local`を確認

2. **Supabase接続エラー**
   - URLとキーが正しいことを確認
   - RLSポリシーが正しく設定されていることを確認

3. **データ移行エラー**
   - スキーマが正しく作成されていることを確認
   - 移行スクリプトを再実行

#### 5.2 ロールバック手順
1. Vercelで前のバージョンにロールバック
2. 環境変数を元の設定に戻す
3. 必要に応じてSupabaseデータを復元

### 6. セキュリティ考慮事項

#### 6.1 環境変数の管理
- 本番環境では適切な値を使用
- 機密情報をGitにコミットしない
- Vercelの環境変数機能を活用

#### 6.2 データベースセキュリティ
- RLSポリシーが正しく設定されていることを確認
- 不要な権限を削除
- 定期的なバックアップを設定

### 7. パフォーマンス最適化

#### 7.1 データベース最適化
- インデックスが正しく作成されていることを確認
- 不要なクエリを削除
- 接続プールの設定を確認

#### 7.2 アプリケーション最適化
- 画像の最適化
- コード分割の活用
- キャッシュ戦略の実装

## サポート
問題が発生した場合は、以下を確認してください：
1. ログの確認（Vercel Functions Logs）
2. Supabase Logsの確認
3. ブラウザの開発者ツールでのエラー確認

## 更新履歴
- 2024-01-15: 初版作成
- 2024-01-16: フォールバック機能追加
- 2024-01-17: セキュリティ考慮事項追加
