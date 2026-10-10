import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { creditRequestId, validateCreditRequest, type CreditRequestFields } from '@/lib/creditRequests';

// Credit requests for a workshop that couldn't run as planned. No confirmation email: the
// email that matters is the one with the credits, which an organiser sends later.
export async function POST(request: NextRequest) {
  let creditRequest: CreditRequestFields;

  try {
    creditRequest = await validateCreditRequest(await request.json());
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Invalid request.' },
      { status: 400 }
    );
  }

  try {
    await adminDb
      .collection('creditRequests')
      .doc(creditRequestId(creditRequest.workshopSlotId, creditRequest.email))
      .create({ ...creditRequest, submittedAt: FieldValue.serverTimestamp() });
  } catch (error) {
    // Already on the list for this workshop: as far as they are concerned, that's success.
    const isDuplicate = (error as { code?: number }).code === 6;
    if (!isDuplicate) {
      console.error('Firestore write failed for credit request:', error);
      return NextResponse.json(
        { message: 'We couldn\'t save your request. Please try again in a moment.' },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
