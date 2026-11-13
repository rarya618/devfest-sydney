'use server';

import { redirect } from 'next/navigation';
import { FieldValue } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';
import { Resend } from 'resend';
import { adminDb } from '@/lib/firebase-admin';
import { EMAIL_PATTERN } from '@/lib/emailPattern';
import { escapeHtml } from '@/lib/escapeHtml';
import { currentDevfestFlowState, loadCurrentDevfest } from '@/lib/events';
import { clearSpeakerPhoto, replaceSpeakerPhoto } from '@/lib/people';
import { endPortalSession, getPortalSession, requestSignInLink, signInWithLink } from '@/lib/portalAuth';
import { loadOwnedProfile } from '@/lib/portalData';
import {
  findSavedTalkError,
  MAX_SAVED_TALKS,
  PORTAL_PROFILE_FIELD_LABELS,
  PORTAL_PROFILE_LIMITS,
  type PortalProfileFields,
  type SavedTalkFields,
} from '@/lib/portalLabels';
import { loadOwnedSavedTalk } from '@/lib/portalSavedTalks';
import { fileDevfestProposal, fileMeetupProposal, validateDevfestProposal, validateMeetupProposal } from '@/lib/proposalFiling';
import { normaliseProfileUrl } from '@/lib/speakers';

const ORGANISER_INBOX = 'hello@gdgsydney.com';
const SESSION_EXPIRED = 'You have been signed out. Please sign in again to carry on.';

// ---------------------------------------------------------------------------------------
// Signing in and out
// ---------------------------------------------------------------------------------------

export async function requestPortalSignIn(
  email: string,
  honeypot: string
): Promise<{ sent: true } | { error: string }> {
  // A field people never see: pretend it worked and send nothing.
  if (honeypot.trim()) return { sent: true };
  if (!EMAIL_PATTERN.test(email.trim()) || email.length > 254) return { error: 'Please enter a valid email address.' };

  try {
    const result = await requestSignInLink(email);
    if (result.status === 'rate-limited') {
      const minutes = Math.ceil(result.retryAfterSeconds / 60);
      return {
        error:
          result.retryAfterSeconds <= 60
            ? 'We have just sent a link to this address. Please check your inbox, or try again in a minute.'
            : `We have sent several links to this address already. Please use the newest one, or try again in ${minutes} minutes.`,
      };
    }
    return { sent: true };
  } catch (error) {
    console.error('Portal sign-in link failed:', error);
    return { error: "We couldn't send your sign-in link just now. Please try again in a moment." };
  }
}

export async function completePortalSignIn(token: string): Promise<{ error: string }> {
  let email: string | null;
  try {
    email = await signInWithLink(token);
  } catch (error) {
    console.error('Portal sign-in failed:', error);
    return { error: "We couldn't sign you in just now. Please try the link again in a moment." };
  }
  if (!email) return { error: 'This sign-in link has already been used or has run out. Please ask for a new one.' };
  redirect('/portal');
}

export async function signOutOfPortal(): Promise<void> {
  try {
    await endPortalSession();
  } catch (error) {
    // The cookie is cleared regardless; a session document left behind runs out on its own.
    console.error('Portal sign-out could not delete the session:', error);
  }
  redirect('/portal/sign-in');
}

// ---------------------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------------------

