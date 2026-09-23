import type { CalendarInviteSlot, CalendarInviteStatus, SpeakerSessionTime } from '@/lib/types';

// Pure, so the dashboard (a client component) and the send action agree on it.

// The talk title is part of the comparison because it is the invite's title: a corrected
// title is worth an update, the same as a moved slot.
export function sameInviteDetails(sent: CalendarInviteSlot, session: SpeakerSessionTime, talkTitle: string): boolean {
  return (
    sent.startTime === session.startTime &&
    sent.endTime === session.endTime &&
    sent.room === session.room &&
    sent.talkTitle === talkTitle
  );
}

export function calendarInviteStatus(
  sentSlot: CalendarInviteSlot | null,
  session: SpeakerSessionTime | null,
  talkTitle: string
): CalendarInviteStatus {
  if (!session) return sentSlot ? 'removed' : 'unscheduled';
  if (!sentSlot) return 'not-sent';
  return sameInviteDetails(sentSlot, session, talkTitle) ? 'sent' : 'changed';
}
