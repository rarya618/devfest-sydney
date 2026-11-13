'use server';

import { revalidatePath } from 'next/cache';
import { Resend } from 'resend';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAdminSession } from '@/lib/adminSession';
import { loadEvent } from '@/lib/events';
import { EMAIL_PATTERN } from '@/lib/emailPattern';
import { inviteClosedReason, isOrganiserProfile, volunteerInviteUrl, volunteerOptOutUrl } from '@/lib/volunteerInvite';
import { buildVolunteerInviteEmail, volunteerInviteEmailSubject } from '@/lib/volunteerInviteEmail';

// Emails one person from the volunteer pool an invite to crew an event, a DevFest or a general
// one (stage 4d-2, PM.md). Sent from /admin/volunteer-pool, and from /admin/crew for the
// selected DevFest. Recorded on their profile as volunteerInvites.<eventId>, so both lists
// show who has been asked. Only someone in the volunteer pool (inPool) can be invited; an organiser, or someone who has used the "stop inviting me" link, is refused. A second send is allowed, for someone who lost the
// first. `emailSent` is set on the one failure where the email did go out, so the bulk send
// can tell the admin not to retry that person.
export async function sendVolunteerInvite(profileId: string, eventId: string): Promise<{ error?: string; emailSent?: boolean }> {
  let senderEmail: string;
  try {
    ({ email: senderEmail } = await verifyAdminSession());
  } catch {
    return { error: 'Your session has expired. Please sign in again.' };
  }

  const profileRef = adminDb.collection('volunteerProfiles').doc(profileId);
  let profile: FirebaseFirestore.DocumentData;
  let event;
  try {
    const [profileSnapshot, loadedEvent, ownSignups] = await Promise.all([
      profileRef.get(),
      loadEvent(eventId),
      adminDb.collection('volunteers').where('profileId', '==', profileId).get(),
    ]);
    if (!profileSnapshot.exists) return { error: 'This volunteer\'s profile no longer exists.' };
    if (ownSignups.docs.some((signup) => signup.data().eventId === eventId)) {
      return { error: 'This person has already signed up for this event.' };
    }
    // Organisers are added to a crew directly, never invited (see organiserProfileIds).
    if (isOrganiserProfile(profileSnapshot.data()) || ownSignups.docs.some((signup) => signup.data().isOrganiser === true)) {
      return { error: 'This person is an organiser. Add them to the crew with Add organiser instead.' };
    }
    profile = profileSnapshot.data()!;
    if (profile.inPool !== true) return { error: `${profile.name ?? 'This person'} isn't in the volunteer pool. Add them there first, if they've asked to hear about events.` };
    if (profile.inviteOptOut) return { error: `${profile.name ?? 'This person'} has asked not to be invited again.` };
    event = loadedEvent;
  } catch {
    return { error: 'Could not load this volunteer. Please try again.' };
  }

  const closedReason = inviteClosedReason(event);
  if (closedReason || !event) return { error: `${closedReason ?? 'This event no longer exists.'} No invite was sent.` };
  const email = String(profile.email ?? '').trim();
  if (!EMAIL_PATTERN.test(email)) return { error: `The email address on file for ${profile.name ?? 'this volunteer'} doesn't look right.` };

  let joinUrl: string;
  let optOutUrl: string;
  try {
    joinUrl = volunteerInviteUrl(profileId, event.id);
    optOutUrl = volunteerOptOutUrl(profileId);
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
        optOutUrl,
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
  revalidatePath('/admin/volunteer-pool');
  return {};
}

// Adds someone to the volunteer pool (they said they'd like to hear about future events) or
// takes them out. Adding clears an earlier "Don't invite me again", since being added means
// they have asked to be back. Organisers are never in the pool.
export async function setVolunteerPoolMembership(profileId: string, inPool: boolean): Promise<{ error?: string }> {
  let adminEmail: string;
  try {
    ({ email: adminEmail } = await verifyAdminSession());
  } catch {
    return { error: 'Your session has expired. Please sign in again.' };
  }
  try {
    const profileRef = adminDb.collection('volunteerProfiles').doc(profileId);
    const profileSnapshot = await profileRef.get();
    if (!profileSnapshot.exists) return { error: 'This volunteer\'s profile no longer exists.' };
    if (inPool) {
      if (isOrganiserProfile(profileSnapshot.data())) return { error: 'Organisers aren\'t added to the volunteer pool.' };
      const organiserSignup = await adminDb
        .collection('volunteers')
        .where('profileId', '==', profileId)
        .where('isOrganiser', '==', true)
        .limit(1)
        .get();
      if (!organiserSignup.empty) return { error: 'Organisers aren\'t added to the volunteer pool.' };
      await profileRef.update({
        inPool: true,
        inPoolAt: Timestamp.now(),
        inPoolBy: adminEmail,
        inviteOptOut: FieldValue.delete(),
        inviteOptOutAt: FieldValue.delete(),
      });
    } else {
      await profileRef.update({ inPool: FieldValue.delete(), inPoolAt: FieldValue.delete(), inPoolBy: FieldValue.delete() });
    }
  } catch {
    return { error: inPool ? 'Could not add this person to the pool. Please try again.' : 'Could not take this person out of the pool. Please try again.' };
  }
  revalidatePath('/admin/volunteer-pool');
  revalidatePath('/admin/crew');
  return {};
}
