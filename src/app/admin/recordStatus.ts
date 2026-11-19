// Where a record stands, in one vocabulary and one set of colours for every admin page and view
// (table row, card, side panel), drawn with StatusLabel (Chips.tsx). Before this, the same speaker
// read green "Accepted" on Talk proposals and yellow "Not emailed" on Speakers, and a card showed
// a status dot and a tinted chip side by side.
//
// The colours follow the portal: yellow when an organiser has something to do (decide, or tell
// them), green when they're in or the next move is theirs, white when it's over.

import type { RejectionEmailBlocker } from '@/lib/rejectionEligibility';
import type { Submission } from '@/lib/types';
import type { StatusTone } from './Chips';

export interface RecordStatus {
  tone: StatusTone;
  label: string;
  /** A hover note with the date or the reason. */
  title?: string;
}

type Confirmation = 'not-emailed' | 'awaiting' | 'confirmed' | 'unknown';

/** Accepted, told or not, confirmed or not: the same words wherever an acceptance shows. */
export function acceptedStatus(confirmation: Confirmation): RecordStatus {
  switch (confirmation) {
    case 'not-emailed':
      return { tone: 'waiting', label: 'Accepted, not emailed', title: 'Accepted, but they haven\'t been told yet.' };
    case 'awaiting':
      return { tone: 'good', label: 'Awaiting confirmation', title: 'Told, and waiting for them to confirm.' };
    case 'confirmed':
      return { tone: 'good', label: 'Confirmed' };
    default:
      return { tone: 'done', label: 'Unknown', title: 'Their proposal couldn\'t be found, so whether they were told isn\'t known.' };
  }
}

/** A volunteer signup, showcase entry or meetup proposal: no rejection email is tracked. */
export function decisionStatus(status: 'pending' | 'accepted' | 'rejected' | 'archived', confirmation: Confirmation): RecordStatus {
  if (status === 'pending') return { tone: 'waiting', label: 'Pending' };
  if (status === 'rejected') return { tone: 'done', label: 'Not selected' };
  if (status === 'archived') return { tone: 'done', label: 'Archived' };
  return acceptedStatus(confirmation);
}

/** A DevFest talk proposal, which also tracks the rejection email and the speaker ticket. */
export function proposalStatus(submission: Submission, rejectionBlocker: RejectionEmailBlocker | null): RecordStatus {
  if (submission.status === 'pending') return { tone: 'waiting', label: 'Pending' };
  if (submission.status === 'archived') return { tone: 'done', label: 'Archived' };
  if (submission.status === 'rejected') {
    if (submission.rejectionEmailSentAt) return { tone: 'done', label: 'Not selected, emailed' };
    if (rejectionBlocker === 'accepted-proposal') {
      return { tone: 'done', label: 'Not selected, speaking', title: 'Another of their proposals was accepted, so they don\'t get a rejection email.' };
    }
    if (rejectionBlocker === 'pending-proposal') {
      return { tone: 'waiting', label: 'Not selected, other pending', title: 'Another of their proposals is still pending. Decide it first so they get one email.' };
    }
    return { tone: 'waiting', label: 'Not selected, not emailed' };
  }
  if (submission.speakerTicketEmailSentAt) return { tone: 'good', label: 'Ticket sent' };
  if (submission.speakerConfirmedAt) return acceptedStatus('confirmed');
  if (submission.acceptanceEmailSentAt) return acceptedStatus('awaiting');
  return acceptedStatus('not-emailed');
}
