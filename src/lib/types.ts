export type TalkFormat = 'talk' | 'lightning-talk' | 'workshop';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
export type Track = 'developer' | 'builder' | 'workshop' | 'showcase';
export type SubmissionStatus = 'pending' | 'accepted' | 'rejected' | 'archived';
export type SponsorTier = 'platinum' | 'gold' | 'silver' | 'community';
export type VolunteerArea = 'registration' | 'av-tech' | 'speaker-support' | 'workshop-facilitator' | 'general-floater' | 'setup-packdown' | 'photography' | 'social-media' | 'merch-table';
export type VolunteerStatus = 'pending' | 'accepted' | 'rejected' | 'archived';
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
