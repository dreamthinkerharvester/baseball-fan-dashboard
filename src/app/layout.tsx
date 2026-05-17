import { ToastProvider } from '@/components/ui/Toast';

import type { Metadata, Viewport } from 'next';


import './globals.css';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'KBO 야구 카드 대시보드',
    template: '%s · KBO 야구 카드 대시보드',
  },
  description:
    'KBO 마이팀 라인업을 등급 색상 카드로 30초 안에 판독하는 단일 페이지 대시보드. 일정·순위·선수 기록을 한 화면에서.',
  keywords: ['KBO', '한국 프로야구', '야구', '라인업', '대시보드', '카드'],
  applicationName: 'KBO 카드 대시보드',
  authors: [{ name: 'baseball-fan-dashboard' }],
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    siteName: 'KBO 야구 카드 대시보드',
    title: 'KBO 야구 카드 대시보드',
    description: '마이팀 라인업을 등급 색상 카드로 30초 판독.',
    url: SITE_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KBO 야구 카드 대시보드',
    description: '마이팀 라인업을 등급 색상 카드로 30초 판독.',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0F1320',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="dark">
      <head>
        {/* Material Symbols — Google Fonts CSS2 (auto-resolves font version) */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
      </head>
      <body className="magu-bg-stadium min-h-screen text-text-primary antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
