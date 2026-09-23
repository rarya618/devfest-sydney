import { escapeHtml } from '@/lib/escapeHtml';

// The speaker's calendar invite for their session: an email with an iCalendar file attached,
// sent from /admin/speakers. The .ics goes out as `text/calendar; method=REQUEST`, which is
// what makes Gmail and Outlook treat it as an invitation (added to the calendar, with
// Yes / Maybe / No) rather than a file to download.
//
// Every invite for one speaker shares a UID and carries a rising SEQUENCE, so a later send
// replaces the event already in their calendar instead of adding a second one, and a
// METHOD:CANCEL with the same UID removes it.

const VENUE = 'Torrens University, Shop 1/37 Foveaux St, Surry Hills NSW 2010';
const FONT = "font-family:'Google Sans',Roboto,sans-serif;letter-spacing:-0.01em;";
const WORDMARK_URL =
  'https://storage.googleapis.com/devfest-sydney-2026.firebasestorage.app/site-assets/logo-wordmark.png';
const EVENT_TIME_ZONE = 'Australia/Sydney';

export type CalendarInviteKind = 'invite' | 'update' | 'cancel';

export interface CalendarInviteDetails {
  kind: CalendarInviteKind;
  speakerId: string;
  speakerName: string;
  speakerEmail: string;
  talkTitle: string;
  roomName: string;
  startTime: string; // ISO date string
  endTime: string; // ISO date string
  sequence: number;
  organiserEmail: string;
  siteUrl: string;
  // For an update: when the session started before, so the email can say "moved to 2:00 pm"
  // only when the time actually moved (a room or title change keeps the same time).
  previousStartTime?: string;
}

// ─── iCalendar ────────────────────────────────────────────────────────────────

// RFC 5545 text escaping: backslash first, then the separators, then newlines.
function escapeIcsText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

// "20261009T235000Z". UTC throughout, so the file needs no VTIMEZONE block.
function toIcsUtc(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

// Content lines are capped at 75 octets, continued on the next line after a single space.
// Counted in UTF-8 bytes rather than characters so a name with accents is not split
// mid-character.
function foldIcsLine(line: string): string {
  const encoder = new TextEncoder();
  const segments: string[] = [];
  let current = '';
  let currentBytes = 0;
  for (const character of line) {
    const characterBytes = encoder.encode(character).length;
    const limit = segments.length === 0 ? 75 : 74; // continuation lines lose one to the space
    if (currentBytes + characterBytes > limit) {
      segments.push(current);
      current = '';
      currentBytes = 0;
    }
    current += character;
    currentBytes += characterBytes;
  }
  segments.push(current);
  return segments.join('\r\n ');
}

export function buildSessionIcs(details: CalendarInviteDetails): string {
  const isCancel = details.kind === 'cancel';
  const description = [
    `Your ${isCancel ? 'former ' : ''}session at DevFest Sydney 2026: ${details.talkTitle}`,
    `Room: ${details.roomName}`,
    `Full schedule: ${details.siteUrl}/schedule`,
    'Questions: hello@gdgsydney.com',
  ].join('\n');

  const lines = [
    'BEGIN:VCALENDAR',
    'PRODID:-//GDG Sydney//DevFest Sydney 2026//EN',
    'VERSION:2.0',
    'CALSCALE:GREGORIAN',
    `METHOD:${isCancel ? 'CANCEL' : 'REQUEST'}`,
    'BEGIN:VEVENT',
    `UID:speaker-session-${details.speakerId}@devfest.gdgsydney.com`,
    `DTSTAMP:${toIcsUtc(new Date().toISOString())}`,
    `SEQUENCE:${details.sequence}`,
    `DTSTART:${toIcsUtc(details.startTime)}`,
    `DTEND:${toIcsUtc(details.endTime)}`,
    `SUMMARY:${escapeIcsText(`Speaking at DevFest Sydney: ${details.talkTitle}`)}`,
    `LOCATION:${escapeIcsText(`${details.roomName}, ${VENUE}`)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    `URL:${details.siteUrl}/schedule`,
    `ORGANIZER;CN=GDG Sydney:mailto:${details.organiserEmail}`,
    // A parameter value is a quoted string, not escaped text: it just cannot hold a quote.
    `ATTENDEE;CN="${details.speakerName.replace(/["\r\n]/g, '')}";ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:${details.speakerEmail}`,
    `STATUS:${isCancel ? 'CANCELLED' : 'CONFIRMED'}`,
    'TRANSP:OPAQUE',
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lines.map(foldIcsLine).join('\r\n') + '\r\n';
}

// ─── Email ────────────────────────────────────────────────────────────────────

function formatSessionDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-AU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: EVENT_TIME_ZONE,
  });
}

function formatSessionWeekday(iso: string): string {
  return new Date(iso).toLocaleDateString('en-AU', { weekday: 'long', timeZone: EVENT_TIME_ZONE });
}

function formatSessionTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-AU', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: EVENT_TIME_ZONE,
  });
}

