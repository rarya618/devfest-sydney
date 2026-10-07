import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { Resend } from 'resend';
import { adminDb } from '@/lib/firebase-admin';
import { validateJobListing, type JobListingFields } from '@/lib/jobBoard';
import { buildJobBoardEmail, firstNameOf } from '@/lib/jobBoardEmail';

// Every role lands as pending and appears on /jobs only once an organiser approves it on
// /admin/jobs: anyone can reach this endpoint, and a scam listing would carry our name.
export async function POST(request: NextRequest) {
  let listing: JobListingFields;

  try {
    listing = validateJobListing(await request.json());
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Invalid request.' },
      { status: 400 }
    );
  }

  try {
    await adminDb.collection('jobListings').add({
      ...listing,
      // Never taken from the request: sponsor priority is assigned by an admin.
      sponsorId: '',
      status: 'pending',
      submittedAt: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error('Firestore write failed for job listing:', listing.contactEmail, error);
    return NextResponse.json(
      { message: 'We couldn\'t save your role. Please try again in a moment.' },
      { status: 500 }
    );
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: `GDG Sydney <${process.env.RESEND_FROM_EMAIL}>`,
      to: listing.contactEmail,
      // The bcc is how organisers find out there is something to review.
      bcc: 'hello@gdgsydney.com',
      replyTo: 'hello@gdgsydney.com',
      subject: `We've got your role for the DevFest Sydney job board`,
      html: buildJobBoardEmail({
        firstName: firstNameOf(listing.contactName),
        heading: 'Your role is in',
        recapTitle: listing.roleTitle,
        recapSubtitle: `${listing.companyName} · ${listing.location}`,
        body: 'Thanks for posting to the DevFest Sydney job board. An organiser will check it shortly, and it will appear on the board once approved.',
      }),
    });
  } catch {
    // Non-fatal: the listing is saved and will show up in the review queue regardless.
    console.error('Resend email failed for job listing:', listing.contactEmail);
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
