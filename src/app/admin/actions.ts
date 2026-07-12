'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

const SESSION_COOKIE_NAME = '__session';

async function verifyAdminSession(): Promise<{ email: string }> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) throw new Error('No session.');
  const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
  if (!decoded.email) throw new Error('No email on session.');
  return { email: decoded.email };
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function addAdmin(email: string, name: string): Promise<{ error?: string }> {
  let currentAdminEmail: string;
  try {
    ({ email: currentAdminEmail } = await verifyAdminSession());
  } catch {
    return { error: 'Your session has expired. Please sign in again.' };
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!EMAIL_PATTERN.test(normalizedEmail)) {
    return { error: 'Please enter a valid email address.' };
  }

  try {
    const adminRef = adminDb.collection('admins').doc(normalizedEmail);
    const existing = await adminRef.get();
    if (existing.exists) {
      return { error: 'This person already has admin access.' };
    }

    await adminRef.set({
      name: name.trim(),
      addedAt: FieldValue.serverTimestamp(),
      addedBy: currentAdminEmail,
    });

    revalidatePath('/admin');
    return {};
  } catch {
    return { error: 'Could not add this admin. Please try again.' };
  }
}

export async function promoteSubmission(submissionId: string): Promise<{ error?: string }> {
  try {
    await verifyAdminSession();
  } catch {
    return { error: 'Your session has expired. Please sign in again.' };
  }

  try {
    const submissionRef = adminDb.collection('submissions').doc(submissionId);
    const snap = await submissionRef.get();
    if (!snap.exists) return { error: 'Submission not found.' };

    const data = snap.data()!;

    await adminDb.collection('speakers').add({
      name: data.name,
      email: data.email,
      talkTitle: data.talkTitle,
      abstract: data.abstract,
      format: data.format,
      track: data.track,
      experienceLevel: data.experienceLevel,
      socialLinks: data.socialLinks ?? '',
      submissionId,
      promotedAt: FieldValue.serverTimestamp(),
      bio: '',
      photoUrl: '',
    });

    await submissionRef.update({ status: 'accepted' });
    revalidatePath('/admin');
    return {};
  } catch {
    return { error: 'Could not promote this submission. Please try again.' };
  }
}

export async function rejectSubmission(submissionId: string): Promise<{ error?: string }> {
  try {
    await verifyAdminSession();
  } catch {
    return { error: 'Your session has expired. Please sign in again.' };
  }

  try {
    await adminDb.collection('submissions').doc(submissionId).update({ status: 'rejected' });
    revalidatePath('/admin');
    return {};
  } catch {
    return { error: 'Could not reject this submission. Please try again.' };
  }
}

export async function restoreSubmission(submissionId: string): Promise<{ error?: string }> {
  try {
    await verifyAdminSession();
  } catch {
    return { error: 'Your session has expired. Please sign in again.' };
  }

  try {
    await adminDb.collection('submissions').doc(submissionId).update({ status: 'pending' });
    revalidatePath('/admin');
    return {};
  } catch {
    return { error: 'Could not restore this submission. Please try again.' };
  }
}
