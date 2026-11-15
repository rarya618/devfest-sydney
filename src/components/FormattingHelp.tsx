'use client';

import { useEffect, useRef, useState } from 'react';
import { formattingPrompt } from '@/lib/formattingPrompt';

// The row under a text box that MarkdownText renders:
//   "Formatting": a tooltip with the formatting MarkdownText understands. It shows on hover
//     where there is hover (Tailwind's hover variants only apply there), and a click or tap pins
//     it open; Escape or a click outside closes it. Give the textarea aria-describedby={id}, so
//     screen readers hear the guide on the box without opening it.
//   "Copy a prompt…": copies a prompt asking the speaker's own AI tool to put the box's text
//     into that formatting.
// The prompt is in src/lib/formattingPrompt.ts. The speak page on gdgsydney.com
// (src/components/FormattingHelp.astro there) has the same tooltip, so keep the two worded alike.

const IDLE = 'Copy a prompt to format this with your AI tool';

// The admin modals' hints are a shade lighter than the portal's.
const TRIGGER_TONES = {
  portal: 'text-white/50 hover:text-white/75',
  admin: 'text-white/60 hover:text-white/85',
};

export default function FormattingHelp({
  id,
  label,
  value,
  tone = 'portal',
}: {
  /** The tooltip's id: point the textarea's aria-describedby at it. */
  id: string;
  /** What the box holds, as the copied prompt names it ("talk abstract"). */
  label: string;
  value: string;
  tone?: keyof typeof TRIGGER_TONES;
}) {
  const [status, setStatus] = useState(IDLE);
  const [isOpen, setIsOpen] = useState(false);
  const tipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const resetTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(resetTimer.current), []);

  // Closes the pinned tooltip on an outside click or Escape, as the admin popovers do.
  useEffect(() => {
    if (!isOpen) return;
    function handlePointerDown(event: MouseEvent) {
      if (tipRef.current && !tipRef.current.contains(event.target as Node)) setIsOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      setIsOpen(false);
      if (tipRef.current?.contains(document.activeElement)) triggerRef.current?.focus();
    }
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const copy = async () => {
    let copied = false;
    try {
      await navigator.clipboard.writeText(formattingPrompt(label, value));
      copied = true;
    } catch {
      // A browser without clipboard access for this page.
    }
    setStatus(copied ? 'Copied. Paste it into your AI tool, then paste its answer back here.' : "Couldn't copy. Your browser blocked the clipboard.");
    window.clearTimeout(resetTimer.current);
    resetTimer.current = window.setTimeout(() => setStatus(IDLE), 4000);
  };

  const code = 'font-mono text-[0.95em] text-white/90 rounded bg-white/[0.08] px-1 py-px';

  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-x-5 gap-y-1">
      <div ref={tipRef} className="group relative">
        <button
          ref={triggerRef}
          type="button"
          aria-expanded={isOpen}
          aria-controls={id}
          onClick={() => setIsOpen((open) => !open)}
          className={`inline-flex items-center gap-1.5 text-xs underline decoration-dotted underline-offset-[3px] cursor-help rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-google-blue-light ${isOpen ? 'text-white/85' : TRIGGER_TONES[tone]}`}
        >
          <svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13" aria-hidden="true" className="shrink-0">
            <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" clipRule="evenodd" />
          </svg>
          Formatting
        </button>
        {/* Below the trigger, over the next field's label rather than this box's own text. The
            after: strip keeps the hover alive across the gap. */}
        <div
          id={id}
          className={`absolute left-0 top-[calc(100%+8px)] z-30 w-max max-w-[min(22rem,calc(100vw-32px))] rounded-lg border border-white/15 bg-[#303030] px-3.5 py-3 text-xs leading-relaxed text-white/70 shadow-[0_10px_30px_rgba(0,0,0,0.45)] transition duration-100 motion-reduce:transition-none after:absolute after:inset-x-0 after:bottom-full after:h-2.5 after:content-[''] ${
            isOpen ? 'visible opacity-100 translate-y-0' : 'invisible opacity-0 -translate-y-1 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0'
          }`}
        >
          <p className="font-bold text-white/90 mb-1.5">Formatting you can use</p>
          <ul className="space-y-1">
            <li><code className={code}>## Heading</code> at the start of a line for a heading</li>
            <li><code className={code}>- item</code> at the start of a line for a bullet point</li>
            <li><code className={code}>**words**</code> for <strong className="font-bold text-white/90">bold</strong></li>
            <li><code className={code}>[text](https://…)</code> for a link</li>
          </ul>
        </div>
      </div>
      <button
        type="button"
        onClick={copy}
        className="inline-flex items-center gap-1.5 text-left text-xs font-medium text-google-blue-light hover:underline underline-offset-2 rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-google-blue-light"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13" aria-hidden="true" className="shrink-0">
          <path d="M7 3.5A1.5 1.5 0 0 1 8.5 2h3.879a1.5 1.5 0 0 1 1.06.44l3.122 3.12A1.5 1.5 0 0 1 17 6.622V12.5a1.5 1.5 0 0 1-1.5 1.5h-1v-3.379a3 3 0 0 0-.879-2.121L10.5 5.379A3 3 0 0 0 8.379 4.5H7v-1Z" />
          <path d="M4.5 6A1.5 1.5 0 0 0 3 7.5v9A1.5 1.5 0 0 0 4.5 18h7a1.5 1.5 0 0 0 1.5-1.5v-5.879a1.5 1.5 0 0 0-.44-1.06L9.44 6.439A1.5 1.5 0 0 0 8.378 6H4.5Z" />
        </svg>
        <span aria-live="polite">{status}</span>
      </button>
    </div>
  );
}
