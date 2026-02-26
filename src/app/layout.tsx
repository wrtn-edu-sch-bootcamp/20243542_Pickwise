import type { Metadata, Viewport } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import { UserProvider } from '@/contexts/UserContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import ThemeToggle from '@/components/ThemeToggle';

const geist = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: '모지픽 - AI 결정 도우미',
  description: '결정이 힘들 때 모지픽이 도와드립니다. 사진과 상황을 알려주면 데이터 기반으로 최선을 골라줘요!',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: '모지픽',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: '#08080F',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className={`${geist.variable} antialiased`}>
        <div className="ambient-orb-1" />
        <div className="ambient-orb-2" />
        <ThemeProvider>
          <UserProvider>{children}</UserProvider>
          <ThemeToggle />
        </ThemeProvider>
      </body>
    </html>
  );
}
