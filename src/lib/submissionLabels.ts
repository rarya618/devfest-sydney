import type { SubmissionStatus, Track, TalkFormat, ExperienceLevel } from '@/lib/types';

export const STATUS_DOT_STYLES: Record<SubmissionStatus, { text: string; dot: string }> = {
  pending: { text: 'text-google-yellow', dot: 'bg-google-yellow' },
  accepted: { text: 'text-google-green', dot: 'bg-google-green' },
  rejected: { text: 'text-black-02/40', dot: 'bg-black-02/30' },
};

export const STATUS_LABELS: Record<SubmissionStatus, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  rejected: 'Rejected',
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
