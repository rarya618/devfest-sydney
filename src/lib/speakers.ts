import { adminDb } from '@/lib/firebase-admin';
import type { Speaker, SpeakerConfirmation } from '@/lib/types';
import type { Timestamp } from 'firebase-admin/firestore';

interface SubmissionConfirmationFields {
  acceptanceEmailSentAt?: Timestamp;
  speakerConfirmedAt?: Timestamp;
}

function toConfirmation(submission: SubmissionConfirmationFields | undefined): SpeakerConfirmation {
  if (!submission) return 'unknown';
  if (submission.speakerConfirmedAt) return 'confirmed';
  if (submission.acceptanceEmailSentAt) return 'awaiting';
  return 'not-emailed';
}

// Speakers are the public lineup, but whether each one has actually confirmed lives on
// the submission they were promoted from, so the two are joined here.
export async function fetchSpeakers(): Promise<Speaker[]> {
  const snapshot = await adminDb
    .collection('speakers')
    .orderBy('promotedAt', 'desc')
    .get();

  const submissionIds = snapshot.docs
    .map((doc) => doc.data().submissionId as string | undefined)
    .filter((submissionId): submissionId is string => Boolean(submissionId));

  const submissionRefs = submissionIds.map((submissionId) => adminDb.collection('submissions').doc(submissionId));
  const submissionSnapshots = submissionRefs.length > 0 ? await adminDb.getAll(...submissionRefs) : [];
  const submissionsById = new Map<string, SubmissionConfirmationFields>();
  submissionSnapshots.forEach((submissionSnapshot) => {
    if (submissionSnapshot.exists) {
      submissionsById.set(submissionSnapshot.id, submissionSnapshot.data() as SubmissionConfirmationFields);
    }
  });

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    const promotedAt = data.promotedAt as Timestamp | undefined;
    const submissionId: string = data.submissionId ?? '';
    return {
      id: doc.id,
      name: data.name ?? '',
      email: data.email ?? '',
      talkTitle: data.talkTitle ?? '',
      abstract: data.abstract ?? '',
      format: data.format ?? 'talk',
      track: data.track ?? 'developer',
      experienceLevel: data.experienceLevel ?? 'beginner',
      linkedinUrl: data.linkedinUrl ?? '',
      githubUrl: data.githubUrl ?? '',
      websiteUrl: data.websiteUrl ?? '',
      bio: data.bio ?? '',
      tagline: data.tagline ?? '',
      photoUrl: data.photoUrl ?? '',
      submissionId,
      promotedAt: promotedAt ? promotedAt.toDate().toISOString() : new Date().toISOString(),
      confirmation: toConfirmation(submissionsById.get(submissionId)),
    } satisfies Speaker;
  });
}
