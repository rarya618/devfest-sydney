import type { Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import type { SavedTalkFields } from '@/lib/portalLabels';

// `savedTalks/{id}`: talks a speaker keeps in the portal and proposes when they choose to
// (added 2026-11-14). Owned by an address (`ownerEmail`, normalised), like everything else in
// the portal. Not `talks`, which are talks accepted into an event. A saved talk stays after
// it is proposed, so it can go to a meetup now and a DevFest later; each proposal made from
// it records `savedTalkId`, and is a copy, so editing the saved talk changes no proposal.
// Server only.

export interface SavedTalk extends SavedTalkFields {
  id: string;
  updatedAt: string | null; // ISO
}

function toSavedTalk(id: string, data: FirebaseFirestore.DocumentData): SavedTalk {
  const updatedAt = data.updatedAt as Timestamp | undefined;
  return {
    id,
    talkTitle: typeof data.talkTitle === 'string' ? data.talkTitle : '',
    abstract: typeof data.abstract === 'string' ? data.abstract : '',
    audience: typeof data.audience === 'string' ? data.audience : '',
    updatedAt: updatedAt ? updatedAt.toDate().toISOString() : null,
  };
}

// Newest edit first.
export async function listSavedTalks(email: string): Promise<SavedTalk[]> {
  const snapshot = await adminDb.collection('savedTalks').where('ownerEmail', '==', email).get();
  return snapshot.docs
    .map((doc) => toSavedTalk(doc.id, doc.data()))
    .sort((first, second) => String(second.updatedAt).localeCompare(String(first.updatedAt)));
}

// One saved talk, only if the signed-in address owns it.
export async function loadOwnedSavedTalk(email: string, savedTalkId: string): Promise<SavedTalk | null> {
  if (!savedTalkId || savedTalkId.includes('/')) return null;
  const snapshot = await adminDb.collection('savedTalks').doc(savedTalkId).get();
  const data = snapshot.data();
  if (!data || data.ownerEmail !== email) return null;
  return toSavedTalk(snapshot.id, data);
}
