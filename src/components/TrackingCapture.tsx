'use client';

import { useEffect } from 'react';
import { captureTrackingParams } from '@/lib/tracking';

export default function TrackingCapture() {
  useEffect(() => {
    captureTrackingParams();
  }, []);

  return null;
}
