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
  // 800 is only referenced by `font-extrabold` on Bengali text, which the
  // Bengali serif already covers — dropping it halves Inter's payload.
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'প্রভাতফেরী',
    template: 'প্রভাতফেরী- %s'
  },
  description: 'ঢাকা বিশ্ববিদ্যালয় প্রভাতফেরী সাংস্কৃতিক সংসদ',
  openGraph: {
    title: 'প্রভাতফেরী',
    description: 'ঢাকা বিশ্ববিদ্যালয় প্রভাতফেরী সাংস্কৃতিক সংসদ',
    url: 'https://home.provatferi2009.workers.dev',
    siteName: 'প্রভাতফেরী',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'প্রভাতফেরী',
      },
    ],
    locale: 'bn_BD',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'প্রভাতফেরী',
    description: 'ঢাকা বিশ্ববিদ্যালয় প্রভাতফেরী সাংস্কৃতিক সংসদ',
    images: ['/og-image.png'],
  },
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
