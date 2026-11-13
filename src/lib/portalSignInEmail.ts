import { escapeHtml } from '@/lib/escapeHtml';
import { emailLogoTag } from '@/lib/eventCopy';

// The speaker portal's sign-in email, styled like the portal itself (and gdgsydney.com): Black
// 02 page, GDG Sydney logo, left-aligned, one bold heading and a pill button. Table-based with
// inline styles and solid colours, since email clients strip stylesheets and some ignore
// rgba(). The button is a bgcolor cell so Outlook keeps its shape, and the link is repeated as
// text for clients that block buttons.

export interface PortalSignInEmailDetails {
  email: string;
  signInUrl: string;
  validForMinutes: number;
}

export const PORTAL_SIGN_IN_SUBJECT = 'Your GDG Sydney sign-in link';

const FONT = "font-family:'Google Sans',Roboto,Arial,sans-serif;";
const PAGE = '#1e1e1e';
const TEXT = '#f0f0f0';
const MUTED = '#b4b4b0';
const FAINT = '#9aa0a6';
const RULE = '#3c4043';
const BUTTON = '#1967d2';
const LINK = '#8ab4f8';

export function buildPortalSignInEmail(details: PortalSignInEmailDetails): string {
  const signInUrl = escapeHtml(details.signInUrl);
  const email = escapeHtml(details.email);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="dark" />
  <meta name="supported-color-schemes" content="dark" />
  <title>${PORTAL_SIGN_IN_SUBJECT}</title>
</head>
<body style="margin:0;padding:0;background:${PAGE};">
  <!-- Inbox preview line -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Sign in to see your talks and proposals. The link works once, for ${details.validForMinutes} minutes.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${PAGE}" style="background:${PAGE};">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;">
          <tr>
            <td style="padding:0 0 48px;">
              ${emailLogoTag(null, 236, 'display:block;border:0;')}
            </td>
          </tr>
          <tr>
            <td style="${FONT}">
              <h1 style="margin:0 0 16px;${FONT}font-size:36px;line-height:1.1;font-weight:700;letter-spacing:-0.02em;color:${TEXT};">
                Sign in to GDG&nbsp;Sydney
              </h1>
              <p style="margin:0 0 32px;${FONT}font-size:16px;line-height:1.6;color:${MUTED};">
                Use the button to sign in as <strong style="color:${TEXT};font-weight:700;">${email}</strong> and see your talks, proposals and speaker profile.
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td bgcolor="${BUTTON}" style="background:${BUTTON};border-radius:999px;">
                    <a href="${signInUrl}" style="display:inline-block;padding:14px 32px;${FONT}font-size:16px;line-height:1;font-weight:700;color:#ffffff;text-decoration:none;border-radius:999px;">Sign in</a>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;${FONT}font-size:14px;line-height:1.6;color:${MUTED};">
                The link works once, for the next ${details.validForMinutes} minutes.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 0 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr><td style="border-top:1px solid ${RULE};font-size:0;line-height:0;">&nbsp;</td></tr>
              </table>
              <p style="margin:24px 0 8px;${FONT}font-size:13px;line-height:1.6;color:${FAINT};">
                Button not working? Paste this link into your browser:
              </p>
              <p style="margin:0 0 24px;${FONT}font-size:13px;line-height:1.5;word-break:break-all;">
                <a href="${signInUrl}" style="color:${LINK};text-decoration:underline;">${signInUrl}</a>
              </p>
              <p style="margin:0;${FONT}font-size:13px;line-height:1.6;color:${FAINT};">
                Didn&rsquo;t ask to sign in? You can ignore this email: nobody can sign in without the link.
                Sent by <a href="https://gdgsydney.com" style="color:${MUTED};text-decoration:underline;">GDG Sydney</a>.
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
