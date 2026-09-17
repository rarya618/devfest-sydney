import { escapeHtml } from '@/lib/escapeHtml';

// Sent to a speaker whose proposal was not accepted. Same table-based, inline-styled
// construction as acceptanceEmail.ts, but laid out as a plain letter rather than a
// celebration: no big heading, no pills, nothing that reads like the email they hoped for.

export interface RejectionEmailDetails {
  name: string;
  // Every rejected proposal from this person, oldest first. One email covers them all.
  talkTitles: string[];
}

const FONT = "font-family:'Google Sans',Roboto,sans-serif;letter-spacing:-0.01em;";
const WORDMARK_URL =
  'https://storage.googleapis.com/devfest-sydney-2026.firebasestorage.app/site-assets/logo-wordmark.png';

export function rejectionEmailSubject(talkTitles: string[]): string {
  return talkTitles.length === 1
    ? `Your DevFest Sydney 2026 proposal: ${talkTitles[0]}`
    : 'Your DevFest Sydney 2026 proposals';
}

// "A," for one title, "A" and "B," for two, "A", "B" and "C," for three: the comma the
// sentence needs sits inside the last title's quotes, as in the dictated copy.
function quotedTitleList(talkTitles: string[]): string {
  const quoted = talkTitles.map((title) => `"${escapeHtml(title)}"`);
  const last = `"${escapeHtml(talkTitles[talkTitles.length - 1])},"`;
  if (quoted.length === 1) return last;
  return `${quoted.slice(0, -1).join(', ')} and ${last}`;
}

export function buildRejectionEmail(details: RejectionEmailDetails): string {
  const bodyText = `${FONT}font-size:16px;font-weight:400;color:rgba(255,255,255,0.85);line-height:1.75;`;
  const humanitixUrl = process.env.NEXT_PUBLIC_HUMANITIX_URL || '';
  const isPlural = details.talkTitles.length > 1;

  // Without the Humanitix URL the "tickets are here" clause would point at nothing, so
  // the invitation to attend stands on its own instead.
  const ticketSentence = humanitixUrl
    ? `We'd still love to see you at DevFest.
        <a href="${escapeHtml(humanitixUrl)}" style="color:#4285F4;text-decoration:underline;">Grab a ticket here</a>.`
    : `We'd still love to see you at DevFest.`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(rejectionEmailSubject(details.talkTitles))}</title>
</head>
<body style="margin:0;padding:0;background:#202124;${FONT}color:#ffffff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#202124;padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#202124;">
          <tr>
            <td style="padding:48px 40px;">

              <!-- Wordmark -->
              <img src="${WORDMARK_URL}" alt="DevFest Sydney" width="221" height="40" style="display:block;margin:0 0 40px;" />

              <p style="margin:0 0 20px;${bodyText}">Hi ${escapeHtml(details.name)},</p>

              <p style="margin:0 0 20px;${bodyText}">
                Thank you so much for submitting your ${isPlural ? 'proposals' : 'proposal'}, ${quotedTitleList(details.talkTitles)} to DevFest Sydney! We truly appreciate the time and effort you put into sharing your expertise with our community.
              </p>

              <p style="margin:0 0 20px;${bodyText}">
                We received an overwhelming number of incredible submissions this year. Because we have a limited number of speaking slots, our team had to make some difficult choices to curate a balanced agenda, and that's why it's taken this long to finalise the speakers list. While we aren't able to feature ${isPlural ? 'your talks' : 'your talk'} in the main DevFest schedule this time around, we were genuinely impressed by ${isPlural ? 'your topics' : 'your topic'} and the insights you proposed.
              </p>

              <p style="margin:0 0 20px;${bodyText}">
                Because your content is so valuable, we'd love to know if you'd be open to presenting ${isPlural ? 'one of these talks' : 'this same talk'} at one of our community meetups or specialised events throughout the year. We frequently host smaller gatherings where ${isPlural ? 'your topics would be' : 'your topic would be'} a great fit. If you're interested, let us know and we'll reach out as we start scheduling.
              </p>

              <p style="margin:0 0 20px;${bodyText}">
                ${ticketSentence} We hope you'll join us as an attendee to connect with the rest of the community.
              </p>

              <p style="margin:0 0 32px;${bodyText}">
                Thank you again for your enthusiasm, your ideas, and for being such an active part of our developer community.
              </p>

              <p style="margin:0 0 40px;${bodyText}">
                Warm regards,<br />
                <span style="color:#ffffff;font-weight:700;">GDG Sydney Organising Team</span>
              </p>

              <p style="margin:0;${FONT}font-size:14px;font-weight:400;color:rgba(255,255,255,0.6);">
                Organised by <a href="https://gdgsydney.com" style="color:rgba(255,255,255,0.85);text-decoration:underline;">GDG Sydney</a>
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
