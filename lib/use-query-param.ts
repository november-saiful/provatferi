'use client';

import * as React from 'react';

/** Reads a query parameter client-side. Avoids useSearchParams prerender issues in static export. */
export function useQueryParam(key: string): string | null {
  const [value, setValue] = React.useState<string | null>(null);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setValue(params.get(key));
  }, [key]);

  return value;
}
