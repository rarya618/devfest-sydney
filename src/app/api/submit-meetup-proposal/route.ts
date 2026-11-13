import { NextRequest, NextResponse } from 'next/server';
import { gdgSiteCorsHeaders } from '@/lib/gdgSiteOrigins';
import { fileMeetupProposal, validateMeetupProposal, type MeetupProposalFields } from '@/lib/proposalFiling';

// Talk proposals for GDG Sydney's monthly meetups, from the /speak form on gdgsydney.com
// (a separate, static Astro site). Stage 5 of the "One GDG Sydney Site" plan in PM.md:
// meetup proposals go through this app like the CfS does, instead of a Google Sheet.
//
// The form posts across domains, so this route answers CORS for the GDG Sydney site only.
// Writes go through the Admin SDK into `meetupProposals`, which has no client create path
// in firestore.rules.

function corsHeaders(origin: string | null): Record<string, string> {
  return gdgSiteCorsHeaders(origin, 'POST, OPTIONS');
}

export function OPTIONS(request: NextRequest) {
  const headers = corsHeaders(request.headers.get('origin'));
  return new NextResponse(null, { status: Object.keys(headers).length ? 204 : 403, headers });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);
  // A browser on any other site is refused outright. (Non-browser clients send no Origin;
  // they still face validation and the honeypot below.)
  if (origin && !Object.keys(headers).length) {
    return NextResponse.json({ message: 'Not allowed.' }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid request.' }, { status: 400, headers });
  }

  // Honeypot: a field people never see. Anything in it is a bot, so pretend it worked
  // and store nothing, rather than teaching it what got it caught.
  if (typeof body.companyWebsite === 'string' && body.companyWebsite.trim()) {
    return NextResponse.json({ ok: true }, { status: 201, headers });
  }

  let proposal: MeetupProposalFields;
  try {
    proposal = validateMeetupProposal(body);
  } catch (err) {
    return NextResponse.json(
      { message: err instanceof Error ? err.message : 'Invalid request.' },
      { status: 400, headers }
    );
  }

  try {
    // The bcc on the confirmation is how organisers hear about new proposals.
    await fileMeetupProposal(proposal, 'gdgsydney.com/speak');
  } catch (err) {
    console.error('Firestore write failed for meetup proposal:', proposal.email, err);
    return NextResponse.json(
      { message: "We couldn't save your proposal. Please try again in a moment." },
      { status: 500, headers }
    );
  }

  return NextResponse.json({ ok: true }, { status: 201, headers });
}
