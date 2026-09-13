import { formatDeadlineDate } from '@/lib/format';
import { VOLUNTEER_AREA_LABELS, VOLUNTEER_SHIFT_LABELS } from '@/lib/volunteerLabels';
import type { VolunteerArea, VolunteerShift } from '@/lib/types';

// Same table-based construction and escaping as acceptanceEmail.ts: email clients strip
// stylesheets, and several still ignore flexbox and CSS variables entirely. Green rather
// than the ticket email's blue, matching the Builder/volunteer accent used across the site.

export interface VolunteerAcceptanceEmailDetails {
  name: string;
  // The roster as it stands when the email goes out. Both are optional: most volunteers
  // are accepted well before the areas are worked out, and a pill reading "No shift yet"
  // in a congratulations email would raise a question rather than answer one.
  assignedArea: VolunteerArea | '';
  assignedShift: VolunteerShift;
  confirmUrl: string;
  confirmByIso: string;
}

const FONT = "font-family:'Google Sans',Roboto,sans-serif;letter-spacing:-0.01em;";
const WORDMARK_URL =
  'https://storage.googleapis.com/devfest-sydney-2026.firebasestorage.app/site-assets/logo-wordmark.png';

// Anything interpolated into the HTML is volunteer-entered or admin-entered, so it is
// escaped rather than trusted.
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

export function volunteerAcceptanceEmailSubject(): string {
  return 'You’re on the DevFest Sydney 2026 volunteer crew';
}

export function buildVolunteerAcceptanceEmail(details: VolunteerAcceptanceEmailDetails): string {
  const firstName = details.name.trim().split(/\s+/)[0] || details.name;
  const confirmBy = formatDeadlineDate(details.confirmByIso);

  const bodyText = `${FONT}font-size:16px;font-weight:400;color:rgba(255,255,255,0.85);line-height:1.75;`;
  const sectionHeading = `${FONT}font-size:20px;font-weight:700;color:#ffffff;line-height:1.5;`;

  const indicators = [
    details.assignedArea ? indicatorPill('#34A853', VOLUNTEER_AREA_LABELS[details.assignedArea]) : '',
    details.assignedShift ? indicatorPill('#4285F4', VOLUNTEER_SHIFT_LABELS[details.assignedShift]) : '',
  ].join('');

  // Only rendered once there is a roster to render. Before that the email says the role
  // is still being worked out, which is true and reads better than an empty card.
  const roleCard = indicators
    ? card(`
        <p style="margin:0 0 18px;${FONT}font-size:18px;font-weight:700;color:#ffffff;line-height:1.5;text-align:center;">Where we'd love your help</p>
        <div style="text-align:center;">${indicators}</div>
      `)
    : card(`
        <p style="margin:0 0 6px;${FONT}font-size:18px;font-weight:700;color:#ffffff;line-height:1.5;text-align:center;">Your role on the day</p>
        <p style="margin:0;${bodyText}text-align:center;">We're still working out the roster. We'll confirm your area and shift closer to the event, and we'll take your preferences into account.</p>
      `);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You're on the DevFest Sydney 2026 volunteer crew</title>
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
                Welcome aboard
              </h1>
              <h2 style="margin:0 0 20px;${FONT}font-size:44px;font-weight:700;color:#34A853;line-height:1.4;text-align:center;">
                ${escapeHtml(firstName)}
              </h2>
              <p style="margin:0 0 32px;${FONT}font-size:20px;font-weight:400;color:#ffffff;line-height:1.6;text-align:center;">
                We'd love to have you on the volunteer crew for DevFest Sydney 2026
              </p>

              <!-- Role -->
              ${roleCard}

              <!-- Confirm -->
              ${card(`
                <p style="margin:0 0 6px;${FONT}font-size:22px;font-weight:700;color:#ffffff;line-height:1.5;text-align:center;">So what's next?</p>
                <p style="margin:0 0 20px;${bodyText}text-align:center;">Please confirm you can still make it.</p>
                <div style="text-align:center;">
                  <a href="${escapeHtml(details.confirmUrl)}" style="display:inline-block;background:#34A853;border-radius:8px;padding:14px 28px;${FONT}font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;">Confirm you're coming</a>
                </div>
              `)}

              <p style="margin:0 0 32px;${bodyText}">
                Please do so by ${escapeHtml(confirmBy)}, as we will need to offer the spot to someone else if we don't hear from you.
              </p>

              <!-- The day -->
              <!-- Deliberately promises nothing about perks (entry, food, merch): none of
                   that is settled anywhere in the repo, and an acceptance email is a bad
                   place to invent it. Add it here once the organisers have decided. -->
              <h3 style="margin:0 0 12px;${sectionHeading}">The day itself</h3>
              <p style="margin:0 0 16px;${bodyText}">
                DevFest Sydney is on Saturday 10 October at Torrens University, Surry Hills. We're expecting 200+ attendees across 4 tracks, and the crew is what makes a day that size work.
              </p>
              <p style="margin:0 0 32px;${bodyText}">
                Closer to the day we'll send you the run sheet, your arrival time, and who to find when you get there. If you have anything on that morning that we should know about, just reply and tell us.
              </p>

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

export interface VolunteerConfirmationNoticeDetails {
  name: string;
  email: string;
  phone: string;
  assignedArea: VolunteerArea | '';
  assignedShift: VolunteerShift;
  confirmedAtIso: string;
}

// Sent to the organisers when a volunteer confirms. Plainer than the volunteer-facing
// template on purpose: it is a working notification, read in a shared inbox, and the only
// thing that matters is who confirmed and what they are down for.
export function buildVolunteerConfirmedNotice(details: VolunteerConfirmationNoticeDetails): string {
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
  <title>Volunteer confirmed: ${escapeHtml(details.name)}</title>
</head>
<body style="margin:0;padding:0;background:#202124;${FONT}color:#ffffff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#202124;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#202124;">
          <tr>
            <td style="padding:40px;">
              <img src="${WORDMARK_URL}" alt="DevFest Sydney" width="177" height="32" style="display:block;margin:0 0 32px;" />

              <h1 style="margin:0 0 8px;${FONT}font-size:28px;font-weight:700;color:#34A853;line-height:1.4;">Volunteer confirmed</h1>
              <p style="margin:0 0 24px;${bodyText}">${escapeHtml(details.name)} has confirmed they'll be on the crew at DevFest Sydney 2026.</p>

              ${card(`<table cellpadding="0" cellspacing="0" width="100%">
                ${row('Area', details.assignedArea ? VOLUNTEER_AREA_LABELS[details.assignedArea] : 'Not assigned yet')}
                ${row('Shift', VOLUNTEER_SHIFT_LABELS[details.assignedShift])}
                ${row('Email', details.email)}
                ${details.phone ? row('Phone', details.phone) : ''}
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
