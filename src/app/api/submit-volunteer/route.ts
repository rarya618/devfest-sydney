import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Resend } from 'resend';
import { FieldValue } from 'firebase-admin/firestore';

type VolunteerArea = 'registration' | 'av-tech' | 'speaker-support' | 'workshop-facilitator' | 'general-floater' | 'setup-packdown' | 'photography' | 'social-media' | 'merch-table';

interface VolunteerPayload {
  name: string;
  email: string;
  phone: string;
  motivation: string;
  areasOfInterest: VolunteerArea[];
  priorExperience: string;
  googleTechExperience: string;
  isTorrensStudentOrStaff: boolean;
  dietaryRequirements: string;
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

const VALID_AREAS: VolunteerArea[] = ['registration', 'av-tech', 'speaker-support', 'workshop-facilitator', 'general-floater', 'setup-packdown', 'photography', 'social-media', 'merch-table'];
const MOTIVATION_MAX = 1000;
const PRIOR_EXPERIENCE_MAX = 1000;
const GOOGLE_TECH_EXPERIENCE_MAX = 1000;
const DIETARY_MAX = 300;

const AREA_LABELS: Record<VolunteerArea, string> = {
  registration: 'Registration',
  'av-tech': 'AV / Tech',
  'speaker-support': 'Speaker support',
  'workshop-facilitator': 'Workshop facilitator',
  'general-floater': 'General floater',
  'setup-packdown': 'Setup / Pack-down',
  photography: 'Photography',
  'social-media': 'Social media',
  'merch-table': 'Merch table',
};

function validatePayload(body: unknown): VolunteerPayload {
  if (!body || typeof body !== 'object') throw new Error('Invalid request body.');
  const b = body as Record<string, unknown>;

  if (typeof b.name !== 'string' || !b.name.trim()) throw new Error('Name is required.');
  if (typeof b.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email)) throw new Error('A valid email address is required.');
  if (typeof b.motivation !== 'string' || !b.motivation.trim()) throw new Error('Please tell us why you\'d like to volunteer.');
  if (b.motivation.length > MOTIVATION_MAX) throw new Error(`Your answer must be ${MOTIVATION_MAX} characters or fewer.`);
  if (!Array.isArray(b.areasOfInterest) || b.areasOfInterest.length === 0 || !b.areasOfInterest.every((area) => VALID_AREAS.includes(area as VolunteerArea))) {
    throw new Error('Please select at least one area of interest.');
  }
  if (typeof b.priorExperience === 'string' && b.priorExperience.length > PRIOR_EXPERIENCE_MAX) {
    throw new Error(`Prior experience must be ${PRIOR_EXPERIENCE_MAX} characters or fewer.`);
  }
  if (typeof b.googleTechExperience === 'string' && b.googleTechExperience.length > GOOGLE_TECH_EXPERIENCE_MAX) {
    throw new Error(`Google tech experience must be ${GOOGLE_TECH_EXPERIENCE_MAX} characters or fewer.`);
  }
  if (typeof b.dietaryRequirements === 'string' && b.dietaryRequirements.length > DIETARY_MAX) {
    throw new Error(`Dietary requirements must be ${DIETARY_MAX} characters or fewer.`);
  }

  return {
    name: b.name.trim(),
    email: b.email.trim().toLowerCase(),
    phone: typeof b.phone === 'string' ? b.phone.trim() : '',
    motivation: b.motivation.trim(),
    areasOfInterest: b.areasOfInterest as VolunteerArea[],
    priorExperience: typeof b.priorExperience === 'string' ? b.priorExperience.trim() : '',
    googleTechExperience: typeof b.googleTechExperience === 'string' ? b.googleTechExperience.trim() : '',
    isTorrensStudentOrStaff: b.isTorrensStudentOrStaff === true,
    dietaryRequirements: typeof b.dietaryRequirements === 'string' ? b.dietaryRequirements.trim() : '',
    tracking: sanitizeTracking(b.tracking),
  };
}

const AREA_DOT_COLORS = ['#34A853', '#F9AB00', '#4285F4', '#EA4335'];

function buildConfirmationEmail(volunteer: VolunteerPayload): string {
  const font = "font-family:'Google Sans',Roboto,sans-serif;letter-spacing:-0.01em;";

  const dot = (color: string, label: string) => `
    <span style="display:inline-block;background:rgba(255,255,255,0.06);border-radius:20px;padding:8px 16px;margin:0 6px 12px;white-space:nowrap;">
      <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${color};margin-right:14px;vertical-align:middle;"></span><span style="${font}font-size:16px;font-weight:700;color:#ffffff;vertical-align:middle;">${label}</span>
    </span>`;

  const indicators = volunteer.areasOfInterest
    .map((area, i) => dot(AREA_DOT_COLORS[i % AREA_DOT_COLORS.length], AREA_LABELS[area]))
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Volunteer signup received: DevFest Sydney 2026</title>
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
                Thanks for signing up
              </h1>
              <h2 style="margin:0 0 24px;${font}font-size:44px;font-weight:700;color:#EA4335;line-height:1.5;">
                ${volunteer.name.split(' ')[0]}
              </h2>
              <p style="margin:0 0 40px;${font}font-size:24px;font-weight:400;color:#ffffff;line-height:1.75;">
                Thanks for offering to volunteer at DevFest Sydney. We'll be in touch via email with next steps.
              </p>

              <!-- Signup recap card -->
              <table cellpadding="0" cellspacing="0" width="100%" style="background:rgba(255,255,255,0.06);border-radius:12px;">
                <tr>
                  <td style="padding:40px;text-align:center;">
                    <h3 style="margin:0 0 24px;${font}font-size:32px;font-weight:700;color:#ffffff;line-height:1.5;">Areas you're helping with</h3>
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
  let volunteer: VolunteerPayload;

  try {
    const body = await request.json();
    volunteer = validatePayload(body);
  } catch (err) {
    return NextResponse.json(
      { message: err instanceof Error ? err.message : 'Invalid request.' },
      { status: 400 }
    );
  }

  try {
    await adminDb.collection('volunteers').add({
      ...volunteer,
      submittedAt: FieldValue.serverTimestamp(),
      status: 'pending',
    });
  } catch (err) {
    console.error('Firestore write failed for volunteer signup:', volunteer.email, err);
    return NextResponse.json(
      { message: 'We couldn\'t save your signup. Please try again in a moment.' },
      { status: 500 }
    );
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: `GDG Sydney <${process.env.RESEND_FROM_EMAIL}>`,
      to: volunteer.email,
      bcc: 'hello@gdgsydney.com',
      replyTo: 'hello@gdgsydney.com',
      subject: `We've got your DevFest Sydney 2026 volunteer application`,
      html: buildConfirmationEmail(volunteer),
    });
  } catch {
    // Email failure is non-fatal: signup is already saved.
    // Log server-side but don't surface to the user.
    console.error('Resend email failed for volunteer signup:', volunteer.email);
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
