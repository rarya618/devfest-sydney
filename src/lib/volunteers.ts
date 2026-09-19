import { adminDb } from '@/lib/firebase-admin';
import type {
  PublicCrew,
  PublicCrewMember,
  ReviewerNote,
  VolunteerConfirmation,
  VolunteerSubmission,
} from '@/lib/types';
import type { Timestamp } from 'firebase-admin/firestore';

function toIsoOrNull(timestamp: Timestamp | undefined): string | null {
  return timestamp ? timestamp.toDate().toISOString() : null;
}

// Derived rather than stored, so the chip can never disagree with the two timestamps it
// is describing. Mirrors toConfirmation() in speakers.ts.
function toConfirmation(data: FirebaseFirestore.DocumentData): VolunteerConfirmation {
  if (data.volunteerConfirmedAt) return 'confirmed';
  if (data.acceptanceEmailSentAt) return 'awaiting';
  return 'not-emailed';
}

export async function fetchVolunteers(): Promise<VolunteerSubmission[]> {
  const snapshot = await adminDb
    .collection('volunteers')
    .orderBy('submittedAt', 'desc')
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    const timestamp = data.submittedAt as Timestamp | undefined;
    return {
      id: doc.id,
      name: data.name ?? '',
      email: data.email ?? '',
      phone: data.phone ?? '',
      motivation: data.motivation ?? '',
      areasOfInterest: data.areasOfInterest ?? [],
      priorExperience: data.priorExperience ?? '',
      googleTechExperience: data.googleTechExperience ?? '',
      isTorrensStudentOrStaff: data.isTorrensStudentOrStaff ?? false,
      hasBeenGdgOnCampusExec: data.hasBeenGdgOnCampusExec ?? false,
      gdgOnCampusChapter: data.gdgOnCampusChapter ?? '',
      dietaryRequirements: data.dietaryRequirements ?? '',
      tracking: {
        utmSource: data.tracking?.utm_source ?? '',
        utmMedium: data.tracking?.utm_medium ?? '',
        utmCampaign: data.tracking?.utm_campaign ?? '',
        utmContent: data.tracking?.utm_content ?? '',
        utmTerm: data.tracking?.utm_term ?? '',
        ref: data.tracking?.ref ?? '',
      },
      submittedAt: timestamp ? timestamp.toDate().toISOString() : new Date().toISOString(),
      status: data.status ?? 'pending',
      reviewerNotes: ((data.reviewerNotes ?? []) as Array<{
        text?: string;
        authorName?: string;
        createdAt?: Timestamp;
      }>).map((note) => ({
        text: note.text ?? '',
        authorName: note.authorName ?? '',
        createdAt: note.createdAt ? note.createdAt.toDate().toISOString() : new Date().toISOString(),
      })) satisfies ReviewerNote[],
      // Roster and announcement fields. Every one of these is absent on a freshly
      // submitted signup, so each falls back to its "not set yet" value.
      assignedArea: data.assignedArea ?? '',
      assignedShift: data.assignedShift ?? '',
      photoUrl: data.photoUrl ?? '',
      showOnCrewPage: data.showOnCrewPage ?? false,
      acceptanceEmailSentAt: toIsoOrNull(data.acceptanceEmailSentAt as Timestamp | undefined),
      acceptanceEmailSentBy: data.acceptanceEmailSentBy ?? '',
      confirmByDate: toIsoOrNull(data.confirmByDate as Timestamp | undefined),
      volunteerConfirmedAt: toIsoOrNull(data.volunteerConfirmedAt as Timestamp | undefined),
      ticketSentAt: toIsoOrNull(data.ticketSentAt as Timestamp | undefined),
      ticketSentBy: data.ticketSentBy ?? '',
      confirmation: toConfirmation(data),
      isOrganiser: data.isOrganiser ?? false,
      organiserRole: data.organiserRole ?? '',
      linkedinUrl: data.linkedinUrl ?? '',
    } satisfies VolunteerSubmission;
  });
}

// The signups: everyone who came through the volunteer form. Organisers are added
// straight onto the crew by an admin and never filled the form in, so they are left out
// of the review dashboard and the analytics, where they would be counted as signups that
// never happened.
export async function fetchVolunteerSignups(): Promise<VolunteerSubmission[]> {
  const volunteers = await fetchVolunteers();
  return volunteers.filter((volunteer) => !volunteer.isOrganiser);
}

// The crew: volunteers who have been accepted, which is what /admin/crew manages. They
// stay in the `volunteers` collection rather than being promoted into a second one the
// way accepted speakers are. A speaker document exists because the public profile is
// edited away from the proposal that produced it; a crew member's roster is just a few
// more fields on the signup, and a copy would only be something to keep in sync.
export async function fetchCrew(): Promise<VolunteerSubmission[]> {
  const volunteers = await fetchVolunteers();
  return volunteers.filter((volunteer) => volunteer.status === 'accepted');
}

// Whether a crew member may be named on the site. For a volunteer: two gates, both
// required. They have confirmed through /volunteer/confirm, and an admin has ticked
// "show on the public crew page" - confirming says they are coming, it does not say they
// want their name on the website. An organiser has no confirmation step to pass: they
// were added by an admin who knows them, so the one tick is the whole gate.
function isPubliclyListable(member: VolunteerSubmission): boolean {
  if (!member.showOnCrewPage) return false;
  return member.isOrganiser || member.confirmation === 'confirmed';
}

function toPublicCrewMember(member: VolunteerSubmission): PublicCrewMember {
  return {
    id: member.id,
    name: member.name,
    assignedArea: member.assignedArea,
    photoUrl: member.photoUrl,
    isOrganiser: member.isOrganiser,
    organiserRole: member.organiserRole,
    linkedinUrl: member.linkedinUrl,
  };
}

// The public crew, split into the two groups /crew renders under their own headings.
// Returns empty lists rather than throwing so the page can show its "coming soon" state.
export async function fetchPublicCrew(): Promise<PublicCrew> {
  try {
    const crew = await fetchCrew();
    const listable = crew
      .filter(isPubliclyListable)
      .sort((first, second) => first.name.localeCompare(second.name))
      .map(toPublicCrewMember);

    return {
      organisers: listable.filter((member) => member.isOrganiser),
      volunteers: listable.filter((member) => !member.isOrganiser),
    };
  } catch {
    return { organisers: [], volunteers: [] };
  }
}

// The organisers alone, for the landing page's "The organisers" section. Same gate as
// /crew, so an organiser appears in both places or neither.
export async function fetchPublicOrganisers(): Promise<PublicCrewMember[]> {
  const { organisers } = await fetchPublicCrew();
  return organisers;
}
