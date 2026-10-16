import * as React from 'react';

/**
 * Official Google "G" logo as an inline SVG so we don't need an external sprite.
 */
export function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="#4285F4"
        d="M23.5 12.27c0-.78-.07-1.54-.2-2.27H12v4.51h6.44a5.45 5.45 0 0 1-2.36 3.57v2.94h3.79c2.23-2.05 3.63-5.08 3.63-8.75z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.07 7.94-2.91l-3.79-2.94c-1.05.71-2.4 1.13-4.15 1.13-3.19 0-5.89-2.15-6.86-5.05H1.23v3.03A12 12 0 0 0 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.14 14.23A7.14 7.14 0 0 1 4.77 12c0-.78.14-1.53.37-2.23V6.74H1.29a12 12 0 0 0 0 10.52l3.85-3.06z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.77 0 3.36.61 4.61 1.8l3.44-3.44A12 12 0 0 0 1.29 6.74l3.85 3.02C5.14 7.12 8.1 4.77 12 4.77z"
      />
    </svg>
  );
}