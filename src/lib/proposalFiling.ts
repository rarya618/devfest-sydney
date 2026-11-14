import { FieldValue } from 'firebase-admin/firestore';
import { Resend } from 'resend';
import { adminDb } from '@/lib/firebase-admin';
import { escapeHtml } from '@/lib/escapeHtml';
import { portalSignInUrl } from '@/lib/portalAuth';
import { hasEventEnded, loadEvent } from '@/lib/events';
import { normaliseProfileUrl } from '@/lib/speakers';
import { MEETUP_FORMATS, MEETUP_FORMAT_LABELS, MEETUP_PROPOSAL_LIMITS } from '@/lib/meetupProposalLabels';
import type { MeetupFormat, MeetupProposal, TalkFormat } from '@/lib/types';

// Filing a talk proposal, shared by the form endpoints (/api/submit-proposal for a DevFest
// Call for Speakers, /api/submit-meetup-proposal for gdgsydney.com/speak) and the speaker
// portal (the dashboard's Propose a talk), so a proposal made either way is validated, stored and confirmed
// the same and reads the same in the admin. Server only.

// ---------------------------------------------------------------------------------------
// DevFest Call for Speakers (`submissions`)
// ---------------------------------------------------------------------------------------

export type DevfestProposalFormat = 'talk' | 'lightning-talk' | 'workshop';
export type DevfestProposalLevel = 'beginner' | 'intermediate' | 'advanced';
export type DevfestProposalTrack = 'developer' | 'builder' | 'workshop';

export interface DevfestProposalPayload {
  name: string;
  email: string;
  talkTitle: string;
  abstract: string;
  format: DevfestProposalFormat;
  track: DevfestProposalTrack;
  experienceLevel: DevfestProposalLevel;
  linkedinUrl: string;
  githubUrl: string;
  websiteUrl: string;
  speakerTagline: string;
  speakerBio: string;
  previousTalkLink: string;
  howDidYouHear: string;
  coSpeakerEmails: string;
  accessibilityNeeds: string;
  requiresTravelSupport: boolean;
  travelSupportLocation: string;
  isGoogleDeveloperExpert: boolean;
  isFirstTimeSpeaker: boolean;
  wantsMentoring: boolean;
  hasSpokenAtGdgSydneyBefore: boolean;
  isOpenToAudienceQuestions: boolean;
  optOutOfRecording: boolean;
  tracking: Record<string, string>;
}

const TRACKING_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'ref'] as const;
const TRACKING_VALUE_MAX = 200;

function sanitizeTracking(input: unknown): Record<string, string> {
  const tracking: Record<string, string> = {};
  if (!input || typeof input !== 'object') return tracking;
  const raw = input as Record<string, unknown>;
  for (const key of TRACKING_KEYS) {
    const value = raw[key];
    if (typeof value === 'string' && value.trim()) {
      tracking[key] = value.trim().slice(0, TRACKING_VALUE_MAX);
    }
  }
  return tracking;
}

export const DEVFEST_PROPOSAL_FORMATS: DevfestProposalFormat[] = ['talk', 'lightning-talk', 'workshop'];
export const DEVFEST_PROPOSAL_TRACKS: DevfestProposalTrack[] = ['developer', 'builder', 'workshop'];
export const DEVFEST_PROPOSAL_LEVELS: DevfestProposalLevel[] = ['beginner', 'intermediate', 'advanced'];
export const DEVFEST_ABSTRACT_MAX = 2000;

const FORMAT_LABELS: Record<DevfestProposalFormat, string> = {
  talk: 'Talk (30 min)',
  'lightning-talk': 'Lightning Talk (10 min)',
  workshop: 'Workshop',
};

const TRACK_LABELS: Record<DevfestProposalTrack, string> = {
  developer: 'Developer Track',
  builder: 'Builder Track',
  workshop: 'Workshops Track',
};

const TRACK_DOT_COLOR: Record<DevfestProposalTrack, string> = {
  developer: '#4285F4',
  builder: '#34A853',
  workshop: '#f9ab00',
};

