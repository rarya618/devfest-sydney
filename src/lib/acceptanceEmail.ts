import { formatDeadlineDate } from '@/lib/format';
import type { ExperienceLevel, TalkFormat, Track } from '@/lib/types';

// Built to the "Email template - Confirmed Speaker" frame in the DevFest Figma file.
// Table-based and inline-styled throughout: email clients strip stylesheets, and several
// still ignore flexbox and CSS variables entirely.

export interface AcceptanceEmailDetails {
  name: string;
  talkTitle: string;
  format: TalkFormat;
  track: Track;
  experienceLevel: ExperienceLevel;
  confirmUrl: string;
  confirmByIso: string;
}

const FONT = "font-family:'Google Sans',Roboto,sans-serif;letter-spacing:-0.01em;";
const WORDMARK_URL =
  'https://storage.googleapis.com/devfest-sydney-2026.firebasestorage.app/site-assets/logo-wordmark.png';

const FORMAT_LABELS: Record<TalkFormat, string> = {
  talk: 'Talk (30 min)',
  'lightning-talk': 'Lightning Talk (10 min)',
  workshop: 'Workshop',
};

const TRACK_LABELS: Record<Track, string> = {
  developer: 'Developer Track',
  builder: 'Builder Track',
  workshop: 'Workshops Track',
  showcase: 'Builder Showcase',
};

const TRACK_DOT_COLOR: Record<Track, string> = {
  developer: '#4285F4',
  builder: '#34A853',
  workshop: '#F9AB00',
  showcase: '#F9AB00',
};

const LEVEL_LABELS: Record<ExperienceLevel, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

// Anything interpolated into the HTML is speaker-entered, so it is escaped rather than
// trusted: a talk title containing a stray angle bracket would otherwise break the layout.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function indicatorPill(color: string, label: string): string {
  return `
    <span style="display:inline-block;background:rgba(255,255,255,0.06);border-radius:20px;padding:7px 14px;margin:0 4px 10px;white-space:nowrap;">
      <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${color};margin-right:10px;vertical-align:middle;"></span><span style="${FONT}font-size:15px;font-weight:700;color:#ffffff;vertical-align:middle;">${escapeHtml(label)}</span>
    </span>`;
}

function card(innerHtml: string): string {
  return `
    <table cellpadding="0" cellspacing="0" width="100%" style="background:rgba(255,255,255,0.06);border-radius:12px;margin:0 0 24px;">
      <tr><td style="padding:28px 32px;">${innerHtml}</td></tr>
    </table>`;
}

export function acceptanceEmailSubject(talkTitle: string): string {
  return `Your DevFest Sydney 2026 talk has been accepted: ${talkTitle}`;
}

