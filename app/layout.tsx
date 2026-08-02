import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';
import { PageTransition } from '@/components/layout/page-transition';

export const metadata: Metadata = {
  title: {
    default: 'Provatferi',
    template: '%s · Provatferi'
  },
  description: 'Provatferi club dashboard — events, finances, courses and community.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
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
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Font linked here so the static export stays build-time network-free.
            The stylesheet starts at media="print" so it never blocks first paint;
            an inline script swaps it to screen media once it finishes loading. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
          media="print"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var l=document.querySelector('link[rel="stylesheet"][media="print"]');if(!l)return;var on=function(){l.media='all'};l.addEventListener('load',on);setTimeout(on,2500);})();`
          }}
        />
        <noscript>
          {/* eslint-disable-next-line @next/next/no-page-custom-font */}
          <link
            href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
            rel="stylesheet"
          />
        </noscript>
      </head>
      <body>
        <Providers>
          <PageTransition topLevel>{children}</PageTransition>
        </Providers>
      </body>
    </html>
  );
}
