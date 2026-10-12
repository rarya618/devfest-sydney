import { escapeHtml } from '@/lib/escapeHtml';

// The post-event thank-you to every speaker and co-speaker: the photos from the day, and
// a link to /speaker/thanks to claim a speaker mug and an Asana trial. Same table-based,
// inline-styled construction as speakerTicketEmail.ts, since email clients strip
// stylesheets.

export interface SpeakerThanksEmailDetails {
  name: string;
  photosUrl: string;
  thanksUrl: string;
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

function button(href: string, label: string, background: string): string {
  return `<a href="${href}" style="display:inline-block;background:${background};border-radius:8px;padding:14px 28px;${FONT}font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;">${label}</a>`;
}

export function speakerThanksEmailSubject(): string {
  return 'Thank you for speaking at DevFest Sydney 2026';
}

export function buildSpeakerThanksEmail(details: SpeakerThanksEmailDetails): string {
  const firstName = details.name.trim().split(/\s+/)[0] || details.name;
  const bodyText = `${FONT}font-size:16px;font-weight:400;color:rgba(255,255,255,0.85);line-height:1.75;`;
  const sectionHeading = `${FONT}font-size:20px;font-weight:700;color:#ffffff;line-height:1.5;`;
  const smallText = `${FONT}font-size:14px;font-weight:400;color:rgba(255,255,255,0.6);line-height:1.6;`;
  const photosUrl = escapeHtml(details.photosUrl);
  const thanksUrl = escapeHtml(details.thanksUrl);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Thank you for speaking at DevFest Sydney 2026</title>
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
                Thank you
              </h1>
              <h2 style="margin:0 0 20px;${FONT}font-size:44px;font-weight:700;color:#4285F4;line-height:1.4;text-align:center;">
                ${escapeHtml(firstName)}
              </h2>
              <p style="margin:0 0 32px;${FONT}font-size:20px;font-weight:400;color:#ffffff;line-height:1.6;text-align:center;">
                DevFest Sydney 2026 happened because you got up and shared what you know. Thank you for giving us your time and your talk.
              </p>

              <!-- Photos -->
              ${card(`
                <h3 style="margin:0 0 12px;${sectionHeading}">Photos from the day</h3>
                <p style="margin:0 0 20px;${bodyText}">The photos are up. You are welcome to download and share any of them, and if you post one, tag GDG Sydney so we can cheer you on.</p>
                <div style="text-align:center;">${button(photosUrl, 'See the photos', '#1967d2')}</div>
              `)}

              <!-- Gifts -->
              ${card(`
                <h3 style="margin:0 0 12px;${sectionHeading}">A small thank-you from us</h3>
                <p style="margin:0 0 12px;${bodyText}">We would like to send you two things:</p>
                <p style="margin:0 0 8px;${bodyText}"><strong style="color:#ffffff;">A DevFest Sydney speaker mug</strong>, posted to you wherever you are in the world.</p>
                <p style="margin:0 0 20px;${bodyText}"><strong style="color:#ffffff;">An Asana Enterprise trial</strong>, courtesy of our sponsor Asana, set up on your work email.</p>
                <div style="text-align:center;">${button(thanksUrl, 'Claim your mug and trial', '#188038')}</div>
                <p style="margin:20px 0 0;${smallText}text-align:center;">It takes about a minute. Take one, the other or both. We use your address only to post the mug and delete it once it ships, and pass your work email to Asana only if you say so.</p>
              `)}

              <!-- Questions -->
              ${card(`
                <p style="margin:0 0 6px;${FONT}font-size:22px;font-weight:700;color:#ffffff;line-height:1.5;text-align:center;">Anything else?</p>
                <p style="margin:0;${bodyText}text-align:center;">Just reply to this email. We would love to hear how the day went for you.</p>
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
