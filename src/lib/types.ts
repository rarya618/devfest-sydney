export type TalkFormat = 'talk' | 'lightning-talk' | 'workshop';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
// Spotlight is the Auditorium's track. Nobody proposes into it (the CfS offers only the
// first three); an organiser moves a speaker onto it from /admin/speakers.
export type Track = 'spotlight' | 'developer' | 'builder' | 'workshop' | 'showcase';
export type SubmissionStatus = 'pending' | 'accepted' | 'rejected' | 'archived';
export type SponsorTier = 'platinum' | 'gold' | 'silver' | 'community';
export type VolunteerArea = 'registration' | 'av-tech' | 'speaker-support' | 'workshop-facilitator' | 'mc' | 'general-floater' | 'setup-packdown' | 'photography' | 'social-media' | 'merch-table';
export type VolunteerStatus = 'pending' | 'accepted' | 'rejected' | 'archived';
// The part of the day a crew member is rostered for. Empty until an admin assigns one:
// the signup form never asked, so an unset shift is the normal starting state.
export type VolunteerShift = '' | 'full-day' | 'morning' | 'afternoon';
// Whether an accepted volunteer has been told and has answered. The volunteer document
// holds the whole flow, so unlike SpeakerConfirmation there is no 'unknown': there is no
// second document that could be missing.
export type VolunteerConfirmation = 'not-emailed' | 'awaiting' | 'confirmed';
// Empty string when the volunteer has not been on a GDG on Campus exec team.
export type GdgOnCampusChapter = '' | 'usyd' | 'uts' | 'other';
export type ShowcaseStage = 'idea' | 'prototype' | 'live';
export type ShowcaseStatus = 'pending' | 'accepted' | 'rejected' | 'archived';

// Shape shared by sponsors and community partners: what a card or logo on /partners needs.
export interface PartnerOrganisation {
  id: string;
  name: string;
  logoUrl: string;
  website: string;
  order: number;
  // Optional short blurb; with one, /partners renders a card instead of a bare logo
  description?: string;
}

// Paid or in-kind sponsors, in the `sponsors` collection, listed by tier
export interface Sponsor extends PartnerOrganisation {
  tier: SponsorTier;
  // Set on a sponsor that is agreed but not yet ready to announce; kept off every page
  hidden?: boolean;
}

// Community partners (meetups, student groups, other developer communities) that promote
// DevFest to their members in a reciprocal, unpaid arrangement. `partners` collection.
export type CommunityPartner = PartnerOrganisation;

export interface AdminUser {
  email: string;
  name: string;
  addedBy: string;
  addedAt: string;
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
  // The complimentary speaker ticket, sent from the admin after the speaker confirms.
  // Null until an admin sends it; a separate step again, so a confirmed speaker can be
  // held back while their slot is still being worked out.
  speakerTicketEmailSentAt: string | null; // ISO date string
  speakerTicketEmailSentBy: string;
  // Null until an admin sends the rejection email. Rejecting a proposal never mails the
  // speaker on its own, for the same reason acceptance doesn't.
  rejectionEmailSentAt: string | null; // ISO date string
  rejectionEmailSentBy: string;
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
  // Everything below is set by an admin after the signup is accepted, on /admin/crew.
  // The roster: what they are actually doing on the day, as opposed to areasOfInterest,
  // which is what they asked for.
  assignedArea: VolunteerArea | '';
  assignedShift: VolunteerShift;
  photoUrl: string;
  // Opt-in, admin-controlled, and false by default. Volunteers never agreed to being
  // listed publicly the way speakers did, so nobody reaches /crew without this flipped.
  showOnCrewPage: boolean;
  // Null until an admin sends the acceptance email from the dashboard. Accepting a signup
  // and telling the volunteer about it are deliberately separate steps, as with speakers.
  acceptanceEmailSentAt: string | null; // ISO date string
  acceptanceEmailSentBy: string;
  confirmByDate: string | null; // ISO date string; the volunteer's deadline to confirm
  volunteerConfirmedAt: string | null; // ISO date string; set from /volunteer/confirm
  // Set by hand from /admin/crew once a volunteer's ticket has gone out some other way
  // (the organisers issuing it straight from Humanitix, say). While it is set,
  // /volunteer/confirm stops showing the volunteer ticket link, so nobody claims twice.
  ticketSentAt: string | null; // ISO date string
  ticketSentBy: string;
  // Derived from the three fields above rather than stored, so it can never disagree.
  confirmation: VolunteerConfirmation;
  // Organisers are added by an admin from /admin/crew rather than arriving through the
  // signup form. They live in the same collection because the crew is one roster, but
  // they never went near the form, so every field above that the form fills is empty and
  // the acceptance/confirmation flow does not apply to them.
  isOrganiser: boolean;
  // Free text ("Lead organiser", "Sponsorship", "Marketing"): an organiser's job is not
  // one of the VolunteerAreas, and squeezing it into one would misname it. Empty
  // for volunteers.
  organiserRole: string;
  // Shown beside an organiser on the landing page, which is where the old `team`
  // collection used to put it. Empty for volunteers.
  linkedinUrl: string;
}

