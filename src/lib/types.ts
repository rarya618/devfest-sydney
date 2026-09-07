export type TalkFormat = 'talk' | 'lightning-talk' | 'workshop';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
export type Track = 'developer' | 'builder' | 'workshop' | 'showcase';
export type SubmissionStatus = 'pending' | 'accepted' | 'rejected' | 'archived';
export type SponsorTier = 'platinum' | 'gold' | 'silver' | 'community';
export type VolunteerArea = 'registration' | 'av-tech' | 'speaker-support' | 'workshop-facilitator' | 'general-floater' | 'setup-packdown' | 'photography' | 'social-media' | 'merch-table';
export type VolunteerStatus = 'pending' | 'accepted' | 'rejected' | 'archived';
// Empty string when the volunteer has not been on a GDG on Campus exec team.
export type GdgOnCampusChapter = '' | 'usyd' | 'uts' | 'other';
export type ShowcaseStage = 'idea' | 'prototype' | 'live';
export type ShowcaseStatus = 'pending' | 'accepted' | 'rejected' | 'archived';

export interface Sponsor {
  id: string;
  name: string;
  logoUrl: string;
  website: string;
  tier: SponsorTier;
  order: number;
}

export interface AdminUser {
  email: string;
  name: string;
  addedBy: string;
  addedAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  photoUrl: string;
  linkedinUrl: string;
  order: number;
}

export interface SubmissionTracking {
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string;
  utmTerm: string;
  ref: string;
}

export interface ReviewerNote {
  text: string;
  authorName: string;
  createdAt: string; // ISO date string (serialized from Firestore Timestamp)
}

export interface Submission {
  id: string;
  name: string;
  email: string;
  talkTitle: string;
  abstract: string;
  format: TalkFormat;
  track: Track;
  experienceLevel: ExperienceLevel;
  linkedinUrl: string;
  githubUrl: string;
  websiteUrl: string;
  speakerTagline: string;
  speakerBio: string;
  previousTalkLink: string;
  howDidYouHear: string;
  coSpeakerEmails: string;
  tracking: SubmissionTracking;
  accessibilityNeeds: string;
  requiresTravelSupport: boolean;
  travelSupportLocation: string;
  isGoogleDeveloperExpert: boolean;
  isFirstTimeSpeaker: boolean;
  wantsMentoring: boolean;
  hasSpokenAtGdgSydneyBefore: boolean;
  isOpenToAudienceQuestions: boolean;
  optOutOfRecording: boolean;
  submittedAt: string; // ISO date string (serialized from Firestore Timestamp)
  status: SubmissionStatus;
  reviewerNotes: ReviewerNote[];
  // All null until an admin sends the acceptance email from the dashboard. Accepting a
  // proposal and telling the speaker about it are deliberately separate steps.
  acceptanceEmailSentAt: string | null; // ISO date string
  acceptanceEmailSentBy: string;
  confirmByDate: string | null; // ISO date string; the speaker's deadline to confirm
  speakerConfirmedAt: string | null; // ISO date string; set from /speaker/confirm
}

export interface VolunteerSubmission {
  id: string;
  name: string;
  email: string;
  phone: string;
  motivation: string;
  areasOfInterest: VolunteerArea[];
  priorExperience: string;
  googleTechExperience: string;
  isTorrensStudentOrStaff: boolean;
  hasBeenGdgOnCampusExec: boolean;
  gdgOnCampusChapter: GdgOnCampusChapter;
  dietaryRequirements: string;
  tracking: SubmissionTracking;
  submittedAt: string; // ISO date string (serialized from Firestore Timestamp)
  status: VolunteerStatus;
  reviewerNotes: ReviewerNote[];
}

export interface CoPresenter {
  name: string;
  email: string;
}

export interface ShowcaseSubmission {
  id: string;
  name: string;
  email: string;
  projectName: string;
  pitch: string;
  description: string;
  stage: ShowcaseStage;
  demoUrl: string;
  repoUrl: string;
  linkedinUrl: string;
  builtWith: string;
  coPresenters: CoPresenter[];
  demoRequirements: string;
  isFirstTimePresenter: boolean;
  tracking: SubmissionTracking;
  submittedAt: string; // ISO date string (serialized from Firestore Timestamp)
  status: ShowcaseStatus;
  reviewerNotes: ReviewerNote[];
}

// Whether the speaker behind a promoted talk has actually been told and has confirmed.
// Derived from the source submission, since that is where the acceptance email is recorded.
export type SpeakerConfirmation = 'not-emailed' | 'awaiting' | 'confirmed' | 'unknown';

export interface Speaker {
  id: string;
  name: string;
  email: string;
  talkTitle: string;
  abstract: string;
  format: TalkFormat;
  track: Track;
  experienceLevel: ExperienceLevel;
  linkedinUrl: string;
  githubUrl: string;
  websiteUrl: string;
  bio: string;
  tagline: string;
  photoUrl: string;
  // Slugs this speaker's page used to live at, recorded when an admin renames them so the
  // old URL can redirect (see findCurrentSlugForPreviousSlug).
  previousSlugs: string[];
  submissionId: string;
  promotedAt: string; // ISO date string (serialized from Firestore Timestamp)
  confirmation: SpeakerConfirmation;
}

// What /speakers renders. Deliberately a subset of Speaker: no email, no submission id,
// nothing that only an organiser should see.
export interface PublicSpeaker {
  id: string;
  // URL segment for /speakers/<slug>, derived from the name (see toSpeakerSlug).
  slug: string;
  name: string;
  talkTitle: string;
  abstract: string;
  format: TalkFormat;
  track: Track;
  linkedinUrl: string;
  githubUrl: string;
  websiteUrl: string;
  bio: string;
  tagline: string;
  photoUrl: string;
  previousSlugs: string[];
}
