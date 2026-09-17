import { escapeHtml } from '@/lib/escapeHtml';

// The speaker-facing "here is your complimentary ticket" email, sent from the admin once a
// speaker has confirmed. Same table-based, inline-styled construction as
// acceptanceEmail.ts, and for the same reason: email clients strip stylesheets.

export interface SpeakerTicketEmailDetails {
  name: string;
  ticketUrl: string;
}

const FONT = "font-family:'Google Sans',Roboto,sans-serif;letter-spacing:-0.01em;";
const WORDMARK_URL =
  'https://storage.googleapis.com/devfest-sydney-2026.firebasestorage.app/site-assets/logo-wordmark.png';

function card(innerHtml: string): string {
  return `
    <table cellpadding="0" cellspacing="0" width="100%" style="background:rgba(255,255,255,0.06);border-radius:12px;margin:0 0 24px;">
      <tr><td style="padding:28px 32px;">${innerHtml}</td></tr>
    </table>`;
}

export function speakerTicketEmailSubject(): string {
  return 'Your complimentary speaker ticket for DevFest Sydney 2026';
}

export function buildSpeakerTicketEmail(details: SpeakerTicketEmailDetails): string {
  const firstName = details.name.trim().split(/\s+/)[0] || details.name;
  const bodyText = `${FONT}font-size:16px;font-weight:400;color:rgba(255,255,255,0.85);line-height:1.75;`;
  const sectionHeading = `${FONT}font-size:20px;font-weight:700;color:#ffffff;line-height:1.5;`;
  const ticketUrl = escapeHtml(details.ticketUrl);

  // The public event page, for the "please share it" ask. Rendered only when it is
  // configured: asking a speaker to pass on a link we have not given them reads as a
  // broken email, the same call the acceptance template makes.
  const publicTicketUrl = process.env.NEXT_PUBLIC_HUMANITIX_URL || '';
  const generalTicketLink = publicTicketUrl
    ? `<a href="${escapeHtml(publicTicketUrl)}" style="color:#34A853;text-decoration:underline;">the general ticket link</a>`
    : 'the general ticket link';
  const spreadTheWordSection = card(`
                <h3 style="margin:0 0 12px;${sectionHeading}">Help us spread the word</h3>
                <p style="margin:0 0 12px;${bodyText}">Speaker announcement posts are going out on LinkedIn soon, yours among them. A share when it lands would mean a lot to us.</p>
                <p style="margin:0;${bodyText}">If you can pass ${generalTicketLink} on to your network as well, we would really appreciate it.</p>
              `);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your complimentary speaker ticket for DevFest Sydney 2026</title>
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
                You're on the lineup
              </h1>
              <h2 style="margin:0 0 20px;${FONT}font-size:44px;font-weight:700;color:#4285F4;line-height:1.4;text-align:center;">
                ${escapeHtml(firstName)}
              </h2>
              <p style="margin:0 0 32px;${FONT}font-size:20px;font-weight:400;color:#ffffff;line-height:1.6;text-align:center;">
                Thanks for confirming. Here is your complimentary speaker ticket.
              </p>

              <!-- Claim the ticket -->
              ${card(`
                <p style="margin:0 0 6px;${FONT}font-size:22px;font-weight:700;color:#ffffff;line-height:1.5;text-align:center;">Claim your ticket</p>
                <p style="margin:0 0 20px;${bodyText}text-align:center;">The link below unlocks your speaker ticket. Register once so we have you on the attendee list for the day.</p>
                <div style="text-align:center;">
                  <a href="${ticketUrl}" style="display:inline-block;background:#1a73e8;border-radius:8px;padding:14px 28px;${FONT}font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;">Claim your speaker ticket</a>
                </div>
                <p style="margin:20px 0 0;${FONT}font-size:14px;font-weight:400;color:rgba(255,255,255,0.6);line-height:1.6;text-align:center;word-break:break-all;">
                  <a href="${ticketUrl}" style="color:rgba(255,255,255,0.6);text-decoration:underline;">${ticketUrl}</a>
                </p>
              `)}

              <p style="margin:0 0 32px;${bodyText}">
                This one is just for our speakers, so please keep it to yourself.
              </p>

              ${spreadTheWordSection}

              ${card(`
                <h3 style="margin:0 0 12px;${sectionHeading}">The day itself</h3>
                <p style="margin:0 0 12px;${bodyText}">Saturday 10 October 2026 at Torrens University, Shop 1/37 Foveaux St, Surry Hills.</p>
                <p style="margin:0;${bodyText}">We will be in touch closer to the day with your speaking slot, run sheet and AV details.</p>
              `)}

              <!-- Questions -->
              ${card(`
                <p style="margin:0 0 6px;${FONT}font-size:22px;font-weight:700;color:#ffffff;line-height:1.5;text-align:center;">Trouble with the link?</p>
                <p style="margin:0;${bodyText}text-align:center;">Just reply to this email and we'll sort it out.</p>
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