const LEVEL_LABELS: Record<DevfestProposalLevel, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export function validateDevfestProposal(body: unknown): DevfestProposalPayload {
  if (!body || typeof body !== 'object') throw new Error('Invalid request body.');
  const b = body as Record<string, unknown>;

  if (typeof b.name !== 'string' || !b.name.trim()) throw new Error('Name is required.');
  if (typeof b.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email)) throw new Error('A valid email address is required.');
  if (typeof b.talkTitle !== 'string' || !b.talkTitle.trim()) throw new Error('Talk title is required.');
  if (typeof b.abstract !== 'string' || !b.abstract.trim()) throw new Error('Abstract is required.');
  if (b.abstract.length > DEVFEST_ABSTRACT_MAX) throw new Error(`Abstract must be ${DEVFEST_ABSTRACT_MAX} characters or fewer.`);
  if (!DEVFEST_PROPOSAL_FORMATS.includes(b.format as DevfestProposalFormat)) throw new Error('Please select a valid talk format.');
  if (!DEVFEST_PROPOSAL_TRACKS.includes(b.track as DevfestProposalTrack)) throw new Error('Please select a valid track.');
  if (!DEVFEST_PROPOSAL_LEVELS.includes(b.experienceLevel as DevfestProposalLevel)) throw new Error('Please select a valid experience level.');
  if (b.requiresTravelSupport === true && (typeof b.travelSupportLocation !== 'string' || !b.travelSupportLocation.trim())) {
    throw new Error('Please let us know which city you\'d be travelling from.');
  }

  return {
    name: b.name.trim(),
    email: b.email.trim().toLowerCase(),
    talkTitle: b.talkTitle.trim(),
    abstract: b.abstract.trim(),
    format: b.format as DevfestProposalFormat,
    track: b.track as DevfestProposalTrack,
    experienceLevel: b.experienceLevel as DevfestProposalLevel,
    linkedinUrl: typeof b.linkedinUrl === 'string' ? b.linkedinUrl.trim() : '',
    githubUrl: typeof b.githubUrl === 'string' ? b.githubUrl.trim() : '',
    websiteUrl: typeof b.websiteUrl === 'string' ? b.websiteUrl.trim() : '',
    previousTalkLink: typeof b.previousTalkLink === 'string' ? b.previousTalkLink.trim() : '',
    speakerTagline: typeof b.speakerTagline === 'string' ? b.speakerTagline.trim() : '',
    speakerBio: typeof b.speakerBio === 'string' ? b.speakerBio.trim() : '',
    howDidYouHear: typeof b.howDidYouHear === 'string' ? b.howDidYouHear.trim() : '',
    coSpeakerEmails: typeof b.coSpeakerEmails === 'string' ? b.coSpeakerEmails.trim() : '',
    accessibilityNeeds: typeof b.accessibilityNeeds === 'string' ? b.accessibilityNeeds.trim() : '',
    requiresTravelSupport: b.requiresTravelSupport === true,
    travelSupportLocation: typeof b.travelSupportLocation === 'string' ? b.travelSupportLocation.trim() : '',
    isGoogleDeveloperExpert: b.isGoogleDeveloperExpert === true,
    isFirstTimeSpeaker: b.isFirstTimeSpeaker === true,
    wantsMentoring: b.wantsMentoring === true,
    hasSpokenAtGdgSydneyBefore: b.hasSpokenAtGdgSydneyBefore === true,
    isOpenToAudienceQuestions: b.isOpenToAudienceQuestions === true,
    optOutOfRecording: b.optOutOfRecording === true,
    tracking: sanitizeTracking(b.tracking),
  };
}

