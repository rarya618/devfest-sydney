'use server';

import { revalidatePath } from 'next/cache';
import { Resend } from 'resend';
import { Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAdminSession } from '@/lib/adminSession';
import { getAdminDevfestId } from '@/lib/adminEvent';
import { loadEvent } from '@/lib/events';
import { EMAIL_PATTERN } from '@/lib/emailPattern';
import { inviteClosedReason, volunteerInviteUrl } from '@/lib/volunteerInvite';
import { buildVolunteerInviteEmail, volunteerInviteEmailSubject } from '@/lib/volunteerInviteEmail';

// Emails one past volunteer an invite to crew the DevFest selected in the sidebar (stage
// 4d-2, PM.md). Recorded on their profile as volunteerInvites.<eventId>, so the list on
// /admin/crew shows who has been asked. A second send is allowed, for someone who lost the
// first. `emailSent` is set on the one failure where the email did go out, so the bulk send
// can tell the admin not to retry that person.
export async function sendVolunteerInvite(profileId: string): Promise<{ error?: string; emailSent?: boolean }> {
  let senderEmail: string;
  try {
    ({ email: senderEmail } = await verifyAdminSession());
  } catch {
    return { error: 'Your session has expired. Please sign in again.' };
  }

  const eventId = await getAdminDevfestId();
  const profileRef = adminDb.collection('volunteerProfiles').doc(profileId);
  let profile: FirebaseFirestore.DocumentData;
  let event;
  try {
    const [profileSnapshot, loadedEvent, existing] = await Promise.all([
      profileRef.get(),
      loadEvent(eventId),
      adminDb.collection('volunteers').where('profileId', '==', profileId).where('eventId', '==', eventId).limit(1).get(),
    ]);
    if (!profileSnapshot.exists) return { error: 'This volunteer\'s profile no longer exists.' };
    if (!existing.empty) return { error: 'This person has already signed up for this DevFest.' };
    profile = profileSnapshot.data()!;
    event = loadedEvent;
  } catch {
    return { error: 'Could not load this volunteer. Please try again.' };
  }

  const closedReason = inviteClosedReason(event);
  if (closedReason || !event) return { error: `${closedReason ?? 'This event no longer exists.'} No invite was sent.` };
  const email = String(profile.email ?? '').trim();
  if (!EMAIL_PATTERN.test(email)) return { error: `The email address on file for ${profile.name ?? 'this volunteer'} doesn't look right.` };

  let joinUrl: string;
  try {
    joinUrl = volunteerInviteUrl(profileId, event.id);
  } catch {
    return { error: 'The volunteer link secret isn\'t configured on the server, so invites can\'t be sent yet.' };
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: `GDG Sydney <${process.env.RESEND_FROM_EMAIL}>`,
      to: email,
      replyTo: 'hello@gdgsydney.com',
      subject: volunteerInviteEmailSubject(event.name),
      html: buildVolunteerInviteEmail({
        name: String(profile.name ?? ''),
        eventName: event.name,
        eventDate: new Date(event.startAt).toLocaleDateString('en-AU', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          timeZone: event.timeZone,
        }),
        venueName: event.venue?.name ?? '',
        joinUrl,
      }),
    });
    if (error) throw new Error(error.message);
  } catch (err) {
    console.error('Volunteer invite failed for profile:', profileId, err);
    return { error: 'We couldn\'t send this invite. Please try again in a moment.' };
  }

  try {
    await profileRef.update({
      [`volunteerInvites.${event.id}`]: { sentAt: Timestamp.now(), sentBy: senderEmail },
    });
  } catch {
    return { error: 'The invite was sent, but we couldn\'t record it. Refresh before sending again.', emailSent: true };
  }

  revalidatePath('/admin/crew');
  return {};
}
