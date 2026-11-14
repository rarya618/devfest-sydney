import { createHash } from 'node:crypto';
import { Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';

// Rate limits for /api/submit-meetup-proposal, the public endpoint behind gdgsydney.com/speak.
// It is documented for AI agents in gdgsydney.com/llms.txt, and every proposal emails a
// confirmation to the address it gives, so without a limit it could be used to flood someone's
// inbox or the organisers' queue. Two limits, checked together in one transaction:
//
// - Per address: a few proposals a day. Several proposals per person are allowed by design
//   (see PM.md), so this is a ceiling, not a dedupe.
// - Site-wide: a cap on all public proposals in an hour. Proposals arrive a few a month, so
//   this is only reached by a flood with changing addresses. Not per IP: behind App Hosting's
//   load balancer the leading X-Forwarded-For entry is the client's to set.
//
// The speaker portal files proposals through fileMeetupProposal directly, signed in, so it
// isn't limited here. Admin SDK only, with no match block in firestore.rules. Document ids are
// SHA-256 hashes of the address (plus one `site` document), so the collection holds no emails.

const COLLECTION = 'meetupProposalRequests';
const SITE_DOC = 'site';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const MAX_PER_ADDRESS_PER_DAY = 3;
const MAX_SITE_WIDE_PER_HOUR = 20;

export type MeetupProposalAllowance = { allowed: true } | { allowed: false; retryAfterSeconds: number };

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function within(timestamps: unknown, windowMs: number, now: number): number[] {
  return (Array.isArray(timestamps) ? timestamps : []).filter(
    (sentAt): sentAt is number => typeof sentAt === 'number' && now - sentAt < windowMs
  );
}

// Records the attempt when it is allowed, so call it only once the proposal has passed
// validation and is about to be filed.
export async function claimMeetupProposalSlot(email: string): Promise<MeetupProposalAllowance> {
  const now = Date.now();
  const addressRef = adminDb.collection(COLLECTION).doc(sha256(email.trim().toLowerCase()));
  const siteRef = adminDb.collection(COLLECTION).doc(SITE_DOC);

  return adminDb.runTransaction(async (transaction) => {
    const [addressSnapshot, siteSnapshot] = await Promise.all([transaction.get(addressRef), transaction.get(siteRef)]);
    const addressRecent = within(addressSnapshot.data()?.sentAtMillis, DAY_MS, now);
    const siteRecent = within(siteSnapshot.data()?.sentAtMillis, HOUR_MS, now);

    if (addressRecent.length >= MAX_PER_ADDRESS_PER_DAY) {
      return { allowed: false, retryAfterSeconds: Math.ceil((DAY_MS - (now - Math.min(...addressRecent))) / 1000) };
    }
    if (siteRecent.length >= MAX_SITE_WIDE_PER_HOUR) {
      return { allowed: false, retryAfterSeconds: Math.ceil((HOUR_MS - (now - Math.min(...siteRecent))) / 1000) };
    }

    // expiresAt is for a Firestore TTL policy on this collection, like the portal's.
    transaction.set(addressRef, { sentAtMillis: [...addressRecent, now], expiresAt: Timestamp.fromMillis(now + DAY_MS) });
    transaction.set(siteRef, { sentAtMillis: [...siteRecent, now], expiresAt: Timestamp.fromMillis(now + HOUR_MS) });
    return { allowed: true };
  });
}
