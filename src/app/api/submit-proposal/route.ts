import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Resend } from 'resend';
import { FieldValue } from 'firebase-admin/firestore';

type TalkFormat = 'talk' | 'lightning-talk' | 'workshop';
type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
type Track = 'developer' | 'builder' | 'workshop';

interface SubmissionPayload {
  name: string;
  email: string;
  talkTitle: string;
  abstract: string;
  format: TalkFormat;
  track: Track;
  experienceLevel: ExperienceLevel;
  linkedinUrl: string;
  githubUrl: string;
  websiteUrl: string;
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
  tracking: Record<string, string>;
}

const TRACKING_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'ref'] as const;
const TRACKING_VALUE_MAX = 200;

function sanitizeTracking(input: unknown): Record<string, string> {
  const tracking: Record<string, string> = {};
  if (!input || typeof input !== 'object') return tracking;
  const raw = input as Record<string, unknown>;
  for (const key of TRACKING_KEYS) {
    const value = raw[key];
    if (typeof value === 'string' && value.trim()) {
      tracking[key] = value.trim().slice(0, TRACKING_VALUE_MAX);
    }
  }
  return tracking;
}

const VALID_FORMATS: TalkFormat[] = ['talk', 'lightning-talk', 'workshop'];
const VALID_TRACKS: Track[] = ['developer', 'builder', 'workshop'];
const VALID_LEVELS: ExperienceLevel[] = ['beginner', 'intermediate', 'advanced'];
const ABSTRACT_MAX = 2000;

const FORMAT_LABELS: Record<TalkFormat, string> = {
  talk: 'Talk (30 min)',
  'lightning-talk': 'Lightning Talk (10 min)',
  workshop: 'Workshop',
};

const TRACK_LABELS: Record<Track, string> = {
  developer: 'Developer Track',
  builder: 'Builder Track',
  workshop: 'Workshops Track',
};

const TRACK_DOT_COLOR: Record<Track, string> = {
  developer: '#4285F4',
  builder: '#34A853',
  workshop: '#f9ab00',
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
    linkedinUrl: typeof b.linkedinUrl === 'string' ? b.linkedinUrl.trim() : '',
    githubUrl: typeof b.githubUrl === 'string' ? b.githubUrl.trim() : '',
    websiteUrl: typeof b.websiteUrl === 'string' ? b.websiteUrl.trim() : '',
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
    tracking: sanitizeTracking(b.tracking),
  };
}

function buildConfirmationEmail(submission: SubmissionPayload): string {
  const font = "font-family:'Google Sans',Roboto,sans-serif;letter-spacing:-0.01em;";

  const dot = (color: string, label: string) => `
    <span style="display:inline-block;background:rgba(255,255,255,0.06);border-radius:20px;padding:8px 16px;margin:0 6px 12px;white-space:nowrap;">
      <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${color};margin-right:14px;vertical-align:middle;"></span><span style="${font}font-size:16px;font-weight:700;color:#ffffff;vertical-align:middle;">${label}</span>
    </span>`;

  const indicators = [
    dot(TRACK_DOT_COLOR[submission.track], TRACK_LABELS[submission.track]),
    dot('#F9AB00', FORMAT_LABELS[submission.format]),
    dot('#4285F4', LEVEL_LABELS[submission.experienceLevel]),
  ].join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Proposal received: DevFest Sydney 2026</title>
</head>
<body style="margin:0;padding:0;background:#202124;${font}color:#ffffff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#202124;padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#202124;">
          <tr>
            <td style="padding:60px 40px;text-align:center;">

              <!-- Wordmark -->
              <img src="https://storage.googleapis.com/devfest-sydney-2026.firebasestorage.app/site-assets/logo-wordmark.png" alt="DevFest Sydney" width="221" height="40" style="display:block;margin:0 auto 40px;" />

              <!-- Heading -->
              <h1 style="margin:0 0 8px;${font}font-size:40px;font-weight:400;color:#ffffff;line-height:1.4;">
                Thanks for your submission
              </h1>
              <h2 style="margin:0 0 24px;${font}font-size:44px;font-weight:700;color:#34A853;line-height:1.5;">
                ${submission.name.split(' ')[0]}
              </h2>
              <p style="margin:0 0 40px;${font}font-size:24px;font-weight:400;color:#ffffff;line-height:1.75;">
                We appreciate the effort you've put into submitting a talk for DevFest Sydney. We will review and get back to you via email.
              </p>

              <!-- Submission recap card -->
              <table cellpadding="0" cellspacing="0" width="100%" style="background:rgba(255,255,255,0.06);border-radius:12px;">
                <tr>
                  <td style="padding:40px;text-align:center;">
                    <h3 style="margin:0 0 24px;${font}font-size:32px;font-weight:700;color:#ffffff;line-height:1.5;">${submission.talkTitle}</h3>
                    <div>${indicators}</div>
                  </td>
                </tr>
              </table>

              <!-- Questions -->
              <div style="margin-top:40px;">
                <p style="margin:0 0 8px;${font}font-size:24px;font-weight:700;color:#ffffff;line-height:1.5;">Got a question?</p>
                <p style="margin:0;${font}font-size:20px;font-weight:400;color:#ffffff;line-height:1.5;">Just reply to this email, we're happy to help.</p>
              </div>

              <p style="margin:40px 0 0;${font}font-size:20px;font-weight:400;color:#ffffff;">
                Organised by <a href="https://gdgsydney.com" style="color:#ffffff;text-decoration:underline;">GDG Sydney</a>
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
      subject: `We've got your DevFest Sydney 2026 submission`,
      html: buildConfirmationEmail(submission),
    });
  } catch {
    // Email failure is non-fatal: submission is already saved.
    // Log server-side but don't surface to the user.
    console.error('Resend email failed for submission:', submission.email);
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
