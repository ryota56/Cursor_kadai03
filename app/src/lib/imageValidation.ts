export async function validateImageUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

export function isValidImageUrl(url: string): boolean {
  if (!url || url === '/images/placeholder.svg') {
    return false;
  }
  
  // 基本的なURL形式チェック
  const validPatterns = [
    /^\/images\/uploads\/.+\.(jpg|jpeg|png|webp|svg|gif|avif|bmp|ico)$/i,
    /^\/images\/.+\.(jpg|jpeg|png|webp|svg|gif|avif|bmp|ico)$/i
  ];
  
  return validPatterns.some(pattern => pattern.test(url));
}
