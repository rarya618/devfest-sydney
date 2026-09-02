import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { isShowcaseOpen } from '@/lib/showcase';
import { Resend } from 'resend';
import { FieldValue } from 'firebase-admin/firestore';

type ShowcaseStage = 'idea' | 'prototype' | 'live';

interface CoPresenter {
  name: string;
  email: string;
}

interface ShowcasePayload {
  name: string;
  email: string;
  projectName: string;
  pitch: string;
  description: string;
  stage: ShowcaseStage;
  demoUrl: string;
  repoUrl: string;
  linkedinUrl: string;
  builtWith: string;
  coPresenters: CoPresenter[];
  demoRequirements: string;
  isFirstTimePresenter: boolean;
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

const VALID_STAGES: ShowcaseStage[] = ['idea', 'prototype', 'live'];
const PROJECT_NAME_MAX = 120;
const PITCH_MAX = 140;
const DESCRIPTION_MAX = 1000;
const BUILT_WITH_MAX = 300;
// Five minutes on stage does not fit a crowd, so the roster is capped rather than
// unbounded. The form enforces the same cap.
const CO_PRESENTERS_MAX = 4;
const CO_PRESENTER_NAME_MAX = 100;
const CO_PRESENTER_EMAIL_MAX = 200;
const DEMO_REQUIREMENTS_MAX = 500;

const STAGE_LABELS: Record<ShowcaseStage, string> = {
  idea: 'Idea or concept',
  prototype: 'Working prototype',
  live: 'Live and in use',
};

// Co-presenters arrive as a list of blocks the entrant added one at a time. Rows left
// completely blank are dropped rather than rejected: an added-then-abandoned block is a
// slip, not an error worth blocking the whole submission on.
function validateCoPresenters(input: unknown): CoPresenter[] {
  if (input === undefined || input === null) return [];
  if (!Array.isArray(input)) throw new Error('Co-presenters must be a list.');

  const coPresenters: CoPresenter[] = [];

  for (const raw of input) {
    if (!raw || typeof raw !== 'object') throw new Error('Each co-presenter must have a name and an email.');
    const entry = raw as Record<string, unknown>;
    const name = typeof entry.name === 'string' ? entry.name.trim() : '';
    const email = typeof entry.email === 'string' ? entry.email.trim().toLowerCase() : '';

    if (!name && !email) continue;

    if (!name) throw new Error('Please give every co-presenter a name.');
    if (name.length > CO_PRESENTER_NAME_MAX) {
      throw new Error(`A co-presenter's name must be ${CO_PRESENTER_NAME_MAX} characters or fewer.`);
    }
    if (email) {
      if (email.length > CO_PRESENTER_EMAIL_MAX) {
        throw new Error(`A co-presenter's email must be ${CO_PRESENTER_EMAIL_MAX} characters or fewer.`);
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error(`${name} needs a valid email address, or leave it blank.`);
      }
    }

    coPresenters.push({ name, email });
  }

  if (coPresenters.length > CO_PRESENTERS_MAX) {
    throw new Error(`You can add up to ${CO_PRESENTERS_MAX} co-presenters.`);
  }

  return coPresenters;
}

function validatePayload(body: unknown): ShowcasePayload {
  if (!body || typeof body !== 'object') throw new Error('Invalid request body.');
  const b = body as Record<string, unknown>;

  if (typeof b.name !== 'string' || !b.name.trim()) throw new Error('Name is required.');
  if (typeof b.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email)) throw new Error('A valid email address is required.');
  if (typeof b.projectName !== 'string' || !b.projectName.trim()) throw new Error('Please give your project a name.');
  if (b.projectName.length > PROJECT_NAME_MAX) throw new Error(`Your project name must be ${PROJECT_NAME_MAX} characters or fewer.`);
  if (typeof b.pitch !== 'string' || !b.pitch.trim()) throw new Error('Please add a one-line pitch for your demo.');
  if (b.pitch.length > PITCH_MAX) throw new Error(`Your one-line pitch must be ${PITCH_MAX} characters or fewer.`);
  if (typeof b.description !== 'string' || !b.description.trim()) throw new Error('Please tell us what you\'ll demo.');
  if (b.description.length > DESCRIPTION_MAX) throw new Error(`Your description must be ${DESCRIPTION_MAX} characters or fewer.`);
  if (typeof b.stage !== 'string' || !VALID_STAGES.includes(b.stage as ShowcaseStage)) {
    throw new Error('Please tell us what stage your project is at.');
  }
  if (typeof b.builtWith === 'string' && b.builtWith.length > BUILT_WITH_MAX) {
    throw new Error(`What you built it with must be ${BUILT_WITH_MAX} characters or fewer.`);
  }
  const coPresenters = validateCoPresenters(b.coPresenters);
  if (typeof b.demoRequirements === 'string' && b.demoRequirements.length > DEMO_REQUIREMENTS_MAX) {
    throw new Error(`What you need on the day must be ${DEMO_REQUIREMENTS_MAX} characters or fewer.`);
  }

