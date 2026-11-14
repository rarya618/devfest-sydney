'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface AlertProps {
  message: string;
  onDismiss: () => void;
}

export default function Alert({ message, onDismiss }: AlertProps) {
  const [visible, setVisible] = useState(false);
  // The portal target only exists in the browser, and an alert can be in the server render
  // (SpeakersDashboard starts with one), so it appears after hydration.
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Trigger entrance animation
    const enterTimer = setTimeout(() => setVisible(true), 10);
    // Auto-dismiss after 8 seconds
    const dismissTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300);
    }, 8000);
    return () => {
      clearTimeout(enterTimer);
      clearTimeout(dismissTimer);
    };
  }, [onDismiss]);

  function handleDismiss() {
    setVisible(false);
    setTimeout(onDismiss, 300);
  }

  // Rendered into <body>: `fixed` is relative to the nearest transformed ancestor, and
  // animate-page-in leaves a transform on the page shells and the portal's panels, which would
  // otherwise pin the alert inside them instead of to the bottom-left of the screen.
  if (!isMounted) return null;
  return createPortal(
    <div
      role="alert"
      aria-live="assertive"
      className={`fixed bottom-6 left-6 z-50 flex items-start gap-3 max-w-sm w-full
        bg-surface-raised border border-google-red/40 rounded-xl px-4 py-3 shadow-xl
        transition-all duration-300
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
    >
      <div className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-google-red/20 flex items-center justify-center">
        <svg className="w-3 h-3 text-google-red-light" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
          <path d="M6 1a5 5 0 1 0 0 10A5 5 0 0 0 6 1zm0 7.5a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5zM5.25 4.5a.75.75 0 0 1 1.5 0v2a.75.75 0 0 1-1.5 0v-2z" />
        </svg>
      </div>
      <p className="text-sm text-white/80 leading-relaxed flex-1">{message}</p>
      <button
        onClick={handleDismiss}
        aria-label="Dismiss error"
        className="shrink-0 text-white/50 hover:text-white/60 transition-colors mt-0.5"
      >
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <path d="M4.47 4.47a.75.75 0 0 1 1.06 0L8 6.94l2.47-2.47a.75.75 0 1 1 1.06 1.06L9.06 8l2.47 2.47a.75.75 0 1 1-1.06 1.06L8 9.06l-2.47 2.47a.75.75 0 0 1-1.06-1.06L6.94 8 4.47 5.53a.75.75 0 0 1 0-1.06z" />
        </svg>
      </button>
    </div>,
    document.body
  );
}
