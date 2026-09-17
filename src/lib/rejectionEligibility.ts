import type { SubmissionStatus } from '@/lib/types';

// Rejection emails go to people, not proposals: someone who sent three talks gets one
// email naming all three. Shared by the dashboard, which decides what to offer, and by
// sendRejectionEmail, which enforces it, so the two can't disagree.

export type RejectionEmailBlocker = 'accepted-proposal' | 'pending-proposal';

export function applicantKey(email: string): string {
  return email.trim().toLowerCase();
}

// Why a person's rejected proposals can't be emailed yet, or null when they can.
// - accepted-proposal: they are speaking, and a "we couldn't feature your talk" letter
//   beside their acceptance reads as a mistake. Never sent; an organiser tells them.
// - pending-proposal: sending now would mean a second email once the rest is decided.
// Archived proposals are ignored either way: they were set aside, not reviewed.
export function rejectionEmailBlocker(statusesForApplicant: SubmissionStatus[]): RejectionEmailBlocker | null {
  if (statusesForApplicant.includes('accepted')) return 'accepted-proposal';
  if (statusesForApplicant.includes('pending')) return 'pending-proposal';
  return null;
}
