import '@/ui/globals.css';
import { notoSansKR } from '@/ui/fonts';
import { Metadata } from 'next';
import { SessionProvider } from "next-auth/react"

export const metadata: Metadata = {
  title: {
    template: 'Fishbone | %s',
    default: 'Fishbone',
  },
  description: 'Fishbone',
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
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
