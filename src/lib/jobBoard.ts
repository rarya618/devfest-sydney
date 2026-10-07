import { adminDb } from '@/lib/firebase-admin';
import type { Timestamp } from 'firebase-admin/firestore';
import { normaliseProfileUrl } from '@/lib/speakers';
import { fetchSponsors, TIER_ORDER } from '@/lib/sponsors';
import { EMAIL_PATTERN, JOB_LIMITS, JOB_TYPES, WORK_ARRANGEMENTS } from '@/lib/jobBoardLabels';
import type {
  JobBoardStatus,
  JobListing,
  JobSeeker,
  JobType,
  PublicJobListing,
  PublicJobSeeker,
  WorkArrangement,
} from '@/lib/types';

// ---------------------------------------------------------------------------------------
// Validation. Used by the two /api routes on the way in and by the admin actions on an
// edit, since the Admin SDK bypasses firestore.rules either way.
// ---------------------------------------------------------------------------------------

export interface JobListingFields {
  companyName: string;
  contactName: string;
  contactEmail: string;
  roleTitle: string;
  location: string;
  workArrangement: WorkArrangement;
  jobType: JobType;
  description: string;
  howToApply: string;
}

export interface JobSeekerFields {
  name: string;
  email: string;
  headline: string;
  about: string;
  lookingFor: string;
  location: string;
  workArrangements: WorkArrangement[];
  linkedinUrl: string;
  portfolioUrl: string;
}

function requiredText(value: unknown, max: number, missing: string, label: string): string {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text) throw new Error(missing);
  if (text.length > max) throw new Error(`${label} must be ${max} characters or fewer.`);
  return text;
}

function optionalUrl(value: unknown, label: string): string {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw) return '';
  if (raw.length > JOB_LIMITS.url) throw new Error(`${label} must be ${JOB_LIMITS.url} characters or fewer.`);
  const url = normaliseProfileUrl(raw);
  if (!url) throw new Error(`${label} doesn't look like a web address.`);
  return url;
}

// "How to apply" takes either a link to the ad or an email address, since plenty of
// smaller teams hire by email.
function validateHowToApply(value: unknown): string {
  const raw = requiredText(value, JOB_LIMITS.howToApply, 'Please tell applicants how to apply.', 'How to apply');
  if (EMAIL_PATTERN.test(raw) && !raw.includes('/')) return raw.toLowerCase();
  const url = normaliseProfileUrl(raw);
  if (!url) throw new Error('How to apply should be a link to the job ad or an email address.');
  return url;
}

export function validateJobListing(body: unknown): JobListingFields {
  if (!body || typeof body !== 'object') throw new Error('Invalid request body.');
  const input = body as Record<string, unknown>;

  const contactEmail = typeof input.contactEmail === 'string' ? input.contactEmail.trim().toLowerCase() : '';
  if (!EMAIL_PATTERN.test(contactEmail)) throw new Error('A valid contact email is required.');
  if (!WORK_ARRANGEMENTS.includes(input.workArrangement as WorkArrangement)) {
    throw new Error('Please say whether the role is on-site, hybrid or remote.');
  }
  if (!JOB_TYPES.includes(input.jobType as JobType)) throw new Error('Please choose the type of role.');

  return {
    companyName: requiredText(input.companyName, JOB_LIMITS.companyName, 'Please enter the company name.', 'Company name'),
    contactName: requiredText(input.contactName, JOB_LIMITS.contactName, 'Please enter your name.', 'Your name'),
    contactEmail,
    roleTitle: requiredText(input.roleTitle, JOB_LIMITS.roleTitle, 'Please enter the role title.', 'Role title'),
    location: requiredText(input.location, JOB_LIMITS.location, 'Please enter where the role is based.', 'Location'),
    workArrangement: input.workArrangement as WorkArrangement,
    jobType: input.jobType as JobType,
    description: requiredText(input.description, JOB_LIMITS.description, 'Please describe the role.', 'The description'),
    howToApply: validateHowToApply(input.howToApply),
  };
}

export function validateJobSeeker(body: unknown): JobSeekerFields {
  if (!body || typeof body !== 'object') throw new Error('Invalid request body.');
  const input = body as Record<string, unknown>;

  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
  if (!EMAIL_PATTERN.test(email)) throw new Error('A valid email address is required.');

  const rawArrangements = Array.isArray(input.workArrangements) ? input.workArrangements : [];
  const workArrangements = WORK_ARRANGEMENTS.filter((arrangement) => rawArrangements.includes(arrangement));
  if (workArrangements.length === 0) throw new Error('Please choose at least one way you would like to work.');

  // LinkedIn is the only public way to reach someone, so it is required.
  const linkedinUrl = optionalUrl(input.linkedinUrl, 'Your LinkedIn profile');
  if (!linkedinUrl) throw new Error('Please add your LinkedIn profile, so employers can get in touch.');

  return {
    name: requiredText(input.name, JOB_LIMITS.name, 'Please enter your name.', 'Your name'),
    email,
    headline: requiredText(input.headline, JOB_LIMITS.headline, 'Please add a one-line headline.', 'Your headline'),
    about: requiredText(input.about, JOB_LIMITS.about, 'Please tell employers a little about yourself.', 'About you'),
    lookingFor: requiredText(input.lookingFor, JOB_LIMITS.lookingFor, 'Please say what kind of role you are after.', 'What you are looking for'),
    location: requiredText(input.location, JOB_LIMITS.location, 'Please enter where you are based.', 'Location'),
    workArrangements,
    linkedinUrl,
    portfolioUrl: optionalUrl(input.portfolioUrl, 'Your portfolio link'),
  };
}

