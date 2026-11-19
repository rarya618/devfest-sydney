'use client';

// Asks before an admin action that emails someone or can't be taken back. Every send and
// every destructive card action goes through it: on 2026-11-19 a misplaced click on a
// proposal card's Undo acceptance deleted a confirmed speaker's talk, and the envelope and
// ticket buttons beside it would have emailed a speaker just as readily.
//
// The trigger is the caller's own button (a render prop, so the icon rails keep their look);
// pressing it opens a small panel under it that says what will happen, with Cancel focused
// first so Enter or a second stray click can't confirm. Escape, Cancel or a click elsewhere
// closes it and puts focus back on the trigger.

import { useEffect, useId, useRef, useState } from 'react';
import type { ReactNode, RefObject } from 'react';

export interface ConfirmTriggerProps {
  ref: RefObject<HTMLButtonElement | null>;
  onClick: () => void;
  'aria-haspopup': 'dialog';
  'aria-expanded': boolean;
}

interface ConfirmActionProps {
  /** The question, naming who it affects: "Send the acceptance email to Yash Mehta?" */
  message: string;
  /** What follows, in a sentence: "They get a link to confirm their spot." */
  detail?: string;
  /** The confirm button's words: "Send email", "Undo acceptance". */
  confirmLabel: string;
  /** `send` for an email (Blue 700), `accept` for a decision in someone's favour (Green 700),
   *  `danger` for something that deletes or turns someone down (Red 600). */
  tone: 'send' | 'accept' | 'danger';
  onConfirm: () => void;
  /** Which side of the trigger the panel lines up with. */
  align?: 'left' | 'right';
  /** Classes for the wrapper, e.g. `hidden md:inline-flex` when the trigger is desktop-only. */
  className?: string;
  children: (triggerProps: ConfirmTriggerProps) => ReactNode;
}

export default function ConfirmAction({
  message,
  detail,
  confirmLabel,
  tone,
  onConfirm,
  align = 'right',
  className = 'inline-flex',
  children,
}: ConfirmActionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const messageId = useId();
  const detailId = useId();

  function close({ returnFocus }: { returnFocus: boolean }) {
    setIsOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }

  useEffect(() => {
    if (!isOpen) return;
    cancelRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      // Only this panel closes, not a modal or menu it sits in.
      event.stopPropagation();
      close({ returnFocus: true });
    }
    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      close({ returnFocus: false });
    }
    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [isOpen]);

  const confirmClasses = {
    send: 'bg-google-blue-deep focus-visible:ring-google-blue',
    accept: 'bg-google-green-deep focus-visible:ring-google-blue',
    danger: 'bg-google-red-deep focus-visible:ring-google-red-light',
  }[tone];

  return (
    <div className={`relative ${className}`}>
      {children({
        ref: triggerRef,
        onClick: () => setIsOpen((open) => !open),
        'aria-haspopup': 'dialog',
        'aria-expanded': isOpen,
      })}

      {isOpen && (
        <div
          ref={panelRef}
          role="alertdialog"
          aria-labelledby={messageId}
          aria-describedby={detail ? detailId : undefined}
          // Keeps clicks inside the panel from reaching a clickable card behind it.
          onClick={(event) => event.stopPropagation()}
          className={`confirm-panel absolute top-full mt-2 z-30 w-72 max-w-[calc(100vw-2rem)] ${align === 'right' ? 'right-0' : 'left-0'}
            bg-surface-raised border border-white/10 rounded-2xl p-4 shadow-[0_12px_32px_rgba(0,0,0,0.45)] text-left`}
        >
          <p id={messageId} className="text-sm font-bold text-off-white leading-snug">{message}</p>
          {detail && <p id={detailId} className="mt-1.5 text-sm text-white/70 leading-relaxed">{detail}</p>}
          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              ref={cancelRef}
              type="button"
              onClick={() => close({ returnFocus: true })}
              className="press px-4 py-1.5 rounded-full border border-white/35 text-sm font-bold text-off-white hover:border-white focus:outline-none focus-visible:ring-2 focus-visible:ring-google-blue focus-visible:ring-offset-2 focus-visible:ring-offset-surface-raised"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                close({ returnFocus: true });
                onConfirm();
              }}
              className={`press px-4 py-1.5 rounded-full text-sm font-bold text-white hover:opacity-85 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-raised ${confirmClasses}`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