function validateProfile(fields: PortalProfileFields): { error: string } | { values: PortalProfileFields } {
  const tagline = String(fields.tagline ?? '').trim();
  const bio = String(fields.bio ?? '').trim();
  if (tagline.length > PORTAL_PROFILE_LIMITS.tagline) return { error: `Your tagline can be up to ${PORTAL_PROFILE_LIMITS.tagline} characters.` };
  if (bio.length > PORTAL_PROFILE_LIMITS.bio) return { error: `Your bio can be up to ${PORTAL_PROFILE_LIMITS.bio} characters.` };

  const links = {} as Pick<PortalProfileFields, 'linkedinUrl' | 'githubUrl' | 'websiteUrl'>;
  for (const key of ['linkedinUrl', 'githubUrl', 'websiteUrl'] as const) {
    const raw = String(fields[key] ?? '').trim();
    const normalised = normaliseProfileUrl(raw);
    if (raw && !normalised) return { error: `Your ${PORTAL_PROFILE_FIELD_LABELS[key]} link isn't a web address.` };
    if (normalised.length > PORTAL_PROFILE_LIMITS.link) return { error: `Your ${PORTAL_PROFILE_FIELD_LABELS[key]} link is too long.` };
    links[key] = normalised;
  }
  return { values: { tagline, bio, ...links } };
}

// Edits go live straight away (decided 2026-11-14) and hello@ hears about each one, so an
// organiser can catch anything that shouldn't be on a public page. Never fails the save.
async function notifyProfileChange(speakerName: string, speakerEmail: string, changes: { label: string; before: string; after: string }[]) {
  if (changes.length === 0) return;
  const font = "font-family:'Google Sans',Roboto,sans-serif;";
  const rows = changes
    .map(
      (change) => `
      <tr><td style="padding:16px 0;border-top:1px solid #3c4043;">
        <p style="margin:0 0 6px;${font}font-size:13px;font-weight:700;color:#9aa0a6;">${escapeHtml(change.label)}</p>
        <p style="margin:0 0 4px;${font}font-size:14px;color:#9aa0a6;text-decoration:line-through;white-space:pre-wrap;">${escapeHtml(change.before || '(empty)')}</p>
        <p style="margin:0;${font}font-size:15px;color:#f0f0f0;white-space:pre-wrap;">${escapeHtml(change.after || '(empty)')}</p>
      </td></tr>`
    )
    .join('');
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: `GDG Sydney <${process.env.RESEND_FROM_EMAIL}>`,
      to: ORGANISER_INBOX,
      replyTo: speakerEmail,
      subject: `Speaker profile updated: ${speakerName}`,
      html: `<!DOCTYPE html><html lang="en"><body style="margin:0;padding:32px 16px;background:#1e1e1e;${font}color:#f0f0f0;">
        <table width="560" cellpadding="0" cellspacing="0" align="center"><tr><td>
          <p style="margin:0 0 20px;${font}font-size:16px;line-height:1.6;color:#f0f0f0;">${escapeHtml(speakerName)} changed their profile in the speaker portal. The change is already live in the public API. Reply to reach them.</p>
          <table width="100%" cellpadding="0" cellspacing="0">${rows}</table>
        </td></tr></table>
      </body></html>`,
    });
  } catch (error) {
    console.error('Profile change notice failed for', speakerEmail, error);
  }
}

export async function updatePortalProfile(speakerId: string, fields: PortalProfileFields): Promise<{ error?: string }> {
  const validated = validateProfile(fields);
  if ('error' in validated) return validated;

  try {
    const session = await getPortalSession();
    if (!session) return { error: SESSION_EXPIRED };
    const profile = await loadOwnedProfile(session.email, speakerId);
    if (!profile) return { error: "We couldn't find this profile under your email address." };

    const changes = (Object.keys(validated.values) as (keyof PortalProfileFields)[])
      .filter((key) => validated.values[key] !== profile[key])
      .map((key) => ({ label: PORTAL_PROFILE_FIELD_LABELS[key], before: profile[key], after: validated.values[key] }));
    if (changes.length === 0) return {};

    await adminDb.collection('speakers').doc(speakerId).update({ ...validated.values });
    await notifyProfileChange(profile.name, session.email, changes);
    revalidatePath('/portal', 'layout');
    revalidatePath('/admin/people');
    revalidatePath('/admin/speakers');
    return {};
  } catch (error) {
    console.error('Portal profile save failed:', error);
    return { error: "We couldn't save your profile just now. Please try again in a moment." };
  }
}

