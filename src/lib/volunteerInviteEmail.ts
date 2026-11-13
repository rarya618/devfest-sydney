import { escapeHtml } from '@/lib/escapeHtml';

// The "will you crew again?" email (stage 4d-2). Same table-based construction and escaping
// as volunteerAcceptanceEmail.ts, since email clients strip stylesheets, and green for the
// volunteer accent. Event-specific copy comes from the event, so it works for any of them.

export interface VolunteerInviteEmailDetails {
  name: string;
  eventName: string;
  // Already formatted in the event's own time zone, e.g. "Saturday 9 October 2027".
  eventDate: string;
  venueName: string;
  joinUrl: string;
  // "Stop inviting me": the pool works like a mailing list, so every send carries a way off it.
  optOutUrl: string;
}

const FONT = "font-family:'Google Sans',Roboto,sans-serif;letter-spacing:-0.01em;";
const WORDMARK_URL =
  'https://storage.googleapis.com/devfest-sydney-2026.firebasestorage.app/site-assets/logo-wordmark.png';

export function volunteerInviteEmailSubject(eventName: string): string {
  return `Want to crew ${eventName}?`;
}

export function buildVolunteerInviteEmail(details: VolunteerInviteEmailDetails): string {
  const firstName = details.name.trim().split(/\s+/)[0] || details.name;
  const bodyText = `${FONT}font-size:16px;font-weight:400;color:rgba(255,255,255,0.85);line-height:1.75;`;
  const when = [details.eventDate, details.venueName].filter(Boolean).map(escapeHtml).join(' &middot; ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(volunteerInviteEmailSubject(details.eventName))}</title>
</head>
<body style="margin:0;padding:0;background:#010103;${FONT}color:#ffffff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#010103;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;">
          <tr>
            <td style="padding:0 0 32px;text-align:center;">
              <img src="${WORDMARK_URL}" alt="DevFest Sydney" width="180" style="display:inline-block;width:180px;height:auto;border:0;" />
            </td>
          </tr>
          <tr>
            <td style="padding:0 8px;">
              <h1 style="margin:0 0 20px;${FONT}font-size:28px;font-weight:700;color:#ffffff;line-height:1.3;text-align:center;">
                Want to crew ${escapeHtml(details.eventName)}, ${escapeHtml(firstName)}?
              </h1>
              ${when ? `<p style="margin:0 0 24px;${FONT}font-size:15px;font-weight:700;color:#34A853;text-align:center;">${when}</p>` : ''}
              <p style="margin:0 0 16px;${bodyText}">
                You helped make a GDG Sydney event happen before, and we&rsquo;d love to have you back on the crew.
              </p>
              <p style="margin:0 0 28px;${bodyText}">
                We&rsquo;ve kept your details, so there&rsquo;s no form to fill in from scratch: check them, tell us where
                you&rsquo;d like to help this time, and you&rsquo;re in the queue. We&rsquo;ll confirm your spot by email.
              </p>
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding:0 0 28px;">
                    <a href="${escapeHtml(details.joinUrl)}" style="display:inline-block;background:#188038;color:#ffffff;${FONT}font-size:16px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:4px;">I&rsquo;m in</a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;${FONT}font-size:14px;color:rgba(255,255,255,0.6);line-height:1.6;">
                Can&rsquo;t make it this time? No need to reply. Questions? Write to
                <a href="mailto:hello@gdgsydney.com" style="color:#34A853;">hello@gdgsydney.com</a>.
              </p>
              <p style="margin:16px 0 0;${FONT}font-size:12px;color:rgba(255,255,255,0.5);line-height:1.6;">
                You&rsquo;re getting this because you signed up to volunteer with GDG Sydney.
                <a href="${escapeHtml(details.optOutUrl)}" style="color:rgba(255,255,255,0.6);">Don&rsquo;t invite me again</a>.
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