// What /crew renders. A deliberate subset of VolunteerSubmission: no email, no phone, no
// motivation, no dietary requirements, nothing that only an organiser should see.
export interface PublicCrewMember {
  id: string;
  name: string;
  assignedArea: VolunteerArea | '';
  photoUrl: string;
  isOrganiser: boolean;
  organiserRole: string;
  linkedinUrl: string;
}

// The two groups /crew renders, and the split the landing page's organisers section
// reads the first half of. Kept apart at the source rather than filtered in the page, so
// the gate each half passes through is decided in one place.
export interface PublicCrew {
  organisers: PublicCrewMember[];
  volunteers: PublicCrewMember[];
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
  // Read off the source submission, so the speakers page can show when the acceptance
  // email went, who sent it, and the deadline, without a trip to /admin.
  acceptanceEmailSentAt: string | null; // ISO date string
  acceptanceEmailSentBy: string | null;
  confirmByDate: string | null; // ISO date string
  speakerConfirmedAt: string | null; // ISO date string
  speakerTicketEmailSentAt: string | null; // ISO date string
  speakerTicketEmailSentBy: string | null;
  // The calendar invite for their session, recorded on the speaker document (it follows the
  // schedule, not the proposal). Null until one is sent. calendarInviteSlot is what the
  // last invite said, so the dashboard can tell when the schedule has moved since; it goes
  // back to null once a cancellation is sent.
  calendarInviteSentAt: string | null; // ISO date string
  calendarInviteSentBy: string | null;
  calendarInviteSlot: CalendarInviteSlot | null;
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

// The rooms the day runs in. 'all' is a break that happens everywhere at once (registration,
// lunch), drawn as one full-width row. A plenary names its actual room but is drawn full
// width as well, since nothing runs against it.
export type ScheduleRoom = 'auditorium' | 'developer' | 'builder' | 'workshops' | 'all';
// A session belongs to one or more speakers and takes its title from their talk; a break
// or plenary carries its own title and has no speaker.
export type ScheduleKind = 'session' | 'break' | 'plenary';

// A document in the `schedule` collection, as stored.
export interface ScheduleItem {
  id: string;
  kind: ScheduleKind;
  // For a session, the fallback shown until its speaker has confirmed ("Workshop",
  // "Lightning talks"); for a break or plenary, the title itself.
  title: string;
  // Ids in the `speakers` collection. References rather than names, so a speaker renamed
  // in /admin/speakers is renamed here too, and an unconfirmed one is never shown.
  speakerIds: string[];
  startTime: string; // ISO date string (serialized from Firestore Timestamp)
  durationMinutes: number;
  room: ScheduleRoom;
  // Marked "TBC" on the page: the slot is held but what fills it is not settled.
  isTentative: boolean;
}

// The speaker details a schedule slot needs, cut down from PublicSpeaker.
export interface ScheduleSpeaker {
  name: string;
  slug: string;
  photoUrl: string;
}

// When and where one speaker is on, for their page on /speakers/[slug].
export interface SpeakerSessionTime {
  startTime: string; // ISO date string
  endTime: string; // ISO date string
  room: ScheduleRoom;
}

// What a speaker's calendar invite last told them.
export interface CalendarInviteSlot extends SpeakerSessionTime {
  talkTitle: string;
}

// Where a speaker's calendar invite stands against the current schedule.
//   unscheduled: not on the schedule and never sent one, so there is nothing to send
//   not-sent:    on the schedule, no invite yet
//   sent:        the invite matches the schedule
//   changed:     the time, room or title moved after the invite went out
//   removed:     an invite went out but they are no longer on the schedule
export type CalendarInviteStatus = 'unscheduled' | 'not-sent' | 'sent' | 'changed' | 'removed';

// What /schedule renders. Speaker-derived fields are only filled for confirmed speakers.
export interface PublicScheduleSlot {
  id: string;
  kind: ScheduleKind;
  title: string;
  speakers: ScheduleSpeaker[];
  // True when a speaker is assigned but has not confirmed, so the slot can say a speaker
  // is coming without naming them. False for a slot nobody has been given yet.
  hasUnannouncedSpeaker: boolean;
  // Null for breaks, plenaries and sessions whose speaker has not confirmed yet.
  track: Track | null;
  format: TalkFormat | null;
  startTime: string; // ISO date string
  endTime: string; // ISO date string
  room: ScheduleRoom;
  isTentative: boolean;
}
