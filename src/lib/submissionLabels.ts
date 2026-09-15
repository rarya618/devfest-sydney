import type { SubmissionStatus, Track, TalkFormat, ExperienceLevel } from '@/lib/types';

export const STATUS_DOT_STYLES: Record<SubmissionStatus, { text: string; dot: string }> = {
  pending: { text: 'text-google-yellow', dot: 'bg-google-yellow' },
  accepted: { text: 'text-google-green', dot: 'bg-google-green' },
  rejected: { text: 'text-white/55', dot: 'bg-white/55' },
  archived: { text: 'text-white/50', dot: 'bg-white/50' },
};

export const STATUS_LABELS: Record<SubmissionStatus, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  rejected: 'Rejected',
  archived: 'Archived',
};

export const TRACK_LABELS: Record<Track, string> = {
  developer: 'Developer',
  builder: 'Builder',
  workshop: 'Workshops',
  showcase: 'Showcase',
};

export const TRACK_COLORS: Record<Track, string> = {
  developer: 'text-google-blue',
  builder: 'text-google-green',
  workshop: 'text-google-yellow',
  showcase: 'text-google-yellow',
};

// The admin track chips put the same label on a tinted pill sitting on an already-lifted
// card, which costs the core blue enough to drop it to 4.5:1 at 11px. Blue 300 is the
// on-tint variant and clears it at 7.7:1. Green and yellow are unaffected, so they stay
// on the core colours and the public speaker page keeps reading TRACK_COLORS as before.
export const TRACK_CHIP_COLORS: Record<Track, string> = {
  ...TRACK_COLORS,
  developer: 'text-google-blue-light',
};

export const TRACK_BORDER_COLORS: Record<Track, string> = {
  developer: 'border-l-google-blue',
  builder: 'border-l-google-green',
  workshop: 'border-l-google-yellow',
  showcase: 'border-l-google-yellow',
};

export const TRACK_DOT_COLORS: Record<Track, string> = {
  developer: 'bg-google-blue',
  builder: 'bg-google-green',
  workshop: 'bg-google-yellow',
  showcase: 'bg-google-yellow',
};

export const FORMAT_LABELS: Record<TalkFormat, string> = {
  talk: 'Talk',
  'lightning-talk': 'Lightning',
  workshop: 'Workshop',
};

export const EXPERIENCE_LABELS: Record<ExperienceLevel, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};
