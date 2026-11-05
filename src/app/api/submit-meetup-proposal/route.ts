import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { Resend } from 'resend';
import { adminDb } from '@/lib/firebase-admin';
import { escapeHtml } from '@/lib/escapeHtml';
import { normaliseProfileUrl } from '@/lib/speakers';

// Talk proposals for GDG Sydney's monthly meetups, from the /speak form on gdgsydney.com
// (a separate, static Astro site). Stage 5 of the "One GDG Sydney Site" plan in PM.md:
// meetup proposals go through this app like the CfS does, instead of a Google Sheet.
//
// The form posts across domains, so this route answers CORS for the GDG Sydney site only.
// Writes go through the Admin SDK into `meetupProposals`, which has no client create path
// in firestore.rules.

type MeetupFormat = 'standard' | 'workshop';

interface MeetupProposal {
  name: string;
  email: string;
  profileUrl: string;
  talkTitle: string;
  format: MeetupFormat;
  abstract: string;
  audience: string;
  bio: string;
  speakingExperience: string;
  notes: string;
}

const VALID_FORMATS: MeetupFormat[] = ['standard', 'workshop'];

const FORMAT_LABELS: Record<MeetupFormat, string> = {
  standard: 'Standard talk (20 to 30 min)',
  workshop: 'Workshop (60 to 90 min)',
};

// Field limits: generous for real proposals, small enough to stop a pasted novel.
const LIMITS = {
  name: 120,
  email: 254,
  profileUrl: 300,
  talkTitle: 200,
  abstract: 2000,
  audience: 1000,
  bio: 2000,
  speakingExperience: 1000,
  notes: 1000,
} as const;

// Origins allowed to post. Override with MEETUP_FORM_ALLOWED_ORIGINS (comma-separated)
// when the site moves or a preview domain needs access.
const DEFAULT_ALLOWED_ORIGINS = ['https://gdgsydney.com', 'https://www.gdgsydney.com', 'http://localhost:4321'];

function allowedOrigins(): string[] {
  const fromEnv = process.env.MEETUP_FORM_ALLOWED_ORIGINS;
  return fromEnv
    ? fromEnv.split(',').map((origin) => origin.trim()).filter(Boolean)
    : DEFAULT_ALLOWED_ORIGINS;
}