function buildDevfestConfirmationEmail(submission: DevfestProposalPayload, eventName: string): string {
  const font = "font-family:'Google Sans',Roboto,sans-serif;letter-spacing:-0.01em;";

  const dot = (color: string, label: string) => `
    <span style="display:inline-block;background:rgba(255,255,255,0.06);border-radius:20px;padding:8px 16px;margin:0 6px 12px;white-space:nowrap;">
      <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${color};margin-right:14px;vertical-align:middle;"></span><span style="${font}font-size:16px;font-weight:700;color:#ffffff;vertical-align:middle;">${label}</span>
    </span>`;

  const indicators = [
    dot(TRACK_DOT_COLOR[submission.track], TRACK_LABELS[submission.track]),
    dot('#F9AB00', FORMAT_LABELS[submission.format]),
    dot('#4285F4', LEVEL_LABELS[submission.experienceLevel]),
  ].join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Proposal received: ${escapeHtml(eventName)}</title>
</head>
<body style="margin:0;padding:0;background:#202124;${font}color:#ffffff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#202124;padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#202124;">
          <tr>
            <td style="padding:60px 40px;text-align:center;">

              <!-- Wordmark -->
              <img src="https://storage.googleapis.com/devfest-sydney-2026.firebasestorage.app/site-assets/logo-wordmark.png" alt="DevFest Sydney" width="221" height="40" style="display:block;margin:0 auto 40px;" />

              <!-- Heading -->
              <h1 style="margin:0 0 8px;${font}font-size:40px;font-weight:400;color:#ffffff;line-height:1.4;">
                Thanks for your submission
              </h1>
              <h2 style="margin:0 0 24px;${font}font-size:44px;font-weight:700;color:#34A853;line-height:1.5;">
                ${escapeHtml(submission.name.split(' ')[0])}
              </h2>
              <p style="margin:0 0 40px;${font}font-size:24px;font-weight:400;color:#ffffff;line-height:1.75;">
                We appreciate the effort you've put into submitting a talk for ${escapeHtml(eventName)}. We will review and get back to you via email.
              </p>

              <!-- Submission recap card -->
              <table cellpadding="0" cellspacing="0" width="100%" style="background:rgba(255,255,255,0.06);border-radius:12px;">
                <tr>
                  <td style="padding:40px;text-align:center;">
                    <h3 style="margin:0 0 24px;${font}font-size:32px;font-weight:700;color:#ffffff;line-height:1.5;">${escapeHtml(submission.talkTitle)}</h3>
                    <div>${indicators}</div>
                  </td>
                </tr>
              </table>

              <!-- Speaker portal -->
              <div style="margin-top:40px;">
                <p style="margin:0 0 8px;${font}font-size:24px;font-weight:700;color:#ffffff;line-height:1.5;">Follow your proposal</p>
                <p style="margin:0 0 24px;${font}font-size:20px;font-weight:400;color:#ffffff;line-height:1.5;">See where it's up to, and make changes until we've decided, in the speaker portal. Sign in with this email address.</p>
                <a href="${portalSignInUrl()}" style="display:inline-block;background:#1967d2;color:#ffffff;${font}font-size:18px;font-weight:700;text-decoration:none;border-radius:999px;padding:14px 28px;">Open the speaker portal</a>
              </div>

              <!-- Questions -->
              <div style="margin-top:40px;">
                <p style="margin:0 0 8px;${font}font-size:24px;font-weight:700;color:#ffffff;line-height:1.5;">Got a question?</p>
                <p style="margin:0;${font}font-size:20px;font-weight:400;color:#ffffff;line-height:1.5;">Just reply to this email, we're happy to help.</p>
              </div>

              <p style="margin:40px 0 0;${font}font-size:20px;font-weight:400;color:#ffffff;">
                Organised by <a href="https://gdgsydney.com" style="color:#ffffff;text-decoration:underline;">GDG Sydney</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// Stores a DevFest proposal under the event that is taking proposals and emails the
// speaker a copy (bcc hello@, which is how organisers hear about it). Throws when the
// write fails; a failed email is logged and swallowed, since the proposal is already saved.
// savedTalkId is set when the speaker portal proposes one of a speaker's saved talks.
export async function fileDevfestProposal(
  submission: DevfestProposalPayload,
  eventId: string,
  eventName: string,
  savedTalkId: string | null = null
): Promise<string> {
  const created = await adminDb.collection('submissions').add({
    ...submission,
    ...(savedTalkId ? { savedTalkId } : {}),
    eventId,
    submittedAt: FieldValue.serverTimestamp(),
    status: 'pending',
  });

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: `GDG Sydney <${process.env.RESEND_FROM_EMAIL}>`,
      to: submission.email,
      bcc: 'hello@gdgsydney.com',
      replyTo: 'hello@gdgsydney.com',
      subject: `We've got your ${eventName} submission`,
      html: buildDevfestConfirmationEmail(submission, eventName),
    });
  } catch {
    console.error('Resend email failed for submission:', submission.email);
  }
  return created.id;
}

// ---------------------------------------------------------------------------------------
// Meetup proposals (`meetupProposals`)
// ---------------------------------------------------------------------------------------

// The stored proposal, before Firestore adds its id, status and timestamps.
export type MeetupProposalFields = Omit<
  MeetupProposal,
  | 'id'
  | 'submittedAt'
  | 'status'
  | 'reviewerNotes'
  | 'eventId'
  | 'acceptanceEmailSentAt'
  | 'acceptanceEmailSentBy'
  | 'confirmByDate'
  | 'speakerConfirmedAt'
  | 'confirmation'
  | 'editedAt'
