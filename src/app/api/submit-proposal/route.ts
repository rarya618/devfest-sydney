import { NextRequest, NextResponse } from 'next/server';
import { currentDevfestFlowState, loadCurrentDevfest } from '@/lib/events';
import { fileDevfestProposal, validateDevfestProposal, type DevfestProposalPayload } from '@/lib/proposalFiling';

export async function POST(request: NextRequest) {
  // Hiding the form is not the same as closing submissions: without this the endpoint
  // keeps accepting proposals after the deadline, from a stale tab or a direct post.
  const flowState = await currentDevfestFlowState('cfs');
  if (flowState.state === 'unreadable') {
    return NextResponse.json(
      { message: "We couldn't check whether we're taking proposals right now. Please try again in a moment." },
      { status: 503 }
    );
  }
  if (flowState.state !== 'open') {
    return NextResponse.json(
      { message: 'The Call for Speakers has closed, so we can no longer accept submissions. Thank you for your interest.' },
      { status: 403 }
    );
  }

  let submission: DevfestProposalPayload;

  try {
    const body = await request.json();
    submission = validateDevfestProposal(body);
  } catch (err) {
    return NextResponse.json(
      { message: err instanceof Error ? err.message : 'Invalid request.' },
      { status: 400 }
    );
  }

  try {
    // The event the proposal was filed under (stage 4e), read once per request already when
    // the form was checked as open.
    const eventName = (await loadCurrentDevfest())?.name ?? 'GDG Sydney';
    await fileDevfestProposal(submission, flowState.eventId, eventName);
  } catch (err) {
    console.error('Firestore write failed for submission:', submission.email, err);
    return NextResponse.json(
      { message: 'We couldn\'t save your proposal. Please try again in a moment.' },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
