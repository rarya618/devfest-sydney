'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

const SESSION_COOKIE_NAME = '__session';

async function verifyAdminSession(): Promise<{ email: string; name: string }> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) throw new Error('No session.');
  const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
  if (!decoded.email) throw new Error('No email on session.');

  const adminDoc = await adminDb.collection('admins').doc(decoded.email).get();
  if (!adminDoc.exists) throw new Error('Not an admin.');

  return { email: decoded.email, name: adminDoc.data()?.name || decoded.email };
}

async function setShowcaseStatus(
  entryId: string,
  status: 'pending' | 'accepted' | 'rejected' | 'archived',
  failureMessage: string
): Promise<{ error?: string }> {
  try {
    await verifyAdminSession();
  } catch {
    return { error: 'Your session has expired. Please sign in again.' };
  }

  try {
    await adminDb.collection('showcase').doc(entryId).update({ status });
    revalidatePath('/admin/showcase');
    return {};
  } catch {
    return { error: failureMessage };
  }
}

export async function acceptShowcaseEntry(entryId: string): Promise<{ error?: string }> {
  return setShowcaseStatus(entryId, 'accepted', 'Could not accept this demo. Please try again.');
}

export async function rejectShowcaseEntry(entryId: string): Promise<{ error?: string }> {
  return setShowcaseStatus(entryId, 'rejected', 'Could not reject this demo. Please try again.');
}

export async function restoreShowcaseEntry(entryId: string): Promise<{ error?: string }> {
  return setShowcaseStatus(entryId, 'pending', 'Could not restore this demo. Please try again.');
}

export async function archiveShowcaseEntry(entryId: string): Promise<{ error?: string }> {
  return setShowcaseStatus(entryId, 'archived', 'Could not archive this demo. Please try again.');
}

export async function addShowcaseReviewerNote(entryId: string, text: string): Promise<{ error?: string }> {
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
    const entryRef = adminDb.collection('showcase').doc(entryId);
    const snap = await entryRef.get();
    if (!snap.exists) return { error: 'Showcase entry not found.' };

    await entryRef.update({
      reviewerNotes: FieldValue.arrayUnion({
        text: trimmed,
        authorName,
        createdAt: Timestamp.now(),
      }),
    });

    revalidatePath('/admin/showcase');
    return {};
  } catch {
    return { error: 'Could not save this note. Please try again.' };
  }
}