>;


function requiredText(body: Record<string, unknown>, key: keyof typeof MEETUP_PROPOSAL_LIMITS, label: string): string {
  const value = body[key];
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${label} is required.`);
  if (value.trim().length > MEETUP_PROPOSAL_LIMITS[key]) throw new Error(`${label} must be ${MEETUP_PROPOSAL_LIMITS[key]} characters or fewer.`);
  return value.trim();
}

function optionalText(body: Record<string, unknown>, key: keyof typeof MEETUP_PROPOSAL_LIMITS, label: string): string {
  const value = body[key];
  if (value === undefined || value === null || value === '') return '';
  if (typeof value !== 'string') throw new Error(`${label} must be text.`);
  if (value.trim().length > MEETUP_PROPOSAL_LIMITS[key]) throw new Error(`${label} must be ${MEETUP_PROPOSAL_LIMITS[key]} characters or fewer.`);
  return value.trim();
}

export function validateMeetupProposal(raw: unknown): MeetupProposalFields {
  if (!raw || typeof raw !== 'object') throw new Error('Invalid request body.');
  const body = raw as Record<string, unknown>;

  const email = requiredText(body, 'email', 'Email');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('A valid email address is required.');

  if (!MEETUP_FORMATS.includes(body.format as MeetupFormat)) throw new Error('Please choose a talk format.');

  const rawProfile = optionalText(body, 'profileUrl', 'LinkedIn or website');
  const profileUrl = rawProfile ? normaliseProfileUrl(rawProfile) : '';
  if (rawProfile && !profileUrl) throw new Error('LinkedIn or website must be a web address.');

  return {
    name: requiredText(body, 'name', 'Full name'),
    email: email.toLowerCase(),
    profileUrl,
    talkTitle: requiredText(body, 'talkTitle', 'Talk title'),
    format: body.format as MeetupFormat,
    abstract: requiredText(body, 'abstract', 'Talk abstract'),
    audience: requiredText(body, 'audience', 'Target audience'),
    bio: requiredText(body, 'bio', 'Speaker bio'),
    speakingExperience: optionalText(body, 'speakingExperience', 'Speaking experience'),
    notes: optionalText(body, 'notes', 'Anything else'),
  };
}

function buildMeetupConfirmationEmail(proposal: MeetupProposalFields): string {
  const font = "font-family:'Google Sans',Roboto,sans-serif;";
  const firstName = escapeHtml(proposal.name.split(' ')[0]);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Proposal received: GDG Sydney</title>
</head>
<body style="margin:0;padding:0;background:#1e1e1e;${font}color:#f0f0f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#1e1e1e;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 16px;${font}font-size:28px;font-weight:700;color:#f0f0f0;">Thanks, ${firstName}. We've got your proposal.</h1>
              <p style="margin:0 0 24px;${font}font-size:16px;line-height:1.7;color:#d6d6d4;">
                Our organisers will read it and get back to you within a week.
              </p>
              <table cellpadding="0" cellspacing="0" width="100%" style="background:#272727;border-radius:12px;">
                <tr>
                  <td style="padding:24px;">
                    <p style="margin:0 0 6px;${font}font-size:13px;color:#9aa0a6;">${escapeHtml(MEETUP_FORMAT_LABELS[proposal.format])}</p>
                    <p style="margin:0;${font}font-size:20px;font-weight:700;color:#f0f0f0;">${escapeHtml(proposal.talkTitle)}</p>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 16px;${font}font-size:15px;line-height:1.7;color:#d6d6d4;">
                See where it's up to, and make changes until we've decided, in the speaker portal. Sign in with this email address.
              </p>
              <a href="${portalSignInUrl()}" style="display:inline-block;background:#1967d2;color:#ffffff;${font}font-size:15px;font-weight:700;text-decoration:none;border-radius:999px;padding:12px 24px;">Open the speaker portal</a>
              <p style="margin:24px 0 0;${font}font-size:15px;line-height:1.7;color:#d6d6d4;">
                Questions? Reply to this email.
              </p>
              <p style="margin:24px 0 0;${font}font-size:14px;color:#9aa0a6;">
                <a href="https://gdgsydney.com" style="color:#d6d6d4;">GDG Sydney</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// Where a meetup proposal came from, shown to admins: the /speak form, the portal, or an
// organiser adding a talk agreed outside both (scripts/add-agreed-meetup-talks.mjs).
export type MeetupProposalSource = 'gdgsydney.com/speak' | 'speaker-portal' | 'organiser';

// Stores a meetup proposal (no event yet: one is picked on acceptance) and emails the speaker
// a copy, bcc hello@. Throws when the write fails; a failed email is logged and swallowed.
export async function fileMeetupProposal(
  proposal: MeetupProposalFields,
  source: MeetupProposalSource,
  savedTalkId: string | null = null
): Promise<string> {
  const created = await adminDb.collection('meetupProposals').add({
    ...proposal,
    ...(savedTalkId ? { savedTalkId } : {}),
    source,
    status: 'pending',
    submittedAt: FieldValue.serverTimestamp(),
  });

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: `GDG Sydney <${process.env.RESEND_FROM_EMAIL}>`,
      to: proposal.email,
      bcc: 'hello@gdgsydney.com',
      replyTo: 'hello@gdgsydney.com',
      subject: "We've got your GDG Sydney talk proposal",
      html: buildMeetupConfirmationEmail(proposal),
    });
  } catch {
    console.error('Resend email failed for meetup proposal:', proposal.email);
  }
  return created.id;
}

// ---------------------------------------------------------------------------------------
// Editing a proposal from the speaker portal
// ---------------------------------------------------------------------------------------

export type ProposalKind = 'devfest' | 'meetup';

// What a speaker may change on their own proposal: everything they typed except who it is from
// (name and email, which stay with organisers as on profiles). Where it came from (tracking,
// source, savedTalkId) and the review record are never touched.
export const DEVFEST_EDITABLE_FIELDS = [
  'talkTitle',
  'abstract',
  'format',
  'track',
  'experienceLevel',
  'linkedinUrl',
  'githubUrl',
  'websiteUrl',
  'speakerTagline',
  'speakerBio',
  'previousTalkLink',
  'howDidYouHear',
  'coSpeakerEmails',
  'accessibilityNeeds',
  'requiresTravelSupport',
  'travelSupportLocation',
  'isGoogleDeveloperExpert',
  'isFirstTimeSpeaker',
  'wantsMentoring',
  'hasSpokenAtGdgSydneyBefore',
  'isOpenToAudienceQuestions',
  'optOutOfRecording',
] as const satisfies readonly (keyof DevfestProposalPayload)[];

export const MEETUP_EDITABLE_FIELDS = [
  'talkTitle',
  'format',
  'abstract',
  'audience',
  'bio',
  'profileUrl',
  'speakingExperience',
  'notes',
] as const satisfies readonly (keyof MeetupProposalFields)[];

export type ProposalEditOutcome =
  | { outcome: 'saved' | 'unchanged' | 'not-found' | 'decided' | 'event-ended' }
  | { outcome: 'invalid'; message: string };

class ProposalDecidedError extends Error {}
class ProposalEditRefused extends Error {
  constructor(readonly outcome: 'not-found' | 'decided' | 'event-ended') {
    super(outcome);
  }
}

// An accepted meetup proposal's talk is talks/{proposal id} (acceptMeetupProposal).
export const MEETUP_TO_TALK_FORMAT: Record<MeetupFormat, TalkFormat> = { standard: 'talk', workshop: 'workshop' };

// Who is editing a meetup proposal: the speaker from the portal (their own only, and only while
// it can still change), or an organiser from /admin/meetups (any, any time).
export type MeetupProposalEditor = { kind: 'speaker'; email: string } | { kind: 'organiser' };

// Saves edits to a meetup proposal and, once it is accepted, to its talk, which is what the
// portal and the public API show, so the two never disagree. A speaker may edit while it is
// pending, and after acceptance (once told, and not the format) until the event ends (decided 2026-11-14); their edits stamp
// editedAt, which the admin card shows. An organiser's don't. Name and email aren't editable
// here by either: the person's profile owns those. Throws when Firestore fails.
export async function editMeetupProposal(
  proposalId: string,
  fields: Record<string, unknown>,
  editor: MeetupProposalEditor
): Promise<ProposalEditOutcome> {
  if (!proposalId || proposalId.includes('/')) return { outcome: 'not-found' };
  const reference = adminDb.collection('meetupProposals').doc(proposalId);
  const talkReference = adminDb.collection('talks').doc(proposalId);

  // Whether this editor may change the proposal as it now stands. Run before validating, and
  // again inside the transaction, so a decision or a passed event in between still stops it.
  async function refusal(stored: FirebaseFirestore.DocumentData | undefined): Promise<'not-found' | 'decided' | 'event-ended' | null> {
    if (!stored) return 'not-found';
    if (editor.kind === 'organiser') return null;
    if (stored.email !== editor.email) return 'not-found';
    if (stored.status === 'pending') return null;
    // Accepted counts only once the speaker knows (the email has gone, or they are confirmed):
    // until then it is a decision like any other, and editing must not give it away.
    if (stored.status !== 'accepted' || !(stored.acceptanceEmailSentAt || stored.speakerConfirmedAt)) return 'decided';
    const event = stored.eventId ? await loadEvent(String(stored.eventId)) : null;
    return !event || hasEventEnded(event) ? 'event-ended' : null;
  }

  const stored = (await reference.get()).data();
  const refused = await refusal(stored);
  if (refused) return { outcome: refused };

  // Once a talk is on a meetup's running order its format is the organisers' (decided
  // 2026-11-14): a speaker's edit keeps the stored one, whatever the form sent.
  const keepsFormat = (proposal: FirebaseFirestore.DocumentData | undefined) => editor.kind === 'speaker' && proposal?.status === 'accepted';
  let changes: Record<string, unknown>;
  try {
    const validated = validateMeetupProposal({
      ...fields,
      ...(keepsFormat(stored) ? { format: stored!.format } : {}),
      name: String(stored!.name ?? ''),
      email: String(stored!.email ?? ''),
    });
    changes = Object.fromEntries(MEETUP_EDITABLE_FIELDS.map((key) => [key, validated[key]]));
  } catch (error) {
    return { outcome: 'invalid', message: error instanceof Error ? error.message : 'Please check the proposal and try again.' };
  }
  if (!Object.entries(changes).some(([key, value]) => (stored![key] ?? '') !== value)) return { outcome: 'unchanged' };

  try {
    await adminDb.runTransaction(async (transaction) => {
      const [current, talk] = await Promise.all([transaction.get(reference), transaction.get(talkReference)]);
      const currentRefusal = await refusal(current.data());
      if (currentRefusal) throw new ProposalEditRefused(currentRefusal);
      // Accepted since the first read: the format still isn't the speaker's to change.
      if (keepsFormat(current.data())) changes.format = current.data()!.format;
      transaction.update(reference, { ...changes, ...(editor.kind === 'speaker' ? { editedAt: FieldValue.serverTimestamp() } : {}) });
      if (current.data()?.status === 'accepted' && talk.exists) {
        transaction.update(talkReference, {
          talkTitle: changes.talkTitle,
          abstract: changes.abstract,
          format: MEETUP_TO_TALK_FORMAT[changes.format as MeetupFormat],
        });
      }
    });
  } catch (error) {
    if (error instanceof ProposalEditRefused) return { outcome: error.outcome };
    throw error;
  }
  return { outcome: 'saved' };
}

// /admin/speakers' limit on a talk title; a DevFest proposal has none of its own.
export const DEVFEST_TALK_TITLE_MAX = 150;

// Once a DevFest proposal is accepted, its talk (talks/{submission id}) is what the portal,
// the schedule and the public API show, and organisers own its track, format and level (they
// move talks onto Spotlight and Keynote, and fit formats to slots). So the speaker can change
// only the title and abstract, once told, until the event ends (decided 2026-11-14). Both go
// to the talk and to the submission, so the proposals page agrees; editedAt marks the edit.
async function editAcceptedDevfestTalk(proposalId: string, ownerEmail: string, fields: Record<string, unknown>): Promise<ProposalEditOutcome> {
  const submissionReference = adminDb.collection('submissions').doc(proposalId);
  const talkReference = adminDb.collection('talks').doc(proposalId);

  async function refusal(stored: FirebaseFirestore.DocumentData | undefined, talkExists: boolean): Promise<'not-found' | 'decided' | 'event-ended' | null> {
    if (!stored || stored.email !== ownerEmail) return 'not-found';
    if (stored.status !== 'accepted' || !(stored.acceptanceEmailSentAt || stored.speakerConfirmedAt)) return 'decided';
    if (!talkExists) return 'decided';
    const event = stored.eventId ? await loadEvent(String(stored.eventId)) : null;
    return !event || hasEventEnded(event) ? 'event-ended' : null;
  }

  const talkTitle = typeof fields.talkTitle === 'string' ? fields.talkTitle.trim() : '';
  const abstract = typeof fields.abstract === 'string' ? fields.abstract.trim() : '';
  if (!talkTitle) return { outcome: 'invalid', message: 'Talk title is required.' };
  if (talkTitle.length > DEVFEST_TALK_TITLE_MAX) return { outcome: 'invalid', message: `Talk title must be ${DEVFEST_TALK_TITLE_MAX} characters or fewer.` };
  if (!abstract) return { outcome: 'invalid', message: 'Abstract is required.' };
  if (abstract.length > DEVFEST_ABSTRACT_MAX) return { outcome: 'invalid', message: `Abstract must be ${DEVFEST_ABSTRACT_MAX} characters or fewer.` };

  const [submission, talk] = await Promise.all([submissionReference.get(), talkReference.get()]);
  const refused = await refusal(submission.data(), talk.exists);
  if (refused) return { outcome: refused };
  if (talk.data()?.talkTitle === talkTitle && talk.data()?.abstract === abstract) return { outcome: 'unchanged' };

  try {
    await adminDb.runTransaction(async (transaction) => {
      const [currentSubmission, currentTalk] = await Promise.all([transaction.get(submissionReference), transaction.get(talkReference)]);
      const currentRefusal = await refusal(currentSubmission.data(), currentTalk.exists);
      if (currentRefusal) throw new ProposalEditRefused(currentRefusal);
      transaction.update(talkReference, { talkTitle, abstract });
      transaction.update(submissionReference, { talkTitle, abstract, editedAt: FieldValue.serverTimestamp() });
    });
  } catch (error) {
    if (error instanceof ProposalEditRefused) return { outcome: error.outcome };
    throw error;
  }
  return { outcome: 'saved' };
}

// A speaker editing their own proposal from the portal. Meetup ones go to editMeetupProposal
// (editable after acceptance too, until the event). An accepted DevFest one goes to
// editAcceptedDevfestTalk. A pending DevFest one is rewritten in place while it is still pending (decided 2026-11-14: after the CfS has closed too). Checked by the same validator as filing, with the
// stored name and the owner's email, and stamped with editedAt so the admin shows it was changed.
// The status check and the write share a transaction, so an edit can't land on a proposal an
// organiser accepted or rejected a moment earlier. Throws when Firestore fails.
export async function editOwnProposal(
  kind: ProposalKind,
  proposalId: string,
  ownerEmail: string,
  fields: Record<string, unknown>
): Promise<ProposalEditOutcome> {
  if (kind === 'meetup') return editMeetupProposal(proposalId, fields, { kind: 'speaker', email: ownerEmail });
  if (!proposalId || proposalId.includes('/')) return { outcome: 'not-found' };
  const reference = adminDb.collection('submissions').doc(proposalId);
  const snapshot = await reference.get();
  const stored = snapshot.data();
  if (!stored || stored.email !== ownerEmail) return { outcome: 'not-found' };
  if (stored.status === 'accepted') return editAcceptedDevfestTalk(proposalId, ownerEmail, fields);
  if (stored.status !== 'pending') return { outcome: 'decided' };

  let changes: Record<string, unknown>;
  try {
    const validated = validateDevfestProposal({ ...fields, name: String(stored.name ?? ''), email: ownerEmail });
    changes = Object.fromEntries(DEVFEST_EDITABLE_FIELDS.map((key) => [key, validated[key]]));
  } catch (error) {
    return { outcome: 'invalid', message: error instanceof Error ? error.message : 'Please check your proposal and try again.' };
  }

  const hasChanges = Object.entries(changes).some(([key, value]) => (stored[key] ?? (typeof value === 'boolean' ? false : '')) !== value);
  if (!hasChanges) return { outcome: 'unchanged' };

  try {
    await adminDb.runTransaction(async (transaction) => {
      const current = (await transaction.get(reference)).data();
      if (!current || current.email !== ownerEmail || current.status !== 'pending') throw new ProposalDecidedError();
      transaction.update(reference, { ...changes, editedAt: FieldValue.serverTimestamp() });
    });
  } catch (error) {
    if (error instanceof ProposalDecidedError) return { outcome: 'decided' };
    throw error;
  }
  return { outcome: 'saved' };
}
