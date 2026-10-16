'use client';

import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { AuthProvider } from './auth/auth-provider';
import { initMonitoring } from '@/lib/monitoring';

/** Registers /sw.js once on the client (PWA offline shell + installability). */
function useServiceWorker() {
  React.useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    // Skip on localhost dev machines without a built SW file.
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }, []);
}

export function Providers({ children }: { children: React.ReactNode }) {
  useServiceWorker();
  React.useEffect(() => {
    initMonitoring();
  }, []);
  const [client] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false
          }
        }
      })
  );

  return (
    <QueryClientProvider client={client}>
      <NextThemesProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
        <AuthProvider>{children}</AuthProvider>
        <Toaster position="top-center" richColors />
      </NextThemesProvider>
    </QueryClientProvider>
  );
}
