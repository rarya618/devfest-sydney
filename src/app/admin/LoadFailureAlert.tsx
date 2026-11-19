'use client';

import { useState } from 'react';
import Alert from '@/components/Alert';

// A server page that couldn't read its data raises the bottom-left alert, which stays until it
// is dismissed. The page itself shows the quiet empty state beneath.
export default function LoadFailureAlert({ message }: { message: string }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return <Alert message={message} onDismiss={() => setDismissed(true)} />;
}
