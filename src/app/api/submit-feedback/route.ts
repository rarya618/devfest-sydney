import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { validateFeedback, type FeedbackFields } from '@/lib/feedback';

// The post-event survey. No confirmation email: most responses are anonymous, and an
// email address, when given, is only so an organiser can reply to what someone wrote.
export async function POST(request: NextRequest) {
  let response: FeedbackFields;

  try {
    response = await validateFeedback(await request.json());
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Invalid request.' },
      { status: 400 }
    );
  }

  try {
    await adminDb.collection('feedback').add({
      ...response,
      submittedAt: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error('Firestore write failed for feedback response:', error);
    return NextResponse.json(
      { message: 'We couldn\'t save your feedback. Please try again in a moment.' },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
