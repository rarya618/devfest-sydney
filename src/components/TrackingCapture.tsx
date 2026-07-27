'use client';

import { Suspense, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { captureTrackingParams } from '@/lib/tracking';

function TrackingCaptureInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Re-run on every client-side navigation, not just the first page load, so a
  // ref param picked up mid-visit (e.g. clicking the CfS banner) still gets
  // attributed. captureTrackingParams() is first-touch, so this is a no-op once
  // something is already stored.
  useEffect(() => {
    captureTrackingParams();
  }, [pathname, searchParams]);

  return null;
}

export default function TrackingCapture() {
  return (
    <Suspense fallback={null}>
      <TrackingCaptureInner />
    </Suspense>
  );
}
