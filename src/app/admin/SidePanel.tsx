'use client';

// The side panel the admin's tables open a record in: a full-height sheet against the right
// edge (the whole screen on a phone), on the shared <dialog> so focus is trapped, Escape and a
// click on the dimmed page close it, and focus goes back to the row. It holds the record's full
// card, with every action, note and history line the card view had.

import type { ReactNode } from 'react';
import AdminModal from './AdminModal';

interface SidePanelProps {
  /** The heading, and the panel's accessible name. */
  title: string;
  /** A short line under it: the person, the event. */
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
}

export default function SidePanel({ title, subtitle, onClose, children }: SidePanelProps) {
  return (
    <AdminModal label={title} onClose={onClose} variant="sheet" widthClass="sm:max-w-2xl" closeOnBackdrop>
      <div className="sticky top-0 z-10 flex items-start justify-between gap-4 px-5 sm:px-6 pt-5 pb-4 bg-black-02/95 backdrop-blur-sm border-b border-white/10">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-off-white leading-snug text-balance">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-white/70">{subtitle}</p>}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close the panel"
          className="press shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/[0.06] text-white/70 hover:bg-white/[0.12] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-google-blue"
        >
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M4.47 4.47a.75.75 0 0 1 1.06 0L8 6.94l2.47-2.47a.75.75 0 1 1 1.06 1.06L9.06 8l2.47 2.47a.75.75 0 1 1-1.06 1.06L8 9.06l-2.47 2.47a.75.75 0 0 1-1.06-1.06L6.94 8 4.47 5.53a.75.75 0 0 1 0-1.06z" />
          </svg>
        </button>
      </div>
      <div className="p-4 sm:p-6">{children}</div>
    </AdminModal>
  );
}
