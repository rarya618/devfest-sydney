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

export async function acceptVolunteer(volunteerId: string): Promise<{ error?: string }> {
  try {
    await verifyAdminSession();
  } catch {
    return { error: 'Your session has expired. Please sign in again.' };
  }

  try {
    await adminDb.collection('volunteers').doc(volunteerId).update({ status: 'accepted' });
    revalidatePath('/admin/volunteers');
    return {};
  } catch {
    return { error: 'Could not accept this volunteer. Please try again.' };
  }
}

export async function rejectVolunteer(volunteerId: string): Promise<{ error?: string }> {
  try {
    await verifyAdminSession();
  } catch {
    return { error: 'Your session has expired. Please sign in again.' };
  }

  try {
    await adminDb.collection('volunteers').doc(volunteerId).update({ status: 'rejected' });
    revalidatePath('/admin/volunteers');
    return {};
  } catch {
    return { error: 'Could not reject this volunteer. Please try again.' };
  }
}

export async function restoreVolunteer(volunteerId: string): Promise<{ error?: string }> {
  try {
    await verifyAdminSession();
  } catch {
    return { error: 'Your session has expired. Please sign in again.' };
  }

  try {
    await adminDb.collection('volunteers').doc(volunteerId).update({ status: 'pending' });
    revalidatePath('/admin/volunteers');
    return {};
  } catch {
    return { error: 'Could not restore this volunteer. Please try again.' };
  }
}

export async function archiveVolunteer(volunteerId: string): Promise<{ error?: string }> {
  try {
    await verifyAdminSession();
  } catch {
    return { error: 'Your session has expired. Please sign in again.' };
  }

  try {
    await adminDb.collection('volunteers').doc(volunteerId).update({ status: 'archived' });
    revalidatePath('/admin/volunteers');
    return {};
  } catch {
    return { error: 'Could not archive this volunteer. Please try again.' };
  }
}

export async function addVolunteerReviewerNote(volunteerId: string, text: string): Promise<{ error?: string }> {
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
    const volunteerRef = adminDb.collection('volunteers').doc(volunteerId);
    const snap = await volunteerRef.get();
    if (!snap.exists) return { error: 'Volunteer signup not found.' };

    await volunteerRef.update({
      reviewerNotes: FieldValue.arrayUnion({
        text: trimmed,
        authorName,
        createdAt: Timestamp.now(),
      }),
    });

    revalidatePath('/admin/volunteers');
    return {};
  } catch {
    return { error: 'Could not save this note. Please try again.' };
  }
}
