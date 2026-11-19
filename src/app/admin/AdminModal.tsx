'use client';

// The admin's one modal, on the native <dialog> opened with showModal(): the browser traps
// focus inside it, makes the page behind it inert, closes it on Escape and puts focus back
// where it was. It replaced eleven hand-built `fixed inset-0` overlays that had aria-modal
// but no focus trap, so Tab walked out behind them.
//
// It sits in the top layer, above the sidebar and every z-index, so nothing needs a portal.
// The Alert and the Select's list open in the top layer after it, so they stay on top.

import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

interface AdminModalProps {
  /** The dialog's accessible name. */
  label: string;
  onClose: () => void;
  /** While a save is running, Escape does nothing rather than drop the form mid-write. */
  isBusy?: boolean;
  /** Tailwind max-width for the panel, e.g. `max-w-xl`. */
  widthClass?: string;
  /** `bare` drops the panel's fill and edge, for content that brings its own (the speaker card
   *  preview). `sheet` is the side panel (SidePanel.tsx): full height against the right edge. */
  variant?: 'panel' | 'bare' | 'sheet';
  /** A click on the backdrop closes it too. Off for forms, where it would lose what was typed. */
  closeOnBackdrop?: boolean;
  children: ReactNode;
}

export default function AdminModal({ label, onClose, isBusy = false, widthClass = 'max-w-xl', variant = 'panel', closeOnBackdrop = false, children }: AdminModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // One Escape closes one layer. Chrome closes stacked dialogs (a modal opened from a side panel)
  // together on Escape, so the browser's own handling is stopped and only the topmost dialog
  // closes. A confirmation open inside it (ConfirmAction) closes itself first.
  const onCloseRef = useRef(onClose);
  const isBusyRef = useRef(isBusy);
  useEffect(() => {
    onCloseRef.current = onClose;
    isBusyRef.current = isBusy;
  });
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      const openDialogs = document.querySelectorAll('dialog[open]');
      const dialog = dialogRef.current;
      if (!dialog || openDialogs[openDialogs.length - 1] !== dialog) return;
      event.preventDefault();
      if (dialog.querySelector('[role="alertdialog"]')) return;
      if (!isBusyRef.current) onCloseRef.current();
    }
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    // React removes the dialog before the browser can hand focus back, so do it here.
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (dialog && !dialog.open) dialog.showModal();
    return () => {
      if (dialog?.open) dialog.close();
      if (opener?.isConnected) opener.focus();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-label={label}
      // Escape: the browser would close the dialog itself; the parent owns that, so it decides.
      // Escape is handled in the effect below; this only stops the browser closing it on its own.
      onCancel={(event) => event.preventDefault()}
      // The backdrop belongs to the <dialog> itself, so a click on it targets the dialog.
      onClick={(event) => {
        if (closeOnBackdrop && !isBusy && event.target === event.currentTarget) onClose();
      }}
      className={
        variant === 'sheet'
          ? `sheet-panel fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-none w-full ${widthClass} overflow-y-auto overscroll-contain p-0 text-off-white
             bg-black-02 border-l border-white/10 sm:rounded-l-3xl shadow-[0_0_64px_rgba(0,0,0,0.6)] backdrop:bg-black/50`
          : `modal-panel w-[calc(100%-2rem)] ${widthClass} max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain m-auto p-0 text-off-white backdrop:bg-black/70
             ${variant === 'panel' ? 'bg-surface-raised rounded-3xl border border-white/10 shadow-[0_24px_64px_rgba(0,0,0,0.55)]' : 'bg-transparent'}`
      }
    >
      {children}
    </dialog>
  );
}
