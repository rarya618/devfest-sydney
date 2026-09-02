import type { ShowcaseStage, ShowcaseStatus } from '@/lib/types';

export const SHOWCASE_STATUS_DOT_STYLES: Record<ShowcaseStatus, { text: string; dot: string }> = {
  pending: { text: 'text-google-yellow', dot: 'bg-google-yellow' },
  accepted: { text: 'text-google-green', dot: 'bg-google-green' },
  rejected: { text: 'text-white/40', dot: 'bg-white/40' },
  archived: { text: 'text-white/30', dot: 'bg-white/30' },
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
