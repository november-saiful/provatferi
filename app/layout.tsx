import type { Metadata, Viewport } from 'next';
import { Noto_Serif_Bengali, Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const notoSerifBengali = Noto_Serif_Bengali({
  subsets: ['bengali', 'latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-noto-serif-bengali',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'Provatferi',
    template: '%s · Provatferi'
  },
  description: 'প্রভাতফেরী ক্লাব ড্যাশবোর্ড — ইভেন্ট, অর্থ, কোর্স ও কমিউনিটি।',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-apple-touch.png', sizes: '180x180', type: 'image/png' },
      { url: '/logo.png', sizes: 'any', type: 'image/png' },
    ],
    shortcut: '/favicon.svg',
    apple: '/favicon-apple-touch.png',
    other: [
      { rel: 'manifest', url: '/site.webmanifest' },
    ],
  },
  manifest: '/site.webmanifest',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#faf7f3' },
    { media: '(prefers-color-scheme: dark)', color: '#14120f' }
  ]
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn" suppressHydrationWarning className={`${notoSerifBengali.variable} ${inter.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