export async function uploadPortalPhoto(speakerId: string, formData: FormData): Promise<{ error?: string; photoUrl?: string }> {
  try {
    const session = await getPortalSession();
    if (!session) return { error: SESSION_EXPIRED };
    const profile = await loadOwnedProfile(session.email, speakerId);
    if (!profile) return { error: "We couldn't find this profile under your email address." };

    const result = await replaceSpeakerPhoto(speakerId, formData.get('photo'));
    if ('error' in result) return result;
    await notifyProfileChange(profile.name, session.email, [{ label: 'Photo', before: profile.photoUrl, after: result.photoUrl }]);
    revalidatePath('/portal', 'layout');
    revalidatePath('/admin/people');
    revalidatePath('/admin/speakers');
    return { photoUrl: result.photoUrl };
  } catch (error) {
    console.error('Portal photo upload failed:', error);
    return { error: "We couldn't upload your photo just now. Please try again in a moment." };
  }
}

export async function removePortalPhoto(speakerId: string): Promise<{ error?: string }> {
  try {
    const session = await getPortalSession();
    if (!session) return { error: SESSION_EXPIRED };
    const profile = await loadOwnedProfile(session.email, speakerId);
    if (!profile) return { error: "We couldn't find this profile under your email address." };

    const failure = await clearSpeakerPhoto(speakerId);
    if (failure) return failure;
    await notifyProfileChange(profile.name, session.email, [{ label: 'Photo', before: profile.photoUrl, after: '' }]);
    revalidatePath('/portal', 'layout');
    revalidatePath('/admin/people');
    revalidatePath('/admin/speakers');
    return {};
  } catch (error) {
    console.error('Portal photo removal failed:', error);
    return { error: "We couldn't remove your photo just now. Please try again in a moment." };
  }
}

// ---------------------------------------------------------------------------------------
// Saved talks (src/lib/portalSavedTalks.ts)
// ---------------------------------------------------------------------------------------

function cleanSavedTalk(fields: SavedTalkFields): SavedTalkFields {
  return {
    talkTitle: String(fields.talkTitle ?? '').trim(),
    abstract: String(fields.abstract ?? '').trim(),
    audience: String(fields.audience ?? '').trim(),
  };
}

