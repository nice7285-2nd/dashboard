import '@/ui/globals.css';
import { notoSansKR } from '@/ui/fonts';
import { Metadata } from 'next';
import { WebVitals } from '@/utils/web-vitals';
import { SessionProvider } from "next-auth/react"

export const metadata: Metadata = {
  title: {
    template: '%s | Dashboard',
    default: 'Fishbone Workbooks',
  },
  description: 'Fishbone Workbooks',
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
          {children}
      </body>
    </html>
  );
}
