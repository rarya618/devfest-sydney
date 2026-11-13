'use server';

import { revalidatePath } from 'next/cache';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAdminSession } from '@/lib/adminSession';
import type { MeetupProposalStatus } from '@/lib/types';

// Review only for now: deciding a proposal records the decision and nothing else. No email
// goes to the speaker from here yet, since what "accepted" leads to (a meetup date, a
// confirm link) waits on the events model in stage 4 of the plan in PM.md. Organisers reply
// from hello@gdgsydney.com in the meantime.

async function setMeetupProposalStatus(
  proposalId: string,
  status: MeetupProposalStatus,
  failureMessage: string
): Promise<{ error?: string }> {
  let reviewerName: string;
  try {
    ({ name: reviewerName } = await verifyAdminSession());
  } catch {
    return { error: 'Your session has expired. Please sign in again.' };
  }

  try {
    await adminDb.collection('meetupProposals').doc(proposalId).update({
      status,
      statusChangedAt: FieldValue.serverTimestamp(),
      statusChangedBy: reviewerName,
    });
    revalidatePath('/admin/meetups');
    return {};
  } catch {
    return { error: failureMessage };
  }
}

export async function acceptMeetupProposal(proposalId: string): Promise<{ error?: string }> {
  return setMeetupProposalStatus(proposalId, 'accepted', 'Could not accept this proposal. Please try again.');
}

export async function rejectMeetupProposal(proposalId: string): Promise<{ error?: string }> {
  return setMeetupProposalStatus(proposalId, 'rejected', 'Could not reject this proposal. Please try again.');
}

export async function restoreMeetupProposal(proposalId: string): Promise<{ error?: string }> {
  return setMeetupProposalStatus(proposalId, 'pending', 'Could not move this proposal back to pending. Please try again.');
}

export async function archiveMeetupProposal(proposalId: string): Promise<{ error?: string }> {
  return setMeetupProposalStatus(proposalId, 'archived', 'Could not archive this proposal. Please try again.');
}

export async function addMeetupReviewerNote(proposalId: string, text: string): Promise<{ error?: string }> {
  let authorName: string;
  try {
    ({ name: authorName } = await verifyAdminSession());
  } catch {
    return { error: 'Your session has expired. Please sign in again.' };
  }

  const trimmed = text.trim();
  if (!trimmed) return { error: 'Note can\'t be empty.' };
  if (trimmed.length > 2000) return { error: 'Note is too long (max 2000 characters).' };

  try {
    const proposalRef = adminDb.collection('meetupProposals').doc(proposalId);
    const snapshot = await proposalRef.get();
    if (!snapshot.exists) return { error: 'This proposal no longer exists.' };

    await proposalRef.update({
      reviewerNotes: FieldValue.arrayUnion({ text: trimmed, authorName, createdAt: Timestamp.now() }),
    });
    revalidatePath('/admin/meetups');
    return {};
  } catch {
    return { error: 'Could not save this note. Please try again.' };
  }
}
