import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { loadThanksRecipient, validateSpeakerGift, verifyThanksToken, type ThanksRecipient } from '@/lib/speakerThanks';
import type { SpeakerGiftFormFields } from '@/lib/speakerGiftLabels';

const BROKEN_LINK_MESSAGE =
  'We couldn\'t match this link to a speaker. Reply to the thank-you email and we\'ll sort it out.';

// The speaker's answer from /speaker/thanks. The token in the link is the only thing that
// says who they are, so it is checked again here rather than trusted from the page load.
// One document per speaker, overwritten on a second visit. No confirmation email: the
// page itself confirms, and there is nothing to send until the mug ships.
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid request.' }, { status: 400 });
  }

  let recipient: ThanksRecipient | null = null;
  try {
    const speakerId = typeof body.token === 'string' ? verifyThanksToken(body.token) : null;
    if (speakerId) recipient = await loadThanksRecipient(speakerId);
  } catch (error) {
    console.error('Could not check a speaker thanks token:', error);
    return NextResponse.json({ message: 'We couldn\'t save your details. Please try again in a moment.' }, { status: 500 });
  }
  if (!recipient) return NextResponse.json({ message: BROKEN_LINK_MESSAGE }, { status: 403 });

  let gift: SpeakerGiftFormFields;
  try {
    gift = validateSpeakerGift(body);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Invalid request.' },
      { status: 400 }
    );
  }

  try {
    await adminDb.collection('speakerGifts').doc(recipient.speakerId).set({
      ...gift,
      speakerName: recipient.name,
      speakerEmail: recipient.email,
      submittedAt: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error('Firestore write failed for speaker gift:', error);
    return NextResponse.json({ message: 'We couldn\'t save your details. Please try again in a moment.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
