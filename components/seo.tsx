'use client';

import * as React from 'react';
import { SITE_NAME } from '@/lib/constants';

export function Seo({ title }: { title: string }) {
  React.useEffect(() => {
    document.title = title === SITE_NAME ? SITE_NAME : `${title} · ${SITE_NAME}`;
  }, [title]);
  return null;
}
