'use server';

import { revalidatePath } from 'next/cache';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAdminSession } from '@/lib/adminSession';
import type { JobBoardStatus } from '@/lib/types';

export type JobBoardCollection = 'jobListings' | 'jobSeekers';

const NOUNS: Record<JobBoardCollection, string> = {
  jobListings: 'role',
  jobSeekers: 'profile',
};

function revalidateJobBoard() {
  revalidatePath('/admin/jobs');
  revalidatePath('/jobs');
  revalidatePath('/jobs/people');
}

export async function setJobBoardStatus(
  collection: JobBoardCollection,
  documentId: string,
  status: JobBoardStatus
): Promise<{ error?: string }> {
  try {
    await verifyAdminSession();
  } catch {
    return { error: 'Your session has expired. Please sign in again.' };
  }

  try {
    const documentRef = adminDb.collection(collection).doc(documentId);
    const snapshot = await documentRef.get();
    if (!snapshot.exists) return { error: `This ${NOUNS[collection]} no longer exists. Refresh the page.` };

    // approvedAt is what the public board sorts by, so it is set on the first approval
    // only: taking a post down and putting it back up shouldn't jump it to the top.
    const update: Record<string, unknown> = { status };
    if (status === 'approved' && !snapshot.get('approvedAt')) update.approvedAt = FieldValue.serverTimestamp();

    await documentRef.update(update);
    revalidateJobBoard();
    return {};
  } catch {
    return { error: `Could not update this ${NOUNS[collection]}. Please try again.` };
  }
}

// Sponsor priority is an admin decision, never a field the employer fills in. An empty
// id unlinks the listing.
export async function setJobListingSponsor(listingId: string, sponsorId: string): Promise<{ error?: string }> {
  try {
    await verifyAdminSession();
  } catch {
    return { error: 'Your session has expired. Please sign in again.' };
  }

  try {
    if (sponsorId) {
      const sponsor = await adminDb.collection('sponsors').doc(sponsorId).get();
      if (!sponsor.exists) return { error: 'That sponsor no longer exists. Refresh the page.' };
    }
    await adminDb.collection('jobListings').doc(listingId).update({ sponsorId });
    revalidateJobBoard();
    return {};
  } catch {
    return { error: 'Could not change the sponsor on this role. Please try again.' };
  }
}

// For removal requests. Archiving hides a post but keeps the personal details; someone who
// asks for their profile to be removed should have it actually gone.
export async function deleteJobBoardEntry(collection: JobBoardCollection, documentId: string): Promise<{ error?: string }> {
  try {
    await verifyAdminSession();
  } catch {
    return { error: 'Your session has expired. Please sign in again.' };
  }

  try {
    await adminDb.collection(collection).doc(documentId).delete();
    revalidateJobBoard();
    return {};
  } catch {
    return { error: `Could not delete this ${NOUNS[collection]}. Please try again.` };
  }
}
