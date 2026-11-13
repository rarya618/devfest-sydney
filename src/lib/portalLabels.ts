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

// A talk a speaker keeps in the portal to propose later, possibly more than once.
export const SAVED_TALK_LIMITS = {
  talkTitle: 200,
  abstract: 2000,
  audience: 1000,
} as const;

// Plenty for real use; stops the collection being used as free storage.
export const MAX_SAVED_TALKS = 50;

export interface SavedTalkFields {
  talkTitle: string;
  abstract: string;
  audience: string;
}

// Shared by the editor and the server, so the messages match. Only the title is required:
// a saved talk can be a half-formed idea.
export function findSavedTalkError(fields: SavedTalkFields): string | null {
  if (!fields.talkTitle.trim()) return 'Please give your talk a title.';
  for (const key of ['talkTitle', 'abstract', 'audience'] as const) {
    if (fields[key].trim().length > SAVED_TALK_LIMITS[key]) {
      const label = { talkTitle: 'title', abstract: 'abstract', audience: 'audience' }[key];
      return `The ${label} can be up to ${SAVED_TALK_LIMITS[key]} characters.`;
    }
  }
  return null;
}
