import { escapeHtml } from '@/lib/escapeHtml';
import { emailLogoTag } from '@/lib/eventCopy';

// The speaker portal's sign-in email. Same table-based, inline-styled construction as the
// other emails, since email clients strip stylesheets. GDG Sydney's logo, not DevFest's: the
// portal covers every event.

export interface PortalSignInEmailDetails {
  signInUrl: string;
  validForMinutes: number;
}

const FONT = "font-family:'Google Sans',Roboto,sans-serif;letter-spacing:-0.01em;";

export function buildPortalSignInEmail(details: PortalSignInEmailDetails): string {
  const signInUrl = escapeHtml(details.signInUrl);
  const bodyText = `${FONT}font-size:16px;font-weight:400;color:rgba(255,255,255,0.85);line-height:1.75;`;
  const smallText = `${FONT}font-size:14px;font-weight:400;color:rgba(255,255,255,0.6);line-height:1.6;`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Sign in to the GDG Sydney speaker portal</title>
</head>
<body style="margin:0;padding:0;background:#202124;${FONT}color:#ffffff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#202124;padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#202124;">
          <tr>
            <td style="padding:48px 40px;text-align:center;">
              ${emailLogoTag(null, 220, 'display:block;margin:0 auto 36px;')}
              <h1 style="margin:0 0 16px;${FONT}font-size:32px;font-weight:700;color:#ffffff;line-height:1.4;">
                Sign in to the speaker portal
              </h1>
              <p style="margin:0 0 32px;${bodyText}">
                Use the button below to sign in. The link works once, for the next ${details.validForMinutes} minutes.
              </p>
              <a href="${signInUrl}" style="display:inline-block;background:#1967d2;border-radius:8px;padding:14px 28px;${FONT}font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;">Sign in</a>
              <p style="margin:32px 0 0;${smallText}">
                If you didn't ask to sign in, you can ignore this email. Nobody can sign in without the link.
              </p>
              <p style="margin:32px 0 0;${FONT}font-size:16px;font-weight:400;color:rgba(255,255,255,0.85);">
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
