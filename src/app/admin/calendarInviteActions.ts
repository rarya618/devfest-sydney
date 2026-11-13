'use server';

import { revalidatePath } from 'next/cache';
import { Resend } from 'resend';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAdminSession } from '@/lib/adminSession';
import { fetchSessionTimesByTalkId, SCHEDULE_ROOM_LABELS } from '@/lib/schedule';
import { calendarInviteStatus } from '@/lib/calendarInvite';
import {
  buildCalendarInviteEmail,
  buildSessionIcs,
  calendarInviteEmailSubject,
  type CalendarInviteKind,
} from '@/lib/calendarInviteEmail';
import type { CalendarInviteSlot, GdgEvent, ScheduleRoom, SpeakerSessionTime } from '@/lib/types';
import { loadEvent } from '@/lib/events';
import { eventScheduleUrl, formatVenueAddress } from '@/lib/eventCopy';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// A slot held in every room ('all') is named by the event's venue rather than a room.
function roomName(room: ScheduleRoom, event: GdgEvent): string {
  return room === 'all' ? event.venue?.name ?? event.name : SCHEDULE_ROOM_LABELS[room].name;
}

// Sends whatever the speaker's calendar needs to match the schedule: a first invite, an
// update when the slot or title has moved (same event, next SEQUENCE), or a cancellation
// when they have come off the schedule. A resend of an unchanged invite is allowed too,
// for a speaker who lost the first one.
//
// Speaker-only and confirmed-only, enforced here as well as by the button: the invite
// announces a slot, which is only settled once the speaker has said they are coming.
// `emailSent` is set on the one failure where the email did go out, so the bulk send can
// tell the admin not to retry that speaker.
export async function sendCalendarInvite(talkId: string, speakerId: string): Promise<{ error?: string; emailSent?: boolean }> {
  let senderEmail: string;
  try {
    ({ email: senderEmail } = await verifyAdminSession());
  } catch {
    return { error: 'Your session has expired. Please sign in again.' };
  }

  // Stage 4c: the talk holds the title, its proposal (whose confirmation decides whether it
  // is going ahead) and what was last sent to each presenter; the person holds the address.
  const talkRef = adminDb.collection('talks').doc(talkId);
  let speaker: FirebaseFirestore.DocumentData;
  let talk: FirebaseFirestore.DocumentData;
  let submission: FirebaseFirestore.DocumentData | undefined;
  let session: SpeakerSessionTime | null;
  let event: GdgEvent | null;
  try {
    const talkSnap = await talkRef.get();
    if (!talkSnap.exists) return { error: 'This talk is no longer in the lineup.' };
    talk = talkSnap.data()!;
    if (!((talk.speakerIds ?? []) as string[]).includes(speakerId)) {
      return { error: 'This speaker is no longer on this talk.' };
    }
    const speakerSnap = await adminDb.collection('speakers').doc(speakerId).get();
    if (!speakerSnap.exists) return { error: 'This speaker is no longer in the lineup.' };
    speaker = speakerSnap.data()!;
    if (talk.submissionId) {
      submission = (await adminDb.collection('submissions').doc(String(talk.submissionId)).get()).data();
    }
    // The talk's own event, not whichever DevFest the admin is looking at.
    session = (await fetchSessionTimesByTalkId(String(talk.eventId ?? '')))[talkId] ?? null;
    event = await loadEvent(String(talk.eventId ?? ''));
  } catch {
    // Deliberately stops here rather than treating a failed schedule read as "not on the
    // schedule", which would send a cancellation.
    return { error: 'Could not load this speaker or the schedule. Please try again.' };
  }

  if (!event) return { error: 'This talk isn\'t filed under an event that still exists.' };
  if (!submission?.speakerConfirmedAt) {
    return { error: 'This speaker hasn\'t confirmed yet, so they can\'t be sent a calendar invite.' };
  }
  const speakerEmail = String(speaker.email ?? '').trim();
  if (!EMAIL_PATTERN.test(speakerEmail)) {
    return { error: 'This speaker\'s email address doesn\'t look right. Fix it with Edit before sending.' };
  }

  const talkTitle = String(talk.talkTitle ?? '');
  const state = ((talk.speakerState ?? {})[speakerId] ?? {}) as Record<string, unknown>;
  const sentSlot = (state.calendarInviteSlot ?? null) as CalendarInviteSlot | null;
  const status = calendarInviteStatus(sentSlot, session, talkTitle);
  if (status === 'unscheduled') {
    return { error: 'This speaker isn\'t on the schedule yet, so there is no session to invite them to.' };
  }

  // A resend of an unchanged invite is worded as the invite again, not as an update.
  const kind: CalendarInviteKind = status === 'removed' ? 'cancel' : status === 'changed' ? 'update' : 'invite';
  // A cancellation describes the event being removed, which is what the last invite said.
  const slot: SpeakerSessionTime = kind === 'cancel' ? sentSlot! : session!;
  const cancelTitle = kind === 'cancel' && sentSlot?.talkTitle ? sentSlot.talkTitle : talkTitle;
  // SEQUENCE starts at 0 and rises with every send, so each one supersedes the last.
  const sequence = typeof state.calendarInviteSequence === 'number' ? state.calendarInviteSequence + 1 : 0;
  // Kept from the first send, so every later one replaces that calendar entry.
  const uid = typeof state.calendarInviteUid === 'string' ? state.calendarInviteUid : `talk-${talkId}-${speakerId}@app.gdgsydney.com`;
  const organiserEmail = process.env.RESEND_FROM_EMAIL || 'hello@gdgsydney.com';

  const details = {
    kind,
    uid,
    speakerName: String(speaker.name ?? ''),
    speakerEmail,
    talkTitle: cancelTitle,
    roomName: roomName(slot.room, event),
    startTime: slot.startTime,
    endTime: slot.endTime,
    sequence,
    organiserEmail,
    eventName: event.name,
    venueAddress: formatVenueAddress(event),
    timeZone: event.timeZone,
    scheduleUrl: eventScheduleUrl(event),
    previousStartTime: kind === 'update' ? sentSlot?.startTime : undefined,
  };

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: `GDG Sydney <${organiserEmail}>`,
      to: speakerEmail,
      replyTo: 'hello@gdgsydney.com',
      subject: calendarInviteEmailSubject(details),
      html: buildCalendarInviteEmail(details),
      attachments: [
        {
          filename: kind === 'cancel' ? 'cancel.ics' : 'invite.ics',
          content: Buffer.from(buildSessionIcs(details), 'utf8'),
          contentType: `text/calendar; charset=utf-8; method=${kind === 'cancel' ? 'CANCEL' : 'REQUEST'}`,
        },
      ],
    });
    if (error) throw new Error(error.message);
  } catch (err) {
    console.error('Calendar invite failed for speaker:', speakerId, err);
    return { error: 'We couldn\'t send the calendar invite. Please try again in a moment.' };
  }

  try {
    const prefix = `speakerState.${speakerId}`;
    await talkRef.update({
      [`${prefix}.calendarInviteSentAt`]: Timestamp.now(),
      [`${prefix}.calendarInviteSentBy`]: senderEmail,
      [`${prefix}.calendarInviteSequence`]: sequence,
      [`${prefix}.calendarInviteUid`]: uid,
      [`${prefix}.calendarInviteSlot`]:
        kind === 'cancel'
          ? FieldValue.delete()
          : { startTime: slot.startTime, endTime: slot.endTime, room: slot.room, talkTitle },
    });
  } catch {
    return {
      error: 'The calendar invite was sent, but we couldn\'t record it. Refresh the page before sending again.',
      emailSent: true,
    };
  }

  revalidatePath('/admin/speakers');
  return {};
}
