'use client';

// The decision on a pending card: "Accept" and "Not this time", as labelled pills rather than
// the unlabelled tick and cross they replace (stacked, same grey, 1px apart). Both ask first
// through ConfirmAction, since neither sends anything and a misplaced click would otherwise
// flip a decision silently; accepting a DevFest proposal also creates a talk and a person.
//
// `acceptTrigger` lets a page keep its own Accept step (a meetup talk opens an event chooser,
// which is already a deliberate second step) while sharing the look.

import type { ReactNode } from 'react';
import ConfirmAction, { type ConfirmTriggerProps } from './ConfirmAction';

interface DecisionCopy {
  message: string;
  detail: string;
}

interface DecisionButtonsProps {
  /** Who or what is being decided on, for the buttons' accessible names. */
  subject: string;
  /** Omitted when `acceptTrigger` supplies the page's own Accept step. */
  accept?: DecisionCopy & { onConfirm: () => void };
  reject: DecisionCopy & { onConfirm: () => void };
  disabled: boolean;
  /** Replaces the Accept button and its confirmation with the page's own control. */
  acceptTrigger?: (buttonClassName: string) => ReactNode;
  /** `column` in a card's action rail (Accept on top); `row` in a list row (Accept on the right). */
  layout?: 'column' | 'row';
  className?: string;
}

const pillBase =
  'press inline-flex items-center justify-center gap-1.5 w-full h-8 px-3.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:opacity-50 disabled:cursor-not-allowed';
export const ACCEPT_PILL_CLASSES = `${pillBase} bg-google-green-deep text-white hover:opacity-85 focus-visible:ring-google-blue`;
const REJECT_PILL_CLASSES = `${pillBase} border border-white/35 text-off-white hover:border-white focus-visible:ring-google-blue`;

export default function DecisionButtons({ subject, accept, reject, disabled, acceptTrigger, layout = 'column', className = '' }: DecisionButtonsProps) {
  return (
    <div
      role="group"
      aria-label={`Decide on ${subject}`}
      className={`${layout === 'row' ? 'flex-row-reverse items-center [&>*]:min-w-[7.5rem]' : 'flex-col items-stretch'} flex gap-2 ${className}`}
    >
      {acceptTrigger ? (
        acceptTrigger(ACCEPT_PILL_CLASSES)
      ) : accept && (
        <ConfirmAction tone="accept" message={accept.message} detail={accept.detail} confirmLabel="Accept" onConfirm={accept.onConfirm} className="flex">
          {(triggerProps: ConfirmTriggerProps) => (
            <button {...triggerProps} type="button" disabled={disabled} aria-label={`Accept ${subject}`} className={ACCEPT_PILL_CLASSES}>
              Accept
            </button>
          )}
        </ConfirmAction>
      )}
      <ConfirmAction tone="danger" message={reject.message} detail={reject.detail} confirmLabel="Not this time" onConfirm={reject.onConfirm} className="flex">
        {(triggerProps: ConfirmTriggerProps) => (
          <button {...triggerProps} type="button" disabled={disabled} aria-label={`Not this time: ${subject}`} className={REJECT_PILL_CLASSES}>
            Not this time
          </button>
        )}
      </ConfirmAction>
    </div>
  );
}
