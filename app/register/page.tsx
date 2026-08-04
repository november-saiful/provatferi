'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();

  // Email registration is disabled — redirect to login for Google sign-in
  React.useEffect(() => {
    router.replace('/login');
  }, [router]);

  return null;
}