export function buildAcceptanceEmail(details: AcceptanceEmailDetails): string {
  const firstName = details.name.trim().split(/\s+/)[0] || details.name;
  const confirmBy = formatDeadlineDate(details.confirmByIso);
  const humanitixUrl = process.env.NEXT_PUBLIC_HUMANITIX_URL || '';

  const indicators = [
    indicatorPill(TRACK_DOT_COLOR[details.track], TRACK_LABELS[details.track]),
    indicatorPill('#F9AB00', FORMAT_LABELS[details.format]),
    indicatorPill('#4285F4', LEVEL_LABELS[details.experienceLevel]),
  ].join('');

  const bodyText = `${FONT}font-size:16px;font-weight:400;color:rgba(255,255,255,0.85);line-height:1.75;`;
  const sectionHeading = `${FONT}font-size:20px;font-weight:700;color:#ffffff;line-height:1.5;`;

  // Only rendered once the Humanitix event is live: a "share the ticket link" line with
  // no link behind it reads as a mistake to the speaker.
  const ticketShareParagraph = humanitixUrl
    ? `<p style="margin:0;${bodyText}">
        If you have friends or colleagues that would like to attend, please share the ticket link
        <a href="${escapeHtml(humanitixUrl)}" style="color:#34A853;text-decoration:underline;">${escapeHtml(humanitixUrl)}</a>
        and we'd be grateful if you shared it with others in your network.
      </p>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your DevFest Sydney 2026 talk has been accepted</title>
</head>
<body style="margin:0;padding:0;background:#202124;${FONT}color:#ffffff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#202124;padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#202124;">
          <tr>
            <td style="padding:48px 40px;">

              <!-- Wordmark -->
              <img src="${WORDMARK_URL}" alt="DevFest Sydney" width="221" height="40" style="display:block;margin:0 auto 36px;" />

              <!-- Heading -->
              <h1 style="margin:0 0 4px;${FONT}font-size:40px;font-weight:400;color:#ffffff;line-height:1.4;text-align:center;">
                Congratulations
              </h1>
              <h2 style="margin:0 0 20px;${FONT}font-size:44px;font-weight:700;color:#34A853;line-height:1.4;text-align:center;">
                ${escapeHtml(firstName)}
              </h2>
              <p style="margin:0 0 32px;${FONT}font-size:20px;font-weight:400;color:#ffffff;line-height:1.6;text-align:center;">
                We are pleased to accept your submission for DevFest Sydney 2026
              </p>

              <!-- Accepted talk -->
              ${card(`
                <h3 style="margin:0 0 18px;${FONT}font-size:26px;font-weight:700;color:#ffffff;line-height:1.4;text-align:center;">${escapeHtml(details.talkTitle)}</h3>
                <div style="text-align:center;">${indicators}</div>
              `)}

              <!-- Confirm participation -->
              ${card(`
                <p style="margin:0 0 6px;${FONT}font-size:22px;font-weight:700;color:#ffffff;line-height:1.5;text-align:center;">So what's next?</p>
                <p style="margin:0 0 20px;${bodyText}text-align:center;">Please confirm if you will be joining us.</p>
                <div style="text-align:center;">
                  <a href="${escapeHtml(details.confirmUrl)}" style="display:inline-block;background:#34A853;border-radius:8px;padding:14px 28px;${FONT}font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;">Confirm participation</a>
                </div>
              `)}

              <p style="margin:0 0 32px;${bodyText}">
                Please do so by ${escapeHtml(confirmBy)}, as we will need to reach out to other speakers to fill in the spot.
              </p>

              <!-- Tickets -->
              <h3 style="margin:0 0 12px;${sectionHeading}">About tickets</h3>
              <p style="margin:0 0 16px;${bodyText}">
                You get a complimentary ticket to attend the day at DevFest. We will reach out to you to access the ticket once you have confirmed your attendance.
              </p>
              ${ticketShareParagraph}

              <!-- Event scale -->
              <div style="height:24px;"></div>
              ${card(`
                <h3 style="margin:0 0 12px;${sectionHeading}">If you are a GDE</h3>
                <p style="margin:0 0 12px;${bodyText}">DevFest Sydney is on the 10th of October at Torrens University Surry Hills.</p>
                <p style="margin:0;${bodyText}">We expect to have 200+ attendees, with over 20 speakers across 4 tracks. Each session will likely have a minimum of 40 attendees, averaging around 60 attendees across tracks.</p>
              `)}

              <p style="margin:0 0 28px;${bodyText}">We look forward to hearing you talk.</p>

              <!-- Questions -->
              ${card(`
                <p style="margin:0 0 6px;${FONT}font-size:22px;font-weight:700;color:#ffffff;line-height:1.5;text-align:center;">Got a question?</p>
                <p style="margin:0;${bodyText}text-align:center;">Just reply to this email, we're happy to help.</p>
              `)}

              <p style="margin:8px 0 0;${FONT}font-size:16px;font-weight:400;color:rgba(255,255,255,0.85);text-align:center;">
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

export interface ConfirmationNoticeDetails {
  name: string;
  email: string;
  talkTitle: string;
  track: Track;
  format: TalkFormat;
  confirmedAtIso: string;
}

// Sent to the organisers when a speaker confirms. Plainer than the speaker-facing
// templates on purpose: it is a working notification, read in a shared inbox, and the only
// thing that matters is who confirmed what and when.
export function buildSpeakerConfirmedNotice(details: ConfirmationNoticeDetails): string {
  const bodyText = `${FONT}font-size:16px;font-weight:400;color:rgba(255,255,255,0.85);line-height:1.75;`;
  const confirmedAt = new Date(details.confirmedAtIso).toLocaleString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Australia/Sydney',
  });

  const row = (label: string, value: string) => `
    <tr>
      <td style="padding:6px 16px 6px 0;${FONT}font-size:14px;font-weight:700;color:rgba(255,255,255,0.5);white-space:nowrap;vertical-align:top;">${escapeHtml(label)}</td>
      <td style="padding:6px 0;${FONT}font-size:16px;font-weight:400;color:#ffffff;line-height:1.6;">${escapeHtml(value)}</td>
    </tr>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Speaker confirmed: ${escapeHtml(details.name)}</title>
</head>
<body style="margin:0;padding:0;background:#202124;${FONT}color:#ffffff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#202124;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#202124;">
          <tr>
            <td style="padding:40px;">
              <img src="${WORDMARK_URL}" alt="DevFest Sydney" width="177" height="32" style="display:block;margin:0 0 32px;" />

              <h1 style="margin:0 0 8px;${FONT}font-size:28px;font-weight:700;color:#34A853;line-height:1.4;">Speaker confirmed</h1>
              <p style="margin:0 0 24px;${bodyText}">${escapeHtml(details.name)} has confirmed they'll be speaking at DevFest Sydney 2026.</p>

              ${card(`<table cellpadding="0" cellspacing="0" width="100%">
                ${row('Talk', details.talkTitle)}
                ${row('Track', TRACK_LABELS[details.track])}
                ${row('Format', FORMAT_LABELS[details.format])}
                ${row('Email', details.email)}
                ${row('Confirmed', confirmedAt)}
              </table>`)}

              <p style="margin:0;${bodyText}">Reply to this email to reach ${escapeHtml(details.name)} directly.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
