import { loadEventDocs, newestSubmittedFirst } from '@/lib/eventScope';
import type {
  ReviewerNote,
  VolunteerConfirmation,
  VolunteerSubmission,
} from '@/lib/types';
import type { Timestamp } from 'firebase-admin/firestore';
import { loadProfilesFor, withProfile } from '@/lib/volunteerProfiles';

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

export async function fetchVolunteers(eventId: string): Promise<VolunteerSubmission[]> {
  const docs = await loadEventDocs('volunteers', eventId);
  const profiles = await loadProfilesFor(docs.map((doc) => doc.data()));

  const records = docs.map((doc) => {
    const signup = doc.data();
    const data = withProfile(signup, profiles.get(String(signup.profileId ?? '')));
    const timestamp = data.submittedAt as Timestamp | undefined;
    return {
      id: doc.id,
      profileId: typeof signup.profileId === 'string' ? signup.profileId : '',
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
  return records.sort(newestSubmittedFirst);
}

// The signups: everyone who came through the volunteer form. Organisers are added
// straight onto the crew by an admin and never filled the form in, so they are left out
// of the review dashboard and the analytics, where they would be counted as signups that
// never happened.
export async function fetchVolunteerSignups(eventId: string): Promise<VolunteerSubmission[]> {
  const volunteers = await fetchVolunteers(eventId);
  return volunteers.filter((volunteer) => !volunteer.isOrganiser);
}

// The crew: volunteers who have been accepted, which is what /admin/devfest/crew manages. They
// stay in the `volunteers` collection rather than being promoted into a second one the
// way accepted speakers are. A speaker document exists because the public profile is
// edited away from the proposal that produced it; a crew member's roster is just a few
// more fields on the signup, and a copy would only be something to keep in sync.
export async function fetchCrew(eventId: string): Promise<VolunteerSubmission[]> {
  const volunteers = await fetchVolunteers(eventId);
  return volunteers.filter((volunteer) => volunteer.status === 'accepted');
}