function corsHeaders(origin: string | null): Record<string, string> {
  if (!origin || !allowedOrigins().includes(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function requiredText(body: Record<string, unknown>, key: keyof typeof LIMITS, label: string): string {
  const value = body[key];
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${label} is required.`);
  if (value.trim().length > LIMITS[key]) throw new Error(`${label} must be ${LIMITS[key]} characters or fewer.`);
  return value.trim();
}

function optionalText(body: Record<string, unknown>, key: keyof typeof LIMITS, label: string): string {
  const value = body[key];
  if (value === undefined || value === null || value === '') return '';
  if (typeof value !== 'string') throw new Error(`${label} must be text.`);
  if (value.trim().length > LIMITS[key]) throw new Error(`${label} must be ${LIMITS[key]} characters or fewer.`);
  return value.trim();
}

function validatePayload(raw: unknown): MeetupProposal {
  if (!raw || typeof raw !== 'object') throw new Error('Invalid request body.');
  const body = raw as Record<string, unknown>;

  const email = requiredText(body, 'email', 'Email');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('A valid email address is required.');

  if (!VALID_FORMATS.includes(body.format as MeetupFormat)) throw new Error('Please choose a talk format.');

  const rawProfile = optionalText(body, 'profileUrl', 'LinkedIn or website');
  const profileUrl = rawProfile ? normaliseProfileUrl(rawProfile) : '';
  if (rawProfile && !profileUrl) throw new Error('LinkedIn or website must be a web address.');

  return {
    name: requiredText(body, 'name', 'Full name'),
    email: email.toLowerCase(),
    profileUrl,
    talkTitle: requiredText(body, 'talkTitle', 'Talk title'),
    format: body.format as MeetupFormat,
    abstract: requiredText(body, 'abstract', 'Talk abstract'),
    audience: requiredText(body, 'audience', 'Target audience'),
    bio: requiredText(body, 'bio', 'Speaker bio'),
    speakingExperience: optionalText(body, 'speakingExperience', 'Speaking experience'),
    notes: optionalText(body, 'notes', 'Anything else'),
  };
}

function buildConfirmationEmail(proposal: MeetupProposal): string {
  const font = "font-family:'Google Sans',Roboto,sans-serif;";
  const firstName = escapeHtml(proposal.name.split(' ')[0]);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Proposal received: GDG Sydney</title>
</head>
<body style="margin:0;padding:0;background:#1e1e1e;${font}color:#f0f0f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#1e1e1e;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 16px;${font}font-size:28px;font-weight:700;color:#f0f0f0;">Thanks, ${firstName}. We've got your proposal.</h1>
              <p style="margin:0 0 24px;${font}font-size:16px;line-height:1.7;color:#d6d6d4;">
                Our organisers will read it and get back to you within a week.
              </p>
              <table cellpadding="0" cellspacing="0" width="100%" style="background:#272727;border-radius:12px;">
                <tr>
                  <td style="padding:24px;">
                    <p style="margin:0 0 6px;${font}font-size:13px;color:#9aa0a6;">${escapeHtml(FORMAT_LABELS[proposal.format])}</p>
                    <p style="margin:0;${font}font-size:20px;font-weight:700;color:#f0f0f0;">${escapeHtml(proposal.talkTitle)}</p>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;${font}font-size:15px;line-height:1.7;color:#d6d6d4;">
                Questions? Reply to this email.
              </p>
              <p style="margin:24px 0 0;${font}font-size:14px;color:#9aa0a6;">
                <a href="https://gdgsydney.com" style="color:#d6d6d4;">GDG Sydney</a>
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

export function OPTIONS(request: NextRequest) {
  const headers = corsHeaders(request.headers.get('origin'));
  return new NextResponse(null, { status: Object.keys(headers).length ? 204 : 403, headers });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);
  // A browser on any other site is refused outright. (Non-browser clients send no Origin;
  // they still face validation and the honeypot below.)
  if (origin && !Object.keys(headers).length) {
    return NextResponse.json({ message: 'Not allowed.' }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid request.' }, { status: 400, headers });
  }

  // Honeypot: a field people never see. Anything in it is a bot, so pretend it worked
  // and store nothing, rather than teaching it what got it caught.
  if (typeof body.companyWebsite === 'string' && body.companyWebsite.trim()) {
    return NextResponse.json({ ok: true }, { status: 201, headers });
  }

  let proposal: MeetupProposal;
  try {
    proposal = validatePayload(body);
  } catch (err) {
    return NextResponse.json(
      { message: err instanceof Error ? err.message : 'Invalid request.' },
      { status: 400, headers }
    );
  }

  try {
    await adminDb.collection('meetupProposals').add({
      ...proposal,
      source: 'gdgsydney.com/speak',
      status: 'pending',
      submittedAt: FieldValue.serverTimestamp(),
    });
  } catch (err) {
    console.error('Firestore write failed for meetup proposal:', proposal.email, err);
    return NextResponse.json(
      { message: "We couldn't save your proposal. Please try again in a moment." },
      { status: 500, headers }
    );
  }

  // The bcc is how organisers hear about new proposals. Email failure is non-fatal:
  // the proposal is already saved.
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: `GDG Sydney <${process.env.RESEND_FROM_EMAIL}>`,
      to: proposal.email,
      bcc: 'hello@gdgsydney.com',
      replyTo: 'hello@gdgsydney.com',
      subject: "We've got your GDG Sydney talk proposal",
      html: buildConfirmationEmail(proposal),
    });
  } catch {
    console.error('Resend email failed for meetup proposal:', proposal.email);
  }

  return NextResponse.json({ ok: true }, { status: 201, headers });
}
