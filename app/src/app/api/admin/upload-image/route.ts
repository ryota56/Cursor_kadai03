import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import sharp from 'sharp';

// 許可されるファイル形式
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
  'image/gif',
  'image/avif',
  'image/bmp',
  'image/x-icon'
];

// ファイルサイズ制限（5MB）
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// 最大画像サイズ
const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1080;

interface UploadResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<UploadResponse>> {
  try {
    // FormDataの解析
    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: '画像ファイルが提供されていません' },
        { status: 400 }
      );
    }

    // ファイル検証
    const validationError = validateFile(file);
    if (validationError) {
      return NextResponse.json(
        { success: false, error: validationError },
        { status: 400 }
      );
    }

    // ファイルバッファの取得
    const buffer = Buffer.from(await file.arrayBuffer());

    // 画像の最適化
    let optimizedBuffer: Buffer;
    let optimizedFilename: string;

    if (file.type === 'image/svg+xml') {
      // SVGファイルはそのまま保存
      optimizedBuffer = buffer;
      optimizedFilename = generateFilename(file.name, 'svg');
    } else {
      // 画像ファイルの最適化
      const optimized = await optimizeImage(buffer, file.type);
      optimizedBuffer = optimized.buffer;
      optimizedFilename = generateFilename(file.name, optimized.format);
    }

    // アップロードディレクトリの作成
    const uploadDir = path.join(process.cwd(), 'public', 'images', 'uploads');
    await ensureDirectoryExists(uploadDir);

    // ファイルの保存
    const filePath = path.join(uploadDir, optimizedFilename);
    console.log('💾 Saving file to:', filePath);
    await fs.writeFile(filePath, optimizedBuffer);
    
    // ファイル保存の確認
    try {
      const stats = await fs.stat(filePath);
      console.log('✅ File saved successfully:', {
        path: filePath,
        size: stats.size,
        exists: true
      });
    } catch (error) {
      console.error('❌ File save verification failed:', error);
    }

    // 画像URLの生成
    const imageUrl = `/images/uploads/${optimizedFilename}`;
    console.log('🔗 Generated image URL:', imageUrl);

    console.log('✅ Image uploaded:', {
      originalName: file.name,
      savedAs: optimizedFilename,
      size: optimizedBuffer.length,
      url: imageUrl
    });

    return NextResponse.json({
      success: true,
      imageUrl
    });

  } catch (error) {
    const { logSecureError } = await import('@/lib/security');
    logSecureError('Image upload', error);
    return NextResponse.json(
      { success: false, error: '画像のアップロードに失敗しました' },
      { status: 500 }
    );
  }
}

function validateFile(file: File): string | null {
  // ファイルサイズチェック
  if (file.size > MAX_FILE_SIZE) {
    return `ファイルサイズが大きすぎます。最大${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MBまでです。`;
  }

  // ファイル形式チェック
  if (!ALLOWED_TYPES.includes(file.type)) {
    return '対応していないファイル形式です。JPG, PNG, WebP, SVG, GIF, AVIF, BMP, ICO形式に対応しています。';
  }

  // ファイル名のサニタイズ
  const sanitizedName = sanitizeFilename(file.name);
  if (!sanitizedName) {
    return '無効なファイル名です。';
  }

  return null;
}

async function optimizeImage(buffer: Buffer, mimeType: string): Promise<{ buffer: Buffer; format: string }> {
  try {
    let sharpInstance = sharp(buffer);

    // メタデータの取得
    const metadata = await sharpInstance.metadata();
    
    // リサイズが必要かチェック
    if (metadata.width && metadata.height) {
      if (metadata.width > MAX_WIDTH || metadata.height > MAX_HEIGHT) {
        sharpInstance = sharpInstance.resize(MAX_WIDTH, MAX_HEIGHT, {
          fit: 'inside',
          withoutEnlargement: true
        });
      }
    }

    // 最適化された形式で出力
    let optimizedBuffer: Buffer;
    let format: string;

    switch (mimeType) {
      case 'image/jpeg':
        optimizedBuffer = await sharpInstance
          .jpeg({ quality: 85, progressive: true })
          .toBuffer();
        format = 'jpg';
        break;
      case 'image/png':
        optimizedBuffer = await sharpInstance
          .png({ quality: 85, progressive: true })
          .toBuffer();
        format = 'png';
        break;
      case 'image/webp':
        optimizedBuffer = await sharpInstance
          .webp({ quality: 85 })
          .toBuffer();
        format = 'webp';
        break;
      case 'image/gif':
        optimizedBuffer = await sharpInstance
          .gif()
          .toBuffer();
        format = 'gif';
        break;
      case 'image/avif':
        optimizedBuffer = await sharpInstance
          .avif({ quality: 85 })
          .toBuffer();
        format = 'avif';
        break;
      case 'image/bmp':
        optimizedBuffer = await sharpInstance
          .png({ quality: 85 })
          .toBuffer();
        format = 'png';
        break;
      case 'image/x-icon':
        optimizedBuffer = await sharpInstance
          .png({ quality: 85 })
          .toBuffer();
        format = 'ico';
        break;
      default:
        // デフォルトはWebP
        optimizedBuffer = await sharpInstance
          .webp({ quality: 85 })
          .toBuffer();
        format = 'webp';
    }

    return { buffer: optimizedBuffer, format };
  } catch (error) {
    console.error('Image optimization error:', error);
    throw new Error('画像の最適化に失敗しました');
  }
}

function generateFilename(originalName: string, extension: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const sanitizedName = sanitizeFilename(originalName);
  const nameWithoutExt = sanitizedName.replace(/\.[^/.]+$/, '');
  return `${timestamp}_${nameWithoutExt}.${extension}`;
}

function sanitizeFilename(filename: string): string {
  // 危険な文字を除去
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_|_$/g, '')
    .substring(0, 100); // 長さ制限
}

async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}