function card(innerHtml: string): string {
  return `
    <table cellpadding="0" cellspacing="0" width="100%" style="background:rgba(255,255,255,0.06);border-radius:12px;margin:0 0 24px;">
      <tr><td style="padding:28px 32px;">${innerHtml}</td></tr>
    </table>`;
}

// The time is in the subject so the inbox preview alone says when they are on.
export function calendarInviteEmailSubject(details: Pick<CalendarInviteDetails, 'kind' | 'startTime'>): string {
  const when = `${formatSessionWeekday(details.startTime)}, ${formatSessionTime(details.startTime)}`;
  if (details.kind === 'cancel') return 'Your DevFest Sydney session is off the schedule';
  if (details.kind === 'update') return `Updated: your DevFest Sydney session is now ${when}`;
  return `Your DevFest Sydney session: ${when}`;
}

export function buildCalendarInviteEmail(details: CalendarInviteDetails): string {
  const firstName = details.speakerName.trim().split(/\s+/)[0] || details.speakerName;
  const bodyText = `${FONT}font-size:16px;font-weight:400;color:rgba(255,255,255,0.85);line-height:1.75;`;
  const labelText = `${FONT}font-size:13px;font-weight:700;color:rgba(255,255,255,0.6);line-height:1.5;`;
  const valueText = `${FONT}font-size:18px;font-weight:700;color:#ffffff;line-height:1.5;`;
  const timeRange = `${formatSessionTime(details.startTime)} to ${formatSessionTime(details.endTime)}`;

  const startLabel = formatSessionTime(details.startTime);
  const timeMoved = Boolean(details.previousStartTime && details.previousStartTime !== details.startTime);

  const heading =
    details.kind === 'cancel'
      ? `${firstName}, your session is off the schedule`
      : details.kind === 'update'
        ? timeMoved
          ? `${firstName}, your session has moved to ${startLabel}`
          : `${firstName}, your session details have changed`
        : `See you at ${startLabel}, ${firstName}`;

  const intro =
    details.kind === 'cancel'
      ? "Your session is no longer on the DevFest Sydney schedule, so we've removed it from your calendar. We'll be in touch separately about what happens next."
      : details.kind === 'update'
        ? "Here are your updated session details. The attached invite updates the event already in your calendar, so there's nothing to delete."
        : "Your session is locked in. We've attached a calendar invite so it's in your diary. If anything changes, we'll update the same invite, so there's nothing to delete.";

  const sessionCard = card(`
                <p style="margin:0 0 4px;${labelText}">${details.kind === 'cancel' ? 'Removed session' : 'Your session'}</p>
                <p style="margin:0 0 20px;${FONT}font-size:22px;font-weight:700;color:#ffffff;line-height:1.4;">${escapeHtml(details.talkTitle)}</p>
                <p style="margin:0 0 4px;${labelText}">When</p>
                <p style="margin:0 0 16px;${valueText}">${escapeHtml(formatSessionDate(details.startTime))}<br />${escapeHtml(timeRange)}</p>
                <p style="margin:0 0 4px;${labelText}">Where</p>
                <p style="margin:0;${valueText}">${escapeHtml(details.roomName)}</p>
                <p style="margin:4px 0 0;${bodyText}">${escapeHtml(VENUE)}</p>
              `);

  const nextSteps =
    details.kind === 'cancel'
      ? ''
      : card(`
                <p style="margin:0 0 12px;${bodyText}">See what's on in the other rooms.</p>
                <a href="${escapeHtml(details.siteUrl)}/schedule" style="display:inline-block;background:#1a73e8;border-radius:8px;padding:14px 28px;${FONT}font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;">See the full schedule</a>
                <p style="margin:20px 0 0;${bodyText}">We'll send AV details closer to the day.</p>
              `);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(calendarInviteEmailSubject(details))}</title>
</head>
<body style="margin:0;padding:0;background:#202124;${FONT}color:#ffffff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#202124;padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#202124;">
          <tr>
            <td style="padding:48px 40px;">

              <img src="${WORDMARK_URL}" alt="DevFest Sydney" width="221" height="40" style="display:block;margin:0 auto 36px;" />

              <h1 style="margin:0 0 20px;${FONT}font-size:32px;font-weight:700;color:#ffffff;line-height:1.3;text-align:center;">
                ${escapeHtml(heading)}
              </h1>
              <p style="margin:0 0 32px;${bodyText}text-align:center;">
                ${escapeHtml(intro)}
              </p>

              ${sessionCard}

              ${nextSteps}

              ${card(`
                <p style="margin:0 0 6px;${FONT}font-size:22px;font-weight:700;color:#ffffff;line-height:1.5;text-align:center;">${details.kind === 'cancel' ? 'Questions?' : "Can't make this time?"}</p>
                <p style="margin:0;${bodyText}text-align:center;">${details.kind === 'cancel' ? "Reply to this email and we'll get back to you." : "Reply to this email and we'll work it out."}</p>
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
