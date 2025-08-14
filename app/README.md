# AI ツールプラットフォーム

文章リライトツールとTikTok台本メーカーを提供するNext.jsアプリケーション

## 🚨 重要: コマンド実行時の注意事項

**必ずこのディレクトリ（appフォルダ）でコマンドを実行してください**

### ✅ 正しいディレクトリ構造
```
Cursor_kadai03/
├── .git/
├── 仕様書.md
└── app/                    ← ここがプロジェクトルート
    ├── package.json        ← このファイルがある場所
    ├── src/
    ├── public/
    └── ...
```

### 📍 正しいコマンド実行手順

**PowerShell/コマンドプロンプトを開いて:**

```powershell
# 1. 正しいディレクトリに移動（絶対パス）
cd C:\Users\banana34\code\Cursor_kadai03\app

# 2. 現在のディレクトリを確認
pwd
# 出力: C:\Users\banana34\code\Cursor_kadai03\app

# 3. package.jsonの存在確認
ls package.json
# 出力: package.json が表示されるはず

# 4. 開発サーバー起動
npm run dev
```

### ❌ よくある間違い

```powershell
# 間違い: 親ディレクトリで実行
cd C:\Users\banana34\code\Cursor_kadai03
npm run dev  # ← エラー: package.json が見つからない
```

## Getting Started

**開発サーバーの起動:**

```bash
# 必ず C:\Users\banana34\code\Cursor_kadai03\app で実行
npm run dev
```

**アクセスURL:**
- メイン: [http://localhost:3000](http://localhost:3000)
- ポート競合時: [http://localhost:3001](http://localhost:3001)

## 🎯 利用可能なツール

- `/tools/rewrite` - 文章リライトツール
- `/tools/tiktok-5picks` - TikTok台本メーカー

## 🔧 トラブルシューティング

### Internal Server Error が発生する場合

```powershell
# 1. 開発サーバー停止（Ctrl+C）
# 2. キャッシュクリア
Remove-Item -Path ".\.next" -Recurse -Force
# 3. 再起動
npm run dev
```

### Hydration Mismatch エラーが発生する場合

```powershell
# ハードリフレッシュを実行
# Chrome/Edge: Ctrl + Shift + R
# Firefox: Ctrl + F5
```

### ポート 3000 が使用中の場合

- サーバー起動時に自動的に 3001 ポートに変更されます
- 表示されたURLを確認してアクセスしてください

### コマンドが見つからないエラー

```powershell
# Node.jsとnpmのインストール確認
node --version
npm --version

# 依存関係の再インストール
npm install
```

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
