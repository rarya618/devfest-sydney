// The admin's chips and status, matching the speaker portal (DESIGN.md, Chips and the Status
// Colour Rule) instead of the tinted 10 and 11px pills they replace, whose green text on its
// own green tint measured 3.9:1 on a card.
//
// - Chip: a fact about the record (a track, a format, "GDE", "First-time speaker"). A 6% white
//   pill, Google Sans Mono 12px at white 70%, with an optional 6px dot (a track's colour).
//   Never carries status, so it never needs a colour of its own.
// - StatusLabel: where the record stands, once per row: a dot and a Bold 12px word in the
//   state's colour, on no tint. Green 4.8:1 and yellow 7.6:1 on a #282828 card.

import type { ReactNode } from 'react';

interface ChipProps {
  children: ReactNode;
  /** Tailwind background class for a 6px dot, e.g. a track's `bg-google-red`. */
  dotClass?: string;
  /** A hover note explaining it, when the words alone are short. */
  title?: string;
  /** Marks a fact that needs acting on (a missing photo, travel support): yellow text. */
  tone?: 'neutral' | 'attention';
}

export function Chip({ children, dotClass, title, tone = 'neutral' }: ChipProps) {
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-2.5 py-1 font-mono text-xs leading-none whitespace-nowrap ${
        tone === 'attention' ? 'text-google-yellow' : 'text-white/70'
      }`}
    >
      {dotClass && <span aria-hidden="true" className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotClass}`} />}
      {children}
    </span>
  );
}

/** The portal's states: green for in or waiting on them, yellow for being read or needing a
 *  send, white for over, red-light for something that went wrong. */
export type StatusTone = 'good' | 'waiting' | 'done' | 'problem';

const STATUS_TONES: Record<StatusTone, { text: string; dot: string }> = {
  good: { text: 'text-google-green', dot: 'bg-google-green' },
  waiting: { text: 'text-google-yellow', dot: 'bg-google-yellow' },
  done: { text: 'text-white/60', dot: 'bg-white/40' },
  problem: { text: 'text-google-red-light', dot: 'bg-google-red-light' },
};

export function StatusLabel({ tone, children, title }: { tone: StatusTone; children: ReactNode; title?: string }) {
  const colours = STATUS_TONES[tone];
  return (
    <span title={title} className={`inline-flex items-center gap-1.5 text-xs font-bold leading-none whitespace-nowrap ${colours.text}`}>
      <span aria-hidden="true" className={`h-1.5 w-1.5 shrink-0 rounded-full ${colours.dot}`} />
      {children}
    </span>
  );
}
