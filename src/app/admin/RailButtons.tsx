'use client';

// The buttons in a card's action rail (proposals in card view, volunteers, showcase, meetups),
// one family so the rail reads as one column: utilities (expand, More) as quiet 32px circles in
// a row along the top, actions below as full-width labelled pills, and a reversal (back to
// pending) as quiet text at the bottom. Replaced a stack of tinted icon circles whose colour was
// the only sign of what they did.

export const RAIL_CLASSES = 'flex flex-col items-stretch gap-2 shrink-0 self-start w-[8.75rem]';

const pillBase =
  'press inline-flex items-center justify-center w-full h-8 px-3 rounded-full text-sm font-bold whitespace-nowrap transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-google-blue focus-visible:ring-offset-2 focus-visible:ring-offset-surface';

/** An action that moves the record on: send, accept. Outline, so a page's one solid primary stays alone. */
export const RAIL_PILL_CLASSES = `${pillBase} border border-white/35 text-off-white hover:border-white`;

/** A step backwards (to pending): quiet text, never beside a send at full weight. */
export const RAIL_TEXT_BUTTON_CLASSES =
  'inline-flex items-center justify-center w-full h-8 px-2 rounded-full text-sm text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-google-blue';

export const RAIL_ICON_CLASSES =
  'press relative inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/[0.06] text-white/70 hover:bg-white/[0.1] hover:text-white transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-google-blue';

export function ExpandButton({ isOpen, onToggle, subject }: { isOpen: boolean; onToggle: () => void; subject: string }) {
  return (
    <button type="button" onClick={onToggle} aria-expanded={isOpen} aria-label={`${isOpen ? 'Collapse' : 'Expand'} details for: ${subject}`} className={RAIL_ICON_CLASSES}>
      <svg className={`w-3.5 h-3.5 transition-transform duration-200 ease-[var(--ease-settle)] ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6l4 4 4-4" />
      </svg>
    </button>
  );
}

export function MoreIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <circle cx="3" cy="8" r="1.25" />
      <circle cx="8" cy="8" r="1.25" />
      <circle cx="13" cy="8" r="1.25" />
    </svg>
  );
}
