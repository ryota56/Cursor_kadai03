import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { ClientOnly } from "@/components/providers/ClientOnly";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s | AIツールハブ",
    default: "AIツールハブ",
  },
  description: "文章・画像などのAIツールを素早く試せるMVP",
  openGraph: {
    title: "AIツールハブ",
    description: "文章・画像などのAIツールを素早く試せるMVP",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        {children}
        <ClientOnly>
          <Toaster position="top-right" />
        </ClientOnly>
      </body>
    </html>
  );
}