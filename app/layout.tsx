import '@/ui/globals.css';
import { notoSansKR } from '@/ui/fonts';
import { Metadata } from 'next';
import { WebVitals } from '@/utils/web-vitals';
import { SessionProvider } from "next-auth/react"

export const metadata: Metadata = {
  title: {
    // template: '%s | Dashboard',
    template: 'Fishbone | %s',
    default: 'Fishbone',
  },
  description: 'Fishbone',
  metadataBase: new URL('https://www.fishbone.com/'),
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
