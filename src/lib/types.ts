export type TalkFormat = 'talk' | 'lightning-talk' | 'workshop';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
export type Track = 'developer' | 'builder' | 'workshop' | 'showcase';
export type SubmissionStatus = 'pending' | 'accepted' | 'rejected';
export type SponsorTier = 'platinum' | 'gold' | 'silver' | 'community';

export interface Sponsor {
  id: string;
  name: string;
  logoUrl: string;
  website: string;
  tier: SponsorTier;
  order: number;
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
}
