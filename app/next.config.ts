import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ['@/components/ui'],
  },
  // SSR 最適化
  poweredByHeader: false,
  // ハイドレーション問題軽減
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
};

export default nextConfig;
