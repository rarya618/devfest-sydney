import type { ShowcaseConfirmation, ShowcaseStage, ShowcaseStatus } from '@/lib/types';

export const SHOWCASE_STATUS_DOT_STYLES: Record<ShowcaseStatus, { text: string; dot: string }> = {
  pending: { text: 'text-google-yellow', dot: 'bg-google-yellow' },
  accepted: { text: 'text-google-green', dot: 'bg-google-green' },
  rejected: { text: 'text-white/55', dot: 'bg-white/55' },
  archived: { text: 'text-white/50', dot: 'bg-white/50' },
};

export const SHOWCASE_STATUS_LABELS: Record<ShowcaseStatus, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  rejected: 'Rejected',
  archived: 'Archived',
};

export const SHOWCASE_STAGE_LABELS: Record<ShowcaseStage, string> = {
  idea: 'Idea or concept',
  prototype: 'Working prototype',
  live: 'Live and in use',
};

export const SHOWCASE_CONFIRMATION_CHIPS: Record<ShowcaseConfirmation, { label: string; className: string; title: string }> = {
  confirmed: {
    label: 'Confirmed',
    className: 'bg-google-green/15 text-google-green',
    title: 'The entrant has confirmed they will present.',
  },
  awaiting: {
    label: 'Awaiting confirmation',
    className: 'bg-white/10 text-white/60',
    title: 'The acceptance email has been sent but the entrant has not confirmed yet.',
  },
  'not-emailed': {
    label: 'Not emailed',
    className: 'bg-google-yellow/15 text-google-yellow',
    title: 'This entrant has not been told yet. Send the acceptance email with the envelope button.',
  },
};