  return {
    name: b.name.trim(),
    email: b.email.trim().toLowerCase(),
    projectName: b.projectName.trim(),
    pitch: b.pitch.trim(),
    description: b.description.trim(),
    stage: b.stage as ShowcaseStage,
    demoUrl: typeof b.demoUrl === 'string' ? b.demoUrl.trim() : '',
    repoUrl: typeof b.repoUrl === 'string' ? b.repoUrl.trim() : '',
    linkedinUrl: typeof b.linkedinUrl === 'string' ? b.linkedinUrl.trim() : '',
    builtWith: typeof b.builtWith === 'string' ? b.builtWith.trim() : '',
    coPresenters,
    demoRequirements: typeof b.demoRequirements === 'string' ? b.demoRequirements.trim() : '',
    isFirstTimePresenter: b.isFirstTimePresenter === true,
    tracking: sanitizeTracking(b.tracking),
  };
}

// Escapes values interpolated into the confirmation email. Unlike the volunteer email,
// which only ever renders labels we wrote ourselves, this one echoes the entrant's own
// project name and pitch straight back into HTML.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildConfirmationEmail(entry: ShowcasePayload): string {
  const font = "font-family:'Google Sans',Roboto,sans-serif;letter-spacing:-0.01em;";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Builder Showcase entry received: DevFest Sydney 2026</title>
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
                Your demo is in
              </h1>
              <h2 style="margin:0 0 24px;${font}font-size:44px;font-weight:700;color:#F9AB00;line-height:1.5;">
                ${escapeHtml(entry.name.split(' ')[0])}
              </h2>
              <p style="margin:0 0 40px;${font}font-size:24px;font-weight:400;color:#ffffff;line-height:1.75;">
                Thanks for entering the Builder Showcase at DevFest Sydney. We'll review every entry and email you either way once the lineup is set.
              </p>

              <!-- Entry recap card -->
              <table cellpadding="0" cellspacing="0" width="100%" style="background:rgba(255,255,255,0.06);border-radius:12px;">
                <tr>
                  <td style="padding:40px;text-align:center;">
                    <h3 style="margin:0 0 12px;${font}font-size:32px;font-weight:700;color:#ffffff;line-height:1.5;">${escapeHtml(entry.projectName)}</h3>
                    <p style="margin:0 0 24px;${font}font-size:20px;font-weight:400;color:rgba(255,255,255,0.75);line-height:1.6;">${escapeHtml(entry.pitch)}</p>
                    <span style="display:inline-block;background:rgba(255,255,255,0.06);border-radius:20px;padding:8px 16px;white-space:nowrap;">
                      <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#F9AB00;margin-right:14px;vertical-align:middle;"></span><span style="${font}font-size:16px;font-weight:700;color:#ffffff;vertical-align:middle;">${STAGE_LABELS[entry.stage]}</span>
                    </span>
                  </td>
                </tr>
              </table>

              <!-- What happens next -->
              <div style="margin-top:40px;">
                <p style="margin:0 0 8px;${font}font-size:24px;font-weight:700;color:#ffffff;line-height:1.5;">What happens next</p>
                <p style="margin:0;${font}font-size:20px;font-weight:400;color:#ffffff;line-height:1.5;">If your demo is picked you'll get five minutes on stage in the mid-afternoon showcase, and the room votes on the winner.</p>
              </div>

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
  // Hiding the form is not the same as closing entries: without this the endpoint keeps
  // accepting demos after the deadline, from a stale tab or a direct post.
  if (!isShowcaseOpen()) {
    return NextResponse.json(
      { message: 'The Builder Showcase call for demos has closed, so we can no longer accept entries. Thank you for your interest.' },
      { status: 403 }
    );
  }

  let entry: ShowcasePayload;

  try {
    const body = await request.json();
    entry = validatePayload(body);
  } catch (err) {
    return NextResponse.json(
      { message: err instanceof Error ? err.message : 'Invalid request.' },
      { status: 400 }
    );
  }

  try {
    await adminDb.collection('showcase').add({
      ...entry,
      submittedAt: FieldValue.serverTimestamp(),
      status: 'pending',
    });
  } catch (err) {
    console.error('Firestore write failed for showcase entry:', entry.email, err);
    return NextResponse.json(
      { message: 'We couldn\'t save your entry. Please try again in a moment.' },
      { status: 500 }
    );
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: `GDG Sydney <${process.env.RESEND_FROM_EMAIL}>`,
      to: entry.email,
      bcc: 'hello@gdgsydney.com',
      replyTo: 'hello@gdgsydney.com',
      subject: `We've got your DevFest Sydney 2026 Builder Showcase entry`,
      html: buildConfirmationEmail(entry),
    });
  } catch {
    // Email failure is non-fatal: the entry is already saved.
    // Log server-side but don't surface to the user.
    console.error('Resend email failed for showcase entry:', entry.email);
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
