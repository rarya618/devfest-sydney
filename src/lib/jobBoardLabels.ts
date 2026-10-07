import type { JobBoardStatus, JobType, WorkArrangement } from '@/lib/types';

// Browser-safe: no Admin SDK, so the forms and the admin dashboard can both import it.

export const JOB_TYPE_LABELS: Record<JobType, string> = {
  'full-time': 'Full-time',
  'part-time': 'Part-time',
  contract: 'Contract',
  internship: 'Internship',
  graduate: 'Graduate',
};

export const WORK_ARRANGEMENT_LABELS: Record<WorkArrangement, string> = {
  'on-site': 'On-site',
  hybrid: 'Hybrid',
  remote: 'Remote',
};

export const JOB_BOARD_STATUS_LABELS: Record<JobBoardStatus, string> = {
  pending: 'Pending',
  approved: 'On the board',
  rejected: 'Rejected',
  archived: 'Archived',
};

export const JOB_BOARD_STATUS_DOT_STYLES: Record<JobBoardStatus, { text: string; dot: string }> = {
  pending: { text: 'text-google-yellow', dot: 'bg-google-yellow' },
  approved: { text: 'text-google-green', dot: 'bg-google-green' },
  rejected: { text: 'text-white/55', dot: 'bg-white/55' },
  archived: { text: 'text-white/50', dot: 'bg-white/50' },
};

export const JOB_TYPES = Object.keys(JOB_TYPE_LABELS) as JobType[];
export const WORK_ARRANGEMENTS = Object.keys(WORK_ARRANGEMENT_LABELS) as WorkArrangement[];

// Shared by the forms, the API routes and the admin actions, so a limit can't drift
// between the client check and the server one.
export const JOB_LIMITS = {
  companyName: 120,
  contactName: 100,
  roleTitle: 120,
  location: 100,
  description: 1500,
  howToApply: 500,
  name: 100,
  headline: 120,
  about: 1000,
  lookingFor: 300,
  url: 500,
} as const;

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
