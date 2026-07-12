import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Resend } from 'resend';
import { FieldValue } from 'firebase-admin/firestore';

type TalkFormat = 'talk' | 'workshop' | 'lightning-talk';
type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
type Track = 'developer' | 'builder';

interface SubmissionPayload {
  name: string;
  email: string;
  talkTitle: string;
  abstract: string;
  format: TalkFormat;
  track: Track;
  experienceLevel: ExperienceLevel;
  socialLinks: string;
  previousTalkLink: string;
  requiresTravelSupport: boolean;
  isGoogleDeveloperExpert: boolean;
}

const VALID_FORMATS: TalkFormat[] = ['talk', 'workshop', 'lightning-talk'];
const VALID_TRACKS: Track[] = ['developer', 'builder'];
const VALID_LEVELS: ExperienceLevel[] = ['beginner', 'intermediate', 'advanced'];
const ABSTRACT_MAX = 2000;

const FORMAT_LABELS: Record<TalkFormat, string> = {
  talk: 'Talk (30 min)',
  workshop: 'Workshop (60 min)',
  'lightning-talk': 'Lightning Talk (10 min)',
};

const TRACK_LABELS: Record<Track, string> = {
  developer: 'Developer Track',
  builder: 'Builder Track',
};

const LEVEL_LABELS: Record<ExperienceLevel, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

function validatePayload(body: unknown): SubmissionPayload {
  if (!body || typeof body !== 'object') throw new Error('Invalid request body.');
  const b = body as Record<string, unknown>;

  if (typeof b.name !== 'string' || !b.name.trim()) throw new Error('Name is required.');
  if (typeof b.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email)) throw new Error('A valid email address is required.');
  if (typeof b.talkTitle !== 'string' || !b.talkTitle.trim()) throw new Error('Talk title is required.');
  if (typeof b.abstract !== 'string' || !b.abstract.trim()) throw new Error('Abstract is required.');
  if (b.abstract.length > ABSTRACT_MAX) throw new Error(`Abstract must be ${ABSTRACT_MAX} characters or fewer.`);
  if (!VALID_FORMATS.includes(b.format as TalkFormat)) throw new Error('Please select a valid talk format.');
  if (!VALID_TRACKS.includes(b.track as Track)) throw new Error('Please select a valid track.');
  if (!VALID_LEVELS.includes(b.experienceLevel as ExperienceLevel)) throw new Error('Please select a valid experience level.');

  return {
    name: b.name.trim(),
    email: b.email.trim().toLowerCase(),
    talkTitle: b.talkTitle.trim(),
    abstract: b.abstract.trim(),
    format: b.format as TalkFormat,
    track: b.track as Track,
    experienceLevel: b.experienceLevel as ExperienceLevel,
    socialLinks: typeof b.socialLinks === 'string' ? b.socialLinks.trim() : '',
    previousTalkLink: typeof b.previousTalkLink === 'string' ? b.previousTalkLink.trim() : '',
    requiresTravelSupport: b.requiresTravelSupport === true,
    isGoogleDeveloperExpert: b.isGoogleDeveloperExpert === true,
  };
}

function buildConfirmationEmail(submission: SubmissionPayload): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Proposal received — DevFest Sydney 2026</title>
</head>
<body style="margin:0;padding:0;background:#0f0f0f;font-family:'Google Sans',Arial,sans-serif;color:#e0e0e0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">

          <!-- Header -->
          <tr>
            <td style="padding:32px 36px 24px;border-bottom:1px solid rgba(255,255,255,0.06);">
              <div style="display:flex;align-items:center;gap:8px;">
                <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#4285F4;"></span>
                <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#EA4335;"></span>
                <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#f9ab00;"></span>
                <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#34A853;"></span>
              </div>
              <h1 style="margin:20px 0 4px;font-size:22px;font-weight:700;color:#ffffff;line-height:1.2;">
                Thanks for your proposal, ${submission.name.split(' ')[0]}!
              </h1>
              <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.45);">DevFest Sydney 2026 — Call for Speakers</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:28px 36px;">
              <p style="margin:0 0 20px;font-size:15px;color:rgba(255,255,255,0.7);line-height:1.6;">
                We've received your proposal and our team will review it shortly. We'll be in touch via this email address once a decision has been made.
              </p>

              <!-- Submission summary -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:12px;overflow:hidden;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.3);">Your submission</p>
                    <h2 style="margin:8px 0 16px;font-size:18px;font-weight:700;color:#ffffff;line-height:1.3;">${submission.talkTitle}</h2>
                    <table cellpadding="0" cellspacing="0" style="width:100%;">
                      <tr>
                        <td style="padding:4px 0;font-size:13px;color:rgba(255,255,255,0.4);width:44%;">Format</td>
                        <td style="padding:4px 0;font-size:13px;color:rgba(255,255,255,0.75);">${FORMAT_LABELS[submission.format]}</td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;font-size:13px;color:rgba(255,255,255,0.4);">Track</td>
                        <td style="padding:4px 0;font-size:13px;color:rgba(255,255,255,0.75);">${TRACK_LABELS[submission.track]}</td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;font-size:13px;color:rgba(255,255,255,0.4);">Experience level</td>
                        <td style="padding:4px 0;font-size:13px;color:rgba(255,255,255,0.75);">${LEVEL_LABELS[submission.experienceLevel]}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.35);line-height:1.6;">
                If you have any questions in the meantime, reply to this email. We look forward to seeing you at DevFest Sydney 2026.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 36px;border-top:1px solid rgba(255,255,255,0.06);">
              <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.2);">
                GDG Sydney &mdash; DevFest Sydney 2026 &mdash; Sydney CBD
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function POST(request: NextRequest) {
  let submission: SubmissionPayload;

  try {
    const body = await request.json();
    submission = validatePayload(body);
  } catch (err) {
    return NextResponse.json(
      { message: err instanceof Error ? err.message : 'Invalid request.' },
      { status: 400 }
    );
  }

  try {
    await adminDb.collection('submissions').add({
      ...submission,
      submittedAt: FieldValue.serverTimestamp(),
      status: 'pending',
    });
  } catch (err) {
    console.error('Firestore write failed for submission:', submission.email, err);
    return NextResponse.json(
      { message: 'We couldn\'t save your proposal. Please try again in a moment.' },
      { status: 500 }
    );
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: submission.email,
      subject: `Proposal received: "${submission.talkTitle}" — DevFest Sydney 2026`,
      html: buildConfirmationEmail(submission),
    });
  } catch {
    // Email failure is non-fatal: submission is already saved.
    // Log server-side but don't surface to the user.
    console.error('Resend email failed for submission:', submission.email);
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
