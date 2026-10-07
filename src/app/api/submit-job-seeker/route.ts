import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { Resend } from 'resend';
import { adminDb } from '@/lib/firebase-admin';
import { validateJobSeeker, type JobSeekerFields } from '@/lib/jobBoard';
import { buildJobBoardEmail, firstNameOf } from '@/lib/jobBoardEmail';

// Profiles land as pending and appear on /jobs/people only once an organiser approves
// them on /admin/jobs. The form requires a consent tick: someone saying they are looking
// for work is published under their name, so it must be something they asked for.
export async function POST(request: NextRequest) {
  let profile: JobSeekerFields;

  try {
    const body = await request.json();
    if (!body || typeof body !== 'object' || (body as Record<string, unknown>).consentToPublish !== true) {
      throw new Error('Please confirm you are happy for your profile to be shown publicly.');
    }
    profile = validateJobSeeker(body);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Invalid request.' },
      { status: 400 }
    );
  }

  try {
    await adminDb.collection('jobSeekers').add({
      ...profile,
      consentToPublish: true,
      status: 'pending',
      submittedAt: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error('Firestore write failed for job seeker profile:', profile.email, error);
    return NextResponse.json(
      { message: 'We couldn\'t save your profile. Please try again in a moment.' },
      { status: 500 }
    );
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: `GDG Sydney <${process.env.RESEND_FROM_EMAIL}>`,
      to: profile.email,
      bcc: 'hello@gdgsydney.com',
      replyTo: 'hello@gdgsydney.com',
      subject: `We've got your profile for the DevFest Sydney job board`,
      html: buildJobBoardEmail({
        firstName: firstNameOf(profile.name),
        heading: 'Your profile is in',
        recapTitle: profile.headline,
        recapSubtitle: profile.lookingFor,
        body: 'Thanks for adding yourself to the DevFest Sydney job board. An organiser will check it shortly, and it will appear on the board once approved. Employers will reach you through LinkedIn: we never publish your email address.',
      }),
    });
  } catch {
    console.error('Resend email failed for job seeker profile:', profile.email);
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
