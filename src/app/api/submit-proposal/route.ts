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
  speakerTagline: string;
  speakerBio: string;
  previousTalkLink: string;
  howDidYouHear: string;
  coSpeakerEmails: string;
  accessibilityNeeds: string;
  requiresTravelSupport: boolean;
  travelSupportLocation: string;
  isGoogleDeveloperExpert: boolean;
  isFirstTimeSpeaker: boolean;
  wantsMentoring: boolean;
  hasSpokenAtGdgSydneyBefore: boolean;
  isOpenToAudienceQuestions: boolean;
  optOutOfRecording: boolean;
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

const TRACK_DOT_COLOR: Record<Track, string> = {
  developer: '#4285F4',
  builder: '#34A853',
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
  if (b.requiresTravelSupport === true && (typeof b.travelSupportLocation !== 'string' || !b.travelSupportLocation.trim())) {
    throw new Error('Please let us know which city you\'d be travelling from.');
  }

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
    speakerTagline: typeof b.speakerTagline === 'string' ? b.speakerTagline.trim() : '',
    speakerBio: typeof b.speakerBio === 'string' ? b.speakerBio.trim() : '',
    howDidYouHear: typeof b.howDidYouHear === 'string' ? b.howDidYouHear.trim() : '',
    coSpeakerEmails: typeof b.coSpeakerEmails === 'string' ? b.coSpeakerEmails.trim() : '',
    accessibilityNeeds: typeof b.accessibilityNeeds === 'string' ? b.accessibilityNeeds.trim() : '',
    requiresTravelSupport: b.requiresTravelSupport === true,
    travelSupportLocation: typeof b.travelSupportLocation === 'string' ? b.travelSupportLocation.trim() : '',
    isGoogleDeveloperExpert: b.isGoogleDeveloperExpert === true,
    isFirstTimeSpeaker: b.isFirstTimeSpeaker === true,
    wantsMentoring: b.wantsMentoring === true,
    hasSpokenAtGdgSydneyBefore: b.hasSpokenAtGdgSydneyBefore === true,
    isOpenToAudienceQuestions: b.isOpenToAudienceQuestions === true,
    optOutOfRecording: b.optOutOfRecording === true,
  };
}

function buildConfirmationEmail(submission: SubmissionPayload): string {
  const font = "font-family:'Google Sans',Roboto,sans-serif;letter-spacing:-0.01em;";
  const dotColors = ['#4285F4', '#EA4335', '#f9ab00', '#34A853'];
  const gdgDots = dotColors
    .map(
      (c, i) =>
        `<td style="padding:0 ${i === dotColors.length - 1 ? 0 : 5}px 0 ${i === 0 ? 0 : 5}px;"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${c};font-size:0;line-height:0;">&nbsp;</span></td>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Proposal received: DevFest Sydney 2026</title>
</head>
<body style="margin:0;padding:0;background:#f0f0f0;${font}color:#1e1e1e;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f0f0;padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;border:1px solid rgba(30,30,30,0.08);">
          <tr>
            <td style="padding:48px 40px 40px;text-align:center;">

              <!-- Wordmark -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
                <tr>
                  <td style="vertical-align:middle;padding-right:5px;">
                    <img src="https://devfest.gdgsydney.com/logo.png" alt="" width="53" height="30" style="display:block;" />
                  </td>
                  <td style="vertical-align:middle;">
                    <span style="${font}font-size:18px;font-weight:700;color:#1e1e1e;">DevFest Sydney</span>
                  </td>
                </tr>
              </table>

              <!-- Success icon (matches the on-site confirmation state) -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 20px;">
                <tr>
                  <td style="width:56px;height:56px;border-radius:50%;background:#e3f5e6;border:1px solid rgba(52,168,83,0.25);text-align:center;vertical-align:middle;">
                    <span style="${font}font-size:22px;line-height:56px;color:#34A853;">&#10003;</span>
                  </td>
                </tr>
              </table>

              <h1 style="margin:0 0 12px;${font}font-size:26px;font-weight:700;color:#1e1e1e;line-height:1.35;letter-spacing:-0.02em;">
                Thanks for your proposal, <span style="color:#4285F4;">${submission.name.split(' ')[0]}</span>!
              </h1>
              <p style="margin:0 0 32px;${font}font-size:14px;color:rgba(30,30,30,0.55);line-height:1.8;">
                We're so glad you want to speak at DevFest Sydney. Our team reads every proposal, and if yours is picked, we'll email you here with the next steps. No need to follow up, we'll be in touch.
              </p>

              <!-- Divider -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
                <tr>${gdgDots}</tr>
              </table>

              <!-- Submission recap -->
              <p style="margin:0 0 6px;${font}font-size:12px;font-weight:700;color:#4285F4;">Your submission</p>
              <h2 style="margin:0 0 14px;${font}font-size:19px;font-weight:700;color:#1e1e1e;line-height:1.55;">${submission.talkTitle}</h2>

              <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="padding:0 14px 0 0;white-space:nowrap;">
                    <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${TRACK_DOT_COLOR[submission.track]};margin-right:7px;"></span><span style="${font}font-size:13px;font-weight:600;color:rgba(30,30,30,0.8);">${TRACK_LABELS[submission.track]}</span>
                  </td>
                  <td style="padding:0 14px 0 0;white-space:nowrap;">
                    <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:rgba(30,30,30,0.3);margin-right:7px;"></span><span style="${font}font-size:13px;font-weight:600;color:rgba(30,30,30,0.8);">${FORMAT_LABELS[submission.format]}</span>
                  </td>
                  <td style="white-space:nowrap;">
                    <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:rgba(30,30,30,0.3);margin-right:7px;"></span><span style="${font}font-size:13px;font-weight:600;color:rgba(30,30,30,0.8);">${LEVEL_LABELS[submission.experienceLevel]}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px 32px;border-top:1px solid rgba(30,30,30,0.08);text-align:center;">
              <p style="margin:0;${font}font-size:12px;color:rgba(30,30,30,0.35);line-height:1.8;">
                Got a question? Just reply to this email, we're happy to help.<br />Organised by <a href="https://gdgsydney.com" style="color:rgba(30,30,30,0.45);text-decoration:underline;">GDG Sydney</a>
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
      from: `GDG Sydney <${process.env.RESEND_FROM_EMAIL}>`,
      to: submission.email,
      bcc: 'hello@gdgsydney.com',
      replyTo: 'hello@gdgsydney.com',
      subject: `Proposal received: "${submission.talkTitle}", DevFest Sydney 2026`,
      html: buildConfirmationEmail(submission),
    });
  } catch {
    // Email failure is non-fatal: submission is already saved.
    // Log server-side but don't surface to the user.
    console.error('Resend email failed for submission:', submission.email);
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