// Creates a saved talk, or updates one when savedTalkId is given. Returns its id.
export async function saveTalkForLater(
  savedTalkId: string | null,
  fields: SavedTalkFields
): Promise<{ error: string } | { savedTalkId: string }> {
  const values = cleanSavedTalk(fields);
  const problem = findSavedTalkError(values);
  if (problem) return { error: problem };

  try {
    const session = await getPortalSession();
    if (!session) return { error: SESSION_EXPIRED };

    if (savedTalkId) {
      const existing = await loadOwnedSavedTalk(session.email, savedTalkId);
      if (!existing) return { error: "We couldn't find this talk among your saved talks." };
      await adminDb.collection('savedTalks').doc(savedTalkId).update({ ...values, updatedAt: FieldValue.serverTimestamp() });
      revalidatePath('/portal', 'layout');
      return { savedTalkId };
    }

    const count = (await adminDb.collection('savedTalks').where('ownerEmail', '==', session.email).count().get()).data().count;
    if (count >= MAX_SAVED_TALKS) {
      return { error: `You can keep up to ${MAX_SAVED_TALKS} saved talks. Delete one you no longer need to add another.` };
    }
    const created = await adminDb.collection('savedTalks').add({
      ...values,
      ownerEmail: session.email,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    revalidatePath('/portal', 'layout');
    return { savedTalkId: created.id };
  } catch (error) {
    console.error('Saving a talk failed:', error);
    return { error: "We couldn't save your talk just now. Please try again in a moment." };
  }
}

// Deletes the saved talk only. Proposals made from it are copies and stay as they are.
export async function deleteSavedTalk(savedTalkId: string): Promise<{ error?: string }> {
  try {
    const session = await getPortalSession();
    if (!session) return { error: SESSION_EXPIRED };
    const existing = await loadOwnedSavedTalk(session.email, savedTalkId);
    if (!existing) return { error: "We couldn't find this talk among your saved talks." };
    await adminDb.collection('savedTalks').doc(savedTalkId).delete();
    revalidatePath('/portal', 'layout');
    return {};
  } catch (error) {
    console.error('Deleting a saved talk failed:', error);
    return { error: "We couldn't delete this talk just now. Please try again in a moment." };
  }
}

// ---------------------------------------------------------------------------------------
// Proposals
// ---------------------------------------------------------------------------------------

export interface PortalProposalInput {
  kind: 'meetup' | 'devfest';
  // The person proposing, when the address has a profile; null for a first-time speaker,
  // who types their name instead.
  profileId: string | null;
  name: string;
  // The saved talk this proposal starts from, if any; recorded on the proposal.
  savedTalkId: string | null;
  // The rest of the form, checked by the same validator as the public endpoint.
  fields: Record<string, unknown>;
}

// Files a proposal under the signed-in address, through the same validation, storage and
// confirmation email as the form endpoints, so the admin can't tell the two apart except by
// its source. The email is always the session's, never the form's, and the name is the
// profile's when there is one.
export async function submitPortalProposal(input: PortalProposalInput): Promise<{ error?: string }> {
  let session;
  try {
    session = await getPortalSession();
  } catch (error) {
    console.error('Portal session check failed:', error);
    return { error: "We couldn't check that you're signed in. Please try again in a moment." };
  }
  if (!session) return { error: SESSION_EXPIRED };

  let name = String(input.name ?? '').trim();
  if (input.profileId) {
    try {
      const profile = await loadOwnedProfile(session.email, input.profileId);
      if (!profile) return { error: "We couldn't find this profile under your email address." };
      name = profile.name;
    } catch (error) {
      console.error('Portal proposal profile read failed:', error);
      return { error: "We couldn't read your profile just now. Please try again in a moment." };
    }
  }
  const body = { ...input.fields, name, email: session.email };

  // Only recorded when the address owns it, so a proposal can't be tied to someone else's.
  let savedTalkId: string | null = null;
  if (input.savedTalkId) {
    try {
      savedTalkId = (await loadOwnedSavedTalk(session.email, input.savedTalkId))?.id ?? null;
    } catch (error) {
      console.error('Portal proposal saved-talk read failed:', error);
    }
  }

  if (input.kind === 'meetup') {
    let proposal;
    try {
      proposal = validateMeetupProposal(body);
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Please check your proposal and try again.' };
    }
    try {
      await fileMeetupProposal(proposal, 'speaker-portal', savedTalkId);
    } catch (error) {
      console.error('Portal meetup proposal failed:', error);
      return { error: "We couldn't save your proposal. Please try again in a moment." };
    }
  } else {
    const flowState = await currentDevfestFlowState('cfs');
    if (flowState.state === 'unreadable') {
      return { error: "We couldn't check whether we're taking proposals right now. Please try again in a moment." };
    }
    if (flowState.state !== 'open') return { error: 'The Call for Speakers has closed, so we can no longer accept proposals.' };

    let submission;
    try {
      submission = validateDevfestProposal({ ...body, tracking: { ref: 'speaker-portal' } });
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Please check your proposal and try again.' };
    }
    try {
      const eventName = (await loadCurrentDevfest())?.name ?? 'DevFest Sydney';
      await fileDevfestProposal(submission, flowState.eventId, eventName, savedTalkId);
    } catch (error) {
      console.error('Portal DevFest proposal failed:', error);
      return { error: "We couldn't save your proposal. Please try again in a moment." };
    }
  }

  revalidatePath('/portal');
  return {};
}
