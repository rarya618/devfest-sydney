import { adminDb } from '@/lib/firebase-admin';
import type { ReviewerNote, ShowcaseSubmission } from '@/lib/types';
import type { Timestamp } from 'firebase-admin/firestore';

export async function fetchShowcaseSubmissions(): Promise<ShowcaseSubmission[]> {
  const snapshot = await adminDb
    .collection('showcase')
    .orderBy('submittedAt', 'desc')
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    const timestamp = data.submittedAt as Timestamp | undefined;
    return {
      id: doc.id,
      name: data.name ?? '',
      email: data.email ?? '',
      projectName: data.projectName ?? '',
      pitch: data.pitch ?? '',
      description: data.description ?? '',
      stage: data.stage ?? 'prototype',
      demoUrl: data.demoUrl ?? '',
      repoUrl: data.repoUrl ?? '',
      linkedinUrl: data.linkedinUrl ?? '',
      builtWith: data.builtWith ?? '',
      coPresenterNames: data.coPresenterNames ?? '',
      coPresenterEmails: data.coPresenterEmails ?? '',
      demoRequirements: data.demoRequirements ?? '',
      isFirstTimePresenter: data.isFirstTimePresenter ?? false,
      tracking: {
        utmSource: data.tracking?.utm_source ?? '',
        utmMedium: data.tracking?.utm_medium ?? '',
        utmCampaign: data.tracking?.utm_campaign ?? '',
        utmContent: data.tracking?.utm_content ?? '',
        utmTerm: data.tracking?.utm_term ?? '',
        ref: data.tracking?.ref ?? '',
      },
      submittedAt: timestamp ? timestamp.toDate().toISOString() : new Date().toISOString(),
      status: data.status ?? 'pending',
      reviewerNotes: ((data.reviewerNotes ?? []) as Array<{
        text?: string;
        authorName?: string;
        createdAt?: Timestamp;
      }>).map((note) => ({
        text: note.text ?? '',
        authorName: note.authorName ?? '',
        createdAt: note.createdAt ? note.createdAt.toDate().toISOString() : new Date().toISOString(),
      })) satisfies ReviewerNote[],
    } satisfies ShowcaseSubmission;
  });
}
