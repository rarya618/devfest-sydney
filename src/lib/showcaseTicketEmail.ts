import { escapeHtml } from '@/lib/escapeHtml';

// The entrant-facing "here is your complimentary ticket" email, sent from /admin/showcase
// once an entrant has confirmed their demo. Same table-based, inline-styled construction
// as speakerTicketEmail.ts, and for the same reason: email clients strip stylesheets.

export interface ShowcaseTicketEmailDetails {
  name: string;
  projectName: string;
  // Co-presenters need a ticket each, and only the entrant gets this email, so the copy
  // asks them to pass the link on when there is anyone to pass it to.
  coPresenterNames: string[];
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

// "Grace", "Grace and Alan", "Grace, Alan and Linus".
function joinNames(names: string[]): string {
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

export function showcaseTicketEmailSubject(): string {
  return 'Your complimentary Builder Showcase ticket for DevFest Sydney 2026';
}

export function buildShowcaseTicketEmail(details: ShowcaseTicketEmailDetails): string {
  const firstName = details.name.trim().split(/\s+/)[0] || details.name;
  const bodyText = `${FONT}font-size:16px;font-weight:400;color:rgba(255,255,255,0.85);line-height:1.75;`;
  const sectionHeading = `${FONT}font-size:20px;font-weight:700;color:#ffffff;line-height:1.5;`;
  const ticketUrl = escapeHtml(details.ticketUrl);

  const sharingLine = details.coPresenterNames.length > 0
    ? `Please pass this link on to ${escapeHtml(joinNames(details.coPresenterNames))} so each of you can claim a ticket, and keep it within your team, as it unlocks presenter tickets.`
    : 'This one is just for our showcase presenters, so please keep it to yourself.';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your complimentary Builder Showcase ticket for DevFest Sydney 2026</title>
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
                You're in the showcase
              </h1>
              <h2 style="margin:0 0 20px;${FONT}font-size:44px;font-weight:700;color:#f9ab00;line-height:1.4;text-align:center;">
                ${escapeHtml(firstName)}
              </h2>
              <p style="margin:0 0 32px;${FONT}font-size:20px;font-weight:400;color:#ffffff;line-height:1.6;text-align:center;">
                Thanks for confirming ${escapeHtml(details.projectName)}. Here is your complimentary ticket.
              </p>

              <!-- Claim the ticket -->
              ${card(`
                <p style="margin:0 0 6px;${FONT}font-size:22px;font-weight:700;color:#ffffff;line-height:1.5;text-align:center;">Claim your ticket</p>
                <p style="margin:0 0 20px;${bodyText}text-align:center;">The link below unlocks your presenter ticket. Register once so we have you on the attendee list for the day.</p>
                <div style="text-align:center;">
                  <a href="${ticketUrl}" style="display:inline-block;background:#f9ab00;border-radius:8px;padding:14px 28px;${FONT}font-size:16px;font-weight:700;color:#1e1e1e;text-decoration:none;">Claim your showcase ticket</a>
                </div>
                <p style="margin:20px 0 0;${FONT}font-size:14px;font-weight:400;color:rgba(255,255,255,0.6);line-height:1.6;text-align:center;word-break:break-all;">
                  <a href="${ticketUrl}" style="color:rgba(255,255,255,0.6);text-decoration:underline;">${ticketUrl}</a>
                </p>
              `)}

              <p style="margin:0 0 32px;${bodyText}">
                ${sharingLine}
              </p>

              ${card(`
                <h3 style="margin:0 0 12px;${sectionHeading}">The day itself</h3>
                <p style="margin:0 0 12px;${bodyText}">Saturday 10 October 2026 at Torrens University, Shop 1/37 Foveaux St, Surry Hills.</p>
                <p style="margin:0;${bodyText}">We will be in touch closer to the day with the running order and when to be at the stage for a quick tech check.</p>
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
