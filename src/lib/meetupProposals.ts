import { adminDb } from '@/lib/firebase-admin';
import { MEETUP_FORMATS } from '@/lib/meetupProposalLabels';
import type { MeetupFormat, MeetupProposal, MeetupProposalStatus, ReviewerNote } from '@/lib/types';
import type { Timestamp } from 'firebase-admin/firestore';

const STATUSES: MeetupProposalStatus[] = ['pending', 'accepted', 'rejected', 'archived'];

export async function fetchMeetupProposals(): Promise<MeetupProposal[]> {
  const snapshot = await adminDb.collection('meetupProposals').orderBy('submittedAt', 'desc').get();

  return snapshot.docs.map((doc) => {
    const proposalData = doc.data();
    const submittedAt = proposalData.submittedAt as Timestamp | undefined;
    return {
      id: doc.id,
      name: proposalData.name ?? '',
      email: proposalData.email ?? '',
      profileUrl: proposalData.profileUrl ?? '',
      talkTitle: proposalData.talkTitle ?? '',
      format: MEETUP_FORMATS.includes(proposalData.format) ? (proposalData.format as MeetupFormat) : 'standard',
      abstract: proposalData.abstract ?? '',
      audience: proposalData.audience ?? '',
      bio: proposalData.bio ?? '',
      speakingExperience: proposalData.speakingExperience ?? '',
      notes: proposalData.notes ?? '',
      submittedAt: submittedAt ? submittedAt.toDate().toISOString() : new Date().toISOString(),
      status: STATUSES.includes(proposalData.status) ? (proposalData.status as MeetupProposalStatus) : 'pending',
      reviewerNotes: ((proposalData.reviewerNotes ?? []) as Array<{
        text?: string;
        authorName?: string;
        createdAt?: Timestamp;
      }>).map((note) => ({
        text: note.text ?? '',
        authorName: note.authorName ?? '',
        createdAt: note.createdAt ? note.createdAt.toDate().toISOString() : new Date().toISOString(),
      })) satisfies ReviewerNote[],
    } satisfies MeetupProposal;
  });
}
