import { adminDb } from '@/lib/firebase-admin';

// The records one event owns (stage 4b, PM.md). An equality filter only, with any ordering
// done in memory by the caller: a filter plus orderBy needs a composite index per
// collection, which would have to be deployed and finish building before the code that uses
// it, and these collections hold a few hundred documents at most. An empty event id (no
// events exist yet) matches nothing rather than everything.
export async function loadEventDocs(
  collectionName: string,
  eventId: string
): Promise<FirebaseFirestore.QueryDocumentSnapshot[]> {
  if (!eventId) return [];
  const snapshot = await adminDb.collection(collectionName).where('eventId', '==', eventId).get();
  return snapshot.docs;
}

// Newest first by submittedAt (an ISO string, so it sorts as text).
export function newestSubmittedFirst(first: { submittedAt: string }, second: { submittedAt: string }): number {
  return second.submittedAt.localeCompare(first.submittedAt);
}
