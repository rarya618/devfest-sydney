'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  intervalSeconds: number;
}

// The job board collections hold private emails, so clients can't listen to them in
// Firestore. Re-rendering the server component on a timer is the next best thing: a role
// approved in /admin/jobs appears on the screen within one interval, with no reload flash.
export default function AutoRefresh({ intervalSeconds }: Props) {
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => router.refresh(), intervalSeconds * 1000);
    return () => clearInterval(timer);
  }, [router, intervalSeconds]);

  return null;
}
