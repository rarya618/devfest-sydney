import type { PortalProposalStatus } from '@/lib/portalData';

// Browser-safe: shared by the speaker portal's forms and its server actions.

// The same limits the admin applies to a person's profile (validateProfileFields in
// src/app/admin/speakerActions.ts).
export const PORTAL_PROFILE_LIMITS = {
  tagline: 200,
  bio: 1000,
  link: 500,
} as const;

export interface PortalProfileFields {
  tagline: string;
  bio: string;
  linkedinUrl: string;
  githubUrl: string;
  websiteUrl: string;
}

export const PORTAL_PROFILE_FIELD_LABELS: Record<keyof PortalProfileFields, string> = {
  tagline: 'Tagline',
  bio: 'Bio',
  linkedinUrl: 'LinkedIn',
  githubUrl: 'GitHub',
  websiteUrl: 'Website',
};

export const PORTAL_STATUS_LABELS: Record<PortalProposalStatus, string> = {
  'under-review': 'Under review',
  accepted: 'Accepted: please confirm',
  confirmed: 'Confirmed',
  'not-selected': 'Not selected',
  closed: 'Closed',
};

export const PORTAL_STATUS_STYLES: Record<PortalProposalStatus, { text: string; dot: string }> = {
  'under-review': { text: 'text-google-yellow', dot: 'bg-google-yellow' },
  accepted: { text: 'text-google-blue-light', dot: 'bg-google-blue' },
  confirmed: { text: 'text-google-green', dot: 'bg-google-green' },
  'not-selected': { text: 'text-white/60', dot: 'bg-white/60' },
  closed: { text: 'text-white/60', dot: 'bg-white/60' },
};
