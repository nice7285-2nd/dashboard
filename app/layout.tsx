import '@/ui/globals.css';
import { notoSansKR } from '@/ui/fonts';
import { Metadata } from 'next';
import { WebVitals } from '@/utils/web-vitals';

export const metadata: Metadata = {
  title: {
    template: '%s | Dashboard',
    default: 'Dashboard by Levelup Next.js',
  },
  description: '레벨업 리액트 프로그래밍 with Next.js - 대시보드 프로젝트',
  metadataBase: new URL('https://levelup-dashboard.vercel.app/'),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={`${notoSansKR.className} antialiased`}>
        <WebVitals />
        {children}
      </body>
    </html>
  );
}
