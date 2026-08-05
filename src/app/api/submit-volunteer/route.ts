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

function buildConfirmationEmail(volunteer: VolunteerPayload): string {
  const font = "font-family:'Google Sans',Roboto,sans-serif;letter-spacing:-0.01em;";
  const areas = volunteer.areasOfInterest.map((area) => AREA_LABELS[area]).join(', ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Volunteer signup received: DevFest Sydney 2026</title>
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
                    <img src="https://devfest.gdgsydney.com/logo.png" alt="" width="53" height="30" style="display:inline-block;vertical-align:middle;" />
                  </td>
                  <td style="vertical-align:middle;">
                    <span style="${font}font-size:18px;font-weight:700;color:#1e1e1e;">DevFest Sydney</span>
                  </td>
                </tr>
              </table>

              <!-- Success icon + heading -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 12px;">
                <tr>
                  <td style="padding-right:12px;vertical-align:middle;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:22px;height:22px;border-radius:50%;background:#34A853;text-align:center;vertical-align:middle;">
                          <span style="${font}font-size:13px;line-height:22px;color:#ffffff;">&#10003;</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td style="vertical-align:middle;">
                    <h1 style="margin:0;${font}font-size:22px;font-weight:700;color:#1e1e1e;line-height:1.35;letter-spacing:-0.02em;">
                      Thanks for signing up, <span style="color:#4285F4;">${volunteer.name.split(' ')[0]}</span>!
                    </h1>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 32px;${font}font-size:14px;color:rgba(30,30,30,0.55);line-height:1.8;">
                Thanks for offering to volunteer at DevFest Sydney. We'll be in touch via email with next steps.
              </p>

              <!-- Signup recap -->
              <p style="margin:0 0 6px;${font}font-size:12px;font-weight:700;color:#4285F4;">Your signup</p>
              <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="white-space:nowrap;">
                    <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#4285F4;margin-right:7px;vertical-align:middle;"></span><span style="${font}font-size:13px;font-weight:600;color:rgba(30,30,30,0.8);vertical-align:middle;">${areas}</span>
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
      subject: 'Volunteer signup received: DevFest Sydney 2026',
      html: buildConfirmationEmail(volunteer),
    });
  } catch {
    // Email failure is non-fatal: signup is already saved.
    // Log server-side but don't surface to the user.
    console.error('Resend email failed for volunteer signup:', volunteer.email);
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