// ---------------------------------------------------------------------------------------
// Reads.
// ---------------------------------------------------------------------------------------

function toIsoOrNull(timestamp: Timestamp | undefined): string | null {
  return timestamp ? timestamp.toDate().toISOString() : null;
}

function toJobListing(id: string, data: FirebaseFirestore.DocumentData): JobListing {
  return {
    id,
    companyName: data.companyName ?? '',
    contactName: data.contactName ?? '',
    contactEmail: data.contactEmail ?? '',
    roleTitle: data.roleTitle ?? '',
    location: data.location ?? '',
    workArrangement: data.workArrangement ?? 'on-site',
    jobType: data.jobType ?? 'full-time',
    description: data.description ?? '',
    howToApply: data.howToApply ?? '',
    sponsorId: data.sponsorId ?? '',
    submittedAt: toIsoOrNull(data.submittedAt) ?? new Date().toISOString(),
    approvedAt: toIsoOrNull(data.approvedAt),
    status: (data.status as JobBoardStatus | undefined) ?? 'pending',
  };
}

function toJobSeeker(id: string, data: FirebaseFirestore.DocumentData): JobSeeker {
  return {
    id,
    name: data.name ?? '',
    email: data.email ?? '',
    headline: data.headline ?? '',
    about: data.about ?? '',
    lookingFor: data.lookingFor ?? '',
    location: data.location ?? '',
    workArrangements: Array.isArray(data.workArrangements) ? (data.workArrangements as WorkArrangement[]) : [],
    linkedinUrl: data.linkedinUrl ?? '',
    portfolioUrl: data.portfolioUrl ?? '',
    submittedAt: toIsoOrNull(data.submittedAt) ?? new Date().toISOString(),
    approvedAt: toIsoOrNull(data.approvedAt),
    status: (data.status as JobBoardStatus | undefined) ?? 'pending',
  };
}

export async function fetchJobListings(): Promise<JobListing[]> {
  const snapshot = await adminDb.collection('jobListings').orderBy('submittedAt', 'desc').get();
  return snapshot.docs.map((doc) => toJobListing(doc.id, doc.data()));
}

export async function fetchJobSeekers(): Promise<JobSeeker[]> {
  const snapshot = await adminDb.collection('jobSeekers').orderBy('submittedAt', 'desc').get();
  return snapshot.docs.map((doc) => toJobSeeker(doc.id, doc.data()));
}

function toApplyHref(howToApply: string): string {
  return howToApply.includes('@') && !howToApply.includes('/') ? `mailto:${howToApply}` : howToApply;
}

function newestApprovedFirst(a: { approvedAt: string | null }, b: { approvedAt: string | null }): number {
  return (b.approvedAt ?? '').localeCompare(a.approvedAt ?? '');
}

// Sponsor roles first, in tier order, then everyone else; newest first within each.
// A listing linked to a sponsor that has since been hidden or deleted drops back to the
// general list rather than disappearing. Returns an empty list rather than throwing, so a
// Firestore blip leaves the board empty rather than the page broken.
export async function fetchPublicJobListings(): Promise<PublicJobListing[]> {
  try {
    const [snapshot, sponsors] = await Promise.all([
      adminDb.collection('jobListings').where('status', '==', 'approved').get(),
      fetchSponsors(),
    ]);
    const sponsorsById = new Map(sponsors.map((sponsor) => [sponsor.id, sponsor]));

    const ranked = snapshot.docs.map((doc) => {
      const listing = toJobListing(doc.id, doc.data());
      const sponsor = listing.sponsorId ? sponsorsById.get(listing.sponsorId) : undefined;
      return {
        listing,
        rank: sponsor ? TIER_ORDER.indexOf(sponsor.tier) : TIER_ORDER.length,
        sponsor: sponsor ? { name: sponsor.name, tier: sponsor.tier, logoUrl: sponsor.logoUrl } : null,
      };
    });

    ranked.sort((a, b) => a.rank - b.rank || newestApprovedFirst(a.listing, b.listing));

    return ranked.map(({ listing, sponsor }) => ({
      id: listing.id,
      companyName: listing.companyName,
      roleTitle: listing.roleTitle,
      location: listing.location,
      workArrangement: listing.workArrangement,
      jobType: listing.jobType,
      description: listing.description,
      applyHref: toApplyHref(listing.howToApply),
      sponsor,
    }));
  } catch {
    return [];
  }
}

export async function fetchPublicJobSeekers(): Promise<PublicJobSeeker[]> {
  try {
    const snapshot = await adminDb.collection('jobSeekers').where('status', '==', 'approved').get();
    return snapshot.docs
      .map((doc) => toJobSeeker(doc.id, doc.data()))
      .sort(newestApprovedFirst)
      .map((seeker) => ({
        id: seeker.id,
        name: seeker.name,
        headline: seeker.headline,
        about: seeker.about,
        lookingFor: seeker.lookingFor,
        location: seeker.location,
        workArrangements: seeker.workArrangements,
        linkedinUrl: seeker.linkedinUrl,
        portfolioUrl: seeker.portfolioUrl,
      }));
  } catch {
    return [];
  }
}
