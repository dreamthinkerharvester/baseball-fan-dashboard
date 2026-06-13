import { ToastProvider } from '@/components/ui/Toast';
import { SaberModeProvider } from '@/features/saber-mode/SaberModeContext';

import type { Metadata, Viewport } from 'next';


import './globals.css';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: '타이거즈 카드 — KIA 팬 세이버 대시보드',
    template: '%s · 타이거즈 카드',
  },
  description:
    'KIA 타이거즈 팬 전용 세이버메트릭스 대시보드. 타율 대신 wRC+ — 데이터가 말하는 진짜 기여도를 카드로. 일정·순위·라인업을 한 화면에서.',
  keywords: ['KIA 타이거즈', 'KBO', '세이버메트릭스', 'wRC+', 'FIP', '야구', '라인업', '대시보드'],
  applicationName: '타이거즈 카드',
  authors: [{ name: 'kia-fan-service' }],
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    siteName: '타이거즈 카드',
    title: '타이거즈 카드 — KIA 팬 세이버 대시보드',
    description: '타율 대신 wRC+. 데이터가 말하는 KIA 선수들의 진짜 기여도.',
    url: SITE_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: '타이거즈 카드 — KIA 팬 세이버 대시보드',
    description: '타율 대신 wRC+. 데이터가 말하는 KIA 선수들의 진짜 기여도.',
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
        <ToastProvider>
          <SaberModeProvider>{children}</SaberModeProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
