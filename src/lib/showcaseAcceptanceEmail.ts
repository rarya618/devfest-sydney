import { formatDeadlineDate } from '@/lib/format';
import { SHOWCASE_STAGE_LABELS } from '@/lib/showcaseLabels';
import type { ShowcaseStage } from '@/lib/types';
import { escapeHtml } from '@/lib/escapeHtml';

// Same table-based construction and escaping as volunteerAcceptanceEmail.ts: email
// clients strip stylesheets, and several still ignore flexbox and CSS variables entirely.
// Yellow, the Builder Showcase accent across the site. White on #f9ab00 fails contrast,
// so the button label is Black 02, as on the site's yellow buttons.

export interface ShowcaseAcceptanceEmailDetails {
  name: string;
  projectName: string;
  stage: ShowcaseStage;
  coPresenterNames: string[];
  confirmUrl: string;
  confirmByIso: string;
}

const FONT = "font-family:'Google Sans',Roboto,sans-serif;letter-spacing:-0.01em;";
const WORDMARK_URL =
  'https://storage.googleapis.com/devfest-sydney-2026.firebasestorage.app/site-assets/logo-wordmark.png';
const SHOWCASE_YELLOW = '#f9ab00';
const BLACK_02 = '#1e1e1e';

function card(innerHtml: string): string {
  return `
    <table cellpadding="0" cellspacing="0" width="100%" style="background:rgba(255,255,255,0.06);border-radius:12px;margin:0 0 24px;">
      <tr><td style="padding:28px 32px;">${innerHtml}</td></tr>
    </table>`;
}

// "Ana", "Ana and Ben", "Ana, Ben and Cat": read aloud in a sentence, not listed.
function joinNames(names: string[]): string {
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

export function showcaseAcceptanceEmailSubject(projectName: string): string {
  return `${projectName} is in the DevFest Sydney 2026 Builder Showcase`;
}

export function buildShowcaseAcceptanceEmail(details: ShowcaseAcceptanceEmailDetails): string {
  const firstName = details.name.trim().split(/\s+/)[0] || details.name;
  const confirmBy = formatDeadlineDate(details.confirmByIso);

  const bodyText = `${FONT}font-size:16px;font-weight:400;color:rgba(255,255,255,0.85);line-height:1.75;`;
  const sectionHeading = `${FONT}font-size:20px;font-weight:700;color:#ffffff;line-height:1.5;`;

  // Co-presenters are on the entry but not on this email: we only hold an address for
  // some of them, and the entrant is who we deal with. So the entrant is asked to pass it on.
  const coPresenterLine = details.coPresenterNames.length > 0
    ? `<p style="margin:0 0 32px;${bodyText}">Please pass this on to ${escapeHtml(joinNames(details.coPresenterNames))}, and confirm once for the whole team.</p>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You're in the DevFest Sydney 2026 Builder Showcase</title>
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
                You're in
              </h1>
              <h2 style="margin:0 0 20px;${FONT}font-size:44px;font-weight:700;color:${SHOWCASE_YELLOW};line-height:1.4;text-align:center;">
                ${escapeHtml(firstName)}
              </h2>
              <p style="margin:0 0 32px;${FONT}font-size:20px;font-weight:400;color:#ffffff;line-height:1.6;text-align:center;">
                We'd love you to demo your project in the Builder Showcase at DevFest Sydney 2026
              </p>

              <!-- Project -->
              ${card(`
                <p style="margin:0 0 6px;${FONT}font-size:14px;font-weight:700;color:rgba(255,255,255,0.6);line-height:1.5;text-align:center;">Your demo</p>
                <p style="margin:0 0 16px;${FONT}font-size:24px;font-weight:700;color:#ffffff;line-height:1.4;text-align:center;">${escapeHtml(details.projectName)}</p>
                <div style="text-align:center;">
                  <span style="display:inline-block;background:rgba(255,255,255,0.06);border-radius:20px;padding:7px 14px;white-space:nowrap;">
                    <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${SHOWCASE_YELLOW};margin-right:10px;vertical-align:middle;"></span><span style="${FONT}font-size:15px;font-weight:700;color:#ffffff;vertical-align:middle;">${escapeHtml(SHOWCASE_STAGE_LABELS[details.stage])}</span>
                  </span>
                </div>
              `)}

              <!-- Confirm -->
              ${card(`
                <p style="margin:0 0 6px;${FONT}font-size:22px;font-weight:700;color:#ffffff;line-height:1.5;text-align:center;">So what's next?</p>
                <p style="margin:0 0 20px;${bodyText}text-align:center;">Please confirm you'll be there to present.</p>
                <div style="text-align:center;">
                  <a href="${escapeHtml(details.confirmUrl)}" style="display:inline-block;background:${SHOWCASE_YELLOW};border-radius:8px;padding:14px 28px;${FONT}font-size:16px;font-weight:700;color:${BLACK_02};text-decoration:none;">Confirm your demo</a>
                </div>
              `)}

              <p style="margin:0 0 ${coPresenterLine ? '16px' : '32px'};${bodyText}">
                Please do so by ${escapeHtml(confirmBy)}, as we will need to offer your slot to someone else if we don't hear from you.
              </p>
              ${coPresenterLine}

              <!-- The showcase -->
              <h3 style="margin:0 0 12px;${sectionHeading}">How the showcase works</h3>
              <p style="margin:0 0 16px;${bodyText}">
                You get five minutes on the main stage in the Auditorium, mid-afternoon, and the room votes on its favourite. Slides are optional: the audience would rather see the thing working.
              </p>
              <p style="margin:0 0 32px;${bodyText}">
                DevFest Sydney is on Saturday 10 October at Torrens University, Surry Hills. Closer to the day we'll send you the running order and when to be at the stage for a quick tech check. If there's anything you need for your demo that you didn't mention when you entered, just reply and tell us.
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

export interface ShowcaseConfirmationNoticeDetails {
  name: string;
  email: string;
  projectName: string;
  coPresenterNames: string[];
  demoRequirements: string;
  confirmedAtIso: string;
}

// Sent to the organisers when an entrant confirms. Plainer than the entrant-facing
// template on purpose: it is a working notification, read in a shared inbox, and what
// matters is who is demoing what, and anything the stage needs for it.
export function buildShowcaseConfirmedNotice(details: ShowcaseConfirmationNoticeDetails): string {
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
  <title>Showcase demo confirmed: ${escapeHtml(details.projectName)}</title>
</head>
<body style="margin:0;padding:0;background:#202124;${FONT}color:#ffffff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#202124;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#202124;">
          <tr>
            <td style="padding:40px;">
              <img src="${WORDMARK_URL}" alt="DevFest Sydney" width="177" height="32" style="display:block;margin:0 0 32px;" />

              <h1 style="margin:0 0 8px;${FONT}font-size:28px;font-weight:700;color:${SHOWCASE_YELLOW};line-height:1.4;">Showcase demo confirmed</h1>
              <p style="margin:0 0 24px;${bodyText}">${escapeHtml(details.name)} has confirmed they'll demo ${escapeHtml(details.projectName)} in the Builder Showcase.</p>

              ${card(`<table cellpadding="0" cellspacing="0" width="100%">
                ${row('Project', details.projectName)}
                ${details.coPresenterNames.length > 0 ? row('Presenting with', joinNames(details.coPresenterNames)) : ''}
                ${details.demoRequirements ? row('Needs on the day', details.demoRequirements) : ''}
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
