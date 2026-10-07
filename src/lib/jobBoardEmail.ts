import { escapeHtml } from '@/lib/escapeHtml';

const font = "font-family:'Google Sans',Roboto,sans-serif;letter-spacing:-0.01em;";

interface JobBoardEmailContent {
  firstName: string;
  heading: string;
  // The role title, or the person's headline: what they posted, read back to them.
  recapTitle: string;
  recapSubtitle: string;
  body: string;
}

// One shell for both confirmations (an employer's role and an attendee's profile). Same
// table-based, dark construction as the Builder Showcase confirmation, cut down: the
// email exists to say "we've got it, an organiser will check it".
export function buildJobBoardEmail(content: JobBoardEmailContent): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(content.heading)}: DevFest Sydney 2026 job board</title>
</head>
<body style="margin:0;padding:0;background:#202124;${font}color:#ffffff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#202124;padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#202124;">
          <tr>
            <td style="padding:60px 40px;text-align:center;">
              <img src="https://storage.googleapis.com/devfest-sydney-2026.firebasestorage.app/site-assets/logo-wordmark.png" alt="DevFest Sydney" width="221" height="40" style="display:block;margin:0 auto 40px;" />

              <h1 style="margin:0 0 8px;${font}font-size:36px;font-weight:400;color:#ffffff;line-height:1.4;">
                ${escapeHtml(content.heading)}
              </h1>
              <h2 style="margin:0 0 24px;${font}font-size:40px;font-weight:700;color:#4285F4;line-height:1.5;">
                ${escapeHtml(content.firstName)}
              </h2>
              <p style="margin:0 0 40px;${font}font-size:20px;font-weight:400;color:#ffffff;line-height:1.75;">
                ${escapeHtml(content.body)}
              </p>

              <table cellpadding="0" cellspacing="0" width="100%" style="background:rgba(255,255,255,0.06);border-radius:12px;">
                <tr>
                  <td style="padding:32px;text-align:center;">
                    <p style="margin:0 0 8px;${font}font-size:26px;font-weight:700;color:#ffffff;line-height:1.4;">${escapeHtml(content.recapTitle)}</p>
                    <p style="margin:0;${font}font-size:18px;font-weight:400;color:rgba(255,255,255,0.75);line-height:1.6;">${escapeHtml(content.recapSubtitle)}</p>
                  </td>
                </tr>
              </table>

              <div style="margin-top:40px;">
                <p style="margin:0 0 8px;${font}font-size:22px;font-weight:700;color:#ffffff;line-height:1.5;">Need to change or remove it?</p>
                <p style="margin:0;${font}font-size:18px;font-weight:400;color:#ffffff;line-height:1.5;">Just reply to this email and we'll sort it out.</p>
              </div>

              <p style="margin:40px 0 0;${font}font-size:18px;font-weight:400;color:#ffffff;">
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

export function firstNameOf(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}
