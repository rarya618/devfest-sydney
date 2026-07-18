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

  const adminDoc = await adminDb.collection('admins').doc(decoded.email).get();
  if (!adminDoc.exists) throw new Error('Not an admin.');

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

export async function removeAdmin(email: string): Promise<{ error?: string }> {
  let currentAdminEmail: string;
  try {
    ({ email: currentAdminEmail } = await verifyAdminSession());
  } catch {
    return { error: 'Your session has expired. Please sign in again.' };
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (normalizedEmail === currentAdminEmail) {
    return { error: 'You can\'t remove your own admin access.' };
  }

  try {
    const adminsSnap = await adminDb.collection('admins').get();
    if (adminsSnap.size <= 1) {
      return { error: 'At least one admin must remain.' };
    }

    await adminDb.collection('admins').doc(normalizedEmail).delete();
    revalidatePath('/admin/admins');
    return {};
  } catch {
    return { error: 'Could not remove this admin. Please try again.' };
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
      linkedinUrl: data.linkedinUrl ?? '',
      githubUrl: data.githubUrl ?? '',
      websiteUrl: data.websiteUrl ?? '',
      submissionId,
      promotedAt: FieldValue.serverTimestamp(),
      bio: data.speakerBio ?? '',
      tagline: data.speakerTagline ?? '',
      photoUrl: '',
    });

    await submissionRef.update({ status: 'accepted' });
    revalidatePath('/admin');
    return {};
  } catch {
    return { error: 'Could not promote this submission. Please try again.' };
  }
}

export async function undoPromotion(submissionId: string): Promise<{ error?: string }> {
  try {
    await verifyAdminSession();
  } catch {
    return { error: 'Your session has expired. Please sign in again.' };
  }

  try {
    const speakersSnap = await adminDb
      .collection('speakers')
      .where('submissionId', '==', submissionId)
      .get();

    const batch = adminDb.batch();
    speakersSnap.docs.forEach((doc) => batch.delete(doc.ref));
    batch.update(adminDb.collection('submissions').doc(submissionId), { status: 'pending' });
    await batch.commit();

    revalidatePath('/admin');
    return {};
  } catch {
    return { error: 'Could not undo this acceptance. Please try again.' };
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

export async function deleteSubmission(submissionId: string): Promise<{ error?: string }> {
  try {
    await verifyAdminSession();
  } catch {
    return { error: 'Your session has expired. Please sign in again.' };
  }

  try {
    const submissionRef = adminDb.collection('submissions').doc(submissionId);
    const snap = await submissionRef.get();
    if (!snap.exists) return { error: 'Submission not found.' };
    if (snap.data()?.status === 'accepted') {
      return { error: 'Accepted submissions can\'t be deleted. Undo the acceptance first.' };
    }

    await submissionRef.delete();
    revalidatePath('/admin');
    return {};
  } catch {
    return { error: 'Could not delete this submission. Please try again.' };
  }
}
