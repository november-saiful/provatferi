'use client';

import * as React from 'react';
import { captureError } from '@/lib/monitoring';

/**
 * Root error boundary (App Router). Replaces the whole page when an
 * uncaught render error bubbles past every nested error.tsx.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    void captureError(error);
  }, [error]);

  return (
    <html lang="bn">
      <body>
        <main
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            padding: 24,
            textAlign: 'center',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>কিছু একটা সমস্যা হয়েছে</h1>
          <p style={{ opacity: 0.7 }}>পাতাটি লোড করা যায়নি। আবার চেষ্টা করুন।</p>
          <button
            type="button"
            onClick={reset}
            style={{
              padding: '10px 24px',
              borderRadius: 12,
              border: 'none',
              background: '#93452A',
              color: '#fff',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            আবার চেষ্টা করুন
          </button>
        </main>
      </body>
    </html>
  );
}
