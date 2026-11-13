import { adminDb } from '@/lib/firebase-admin';

// The proposal behind a talk, wherever it came from (stage 4f): a DevFest Call for Speakers
// proposal in `submissions`, or a /speak proposal for a general event in `meetupProposals`.
// Both record the same acceptance and confirmation fields (acceptanceEmailSentAt,
// confirmByDate, speakerConfirmedAt, status, eventId), so /speaker/confirm and the speaker
// rows treat them alike. Firestore ids are unique across collections, so one confirm token
// format (an HMAC of the id) serves both, and links already sent keep working.

export type ProposalCollection = 'submissions' | 'meetupProposals';

export interface SpeakerProposal {
  collection: ProposalCollection;
  ref: FirebaseFirestore.DocumentReference;
  data: FirebaseFirestore.DocumentData;
}

export async function loadSpeakerProposal(proposalId: string): Promise<SpeakerProposal | null> {
  if (!proposalId) return null;
  for (const collection of ['submissions', 'meetupProposals'] as const) {
    const ref = adminDb.collection(collection).doc(proposalId);
    const snapshot = await ref.get();
    if (snapshot.exists) return { collection, ref, data: snapshot.data()! };
  }
  return null;
}
