'use server';

import { revalidatePath } from 'next/cache';
import { Resend } from 'resend';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAdminSession } from '@/lib/adminSession';
import { fetchSessionTimesBySpeakerId, SCHEDULE_ROOM_LABELS } from '@/lib/schedule';
import { calendarInviteStatus } from '@/lib/calendarInvite';
import {
  buildCalendarInviteEmail,
  buildSessionIcs,
  calendarInviteEmailSubject,
  type CalendarInviteKind,
} from '@/lib/calendarInviteEmail';
import type { CalendarInviteSlot, ScheduleRoom, SpeakerSessionTime } from '@/lib/types';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://devfest.gdgsydney.com';

function roomName(room: ScheduleRoom): string {
  return room === 'all' ? 'Torrens University' : SCHEDULE_ROOM_LABELS[room].name;
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
export async function sendCalendarInvite(speakerId: string): Promise<{ error?: string; emailSent?: boolean }> {
  let senderEmail: string;
  try {
    ({ email: senderEmail } = await verifyAdminSession());
  } catch {
    return { error: 'Your session has expired. Please sign in again.' };
  }

  const speakerRef = adminDb.collection('speakers').doc(speakerId);
  let speaker: FirebaseFirestore.DocumentData;
  let submission: FirebaseFirestore.DocumentData | undefined;
  let session: SpeakerSessionTime | null;
  try {
    const speakerSnap = await speakerRef.get();
    if (!speakerSnap.exists) return { error: 'This speaker is no longer in the lineup.' };
    speaker = speakerSnap.data()!;
    if (speaker.submissionId) {
      submission = (await adminDb.collection('submissions').doc(speaker.submissionId).get()).data();
    }
    session = (await fetchSessionTimesBySpeakerId())[speakerId] ?? null;
  } catch {
    // Deliberately stops here rather than treating a failed schedule read as "not on the
    // schedule", which would send a cancellation.
    return { error: 'Could not load this speaker or the schedule. Please try again.' };
  }

  if (!submission?.speakerConfirmedAt) {
    return { error: 'This speaker hasn\'t confirmed yet, so they can\'t be sent a calendar invite.' };
  }
  const speakerEmail = String(speaker.email ?? '').trim();
  if (!EMAIL_PATTERN.test(speakerEmail)) {
    return { error: 'This speaker\'s email address doesn\'t look right. Fix it with Edit before sending.' };
  }

  const talkTitle = String(speaker.talkTitle ?? '');
  const sentSlot = (speaker.calendarInviteSlot ?? null) as CalendarInviteSlot | null;
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
  const sequence = typeof speaker.calendarInviteSequence === 'number' ? speaker.calendarInviteSequence + 1 : 0;
  const organiserEmail = process.env.RESEND_FROM_EMAIL || 'hello@gdgsydney.com';

  const details = {
    kind,
    speakerId,
    speakerName: String(speaker.name ?? ''),
    speakerEmail,
    talkTitle: cancelTitle,
    roomName: roomName(slot.room),
    startTime: slot.startTime,
    endTime: slot.endTime,
    sequence,
    organiserEmail,
    siteUrl,
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
    await speakerRef.update({
      calendarInviteSentAt: Timestamp.now(),
      calendarInviteSentBy: senderEmail,
      calendarInviteSequence: sequence,
      calendarInviteSlot:
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
