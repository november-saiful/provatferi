'use client';

import * as React from 'react';

export function Seo({ title }: { title: string }) {
  React.useEffect(() => {
    // The homepage passes the full site title (already starts with "প্রভাতফেরী");
    // every other page gets the "প্রভাতফেরীঃ " prefix, e.g. "প্রভাতফেরীঃ নোটিশ".
    document.title = title.startsWith('প্রভাতফেরী') ? title : `প্রভাতফেরীঃ ${title}`;
  }, [title]);
  return null;
}
