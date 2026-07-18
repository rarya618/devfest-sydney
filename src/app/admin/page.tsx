import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import SubmissionsDashboard from './SubmissionsDashboard';
import type { Submission } from '@/lib/types';
import type { Timestamp } from 'firebase-admin/firestore';

export const metadata = { title: 'Admin — DevFest Sydney 2026' };

interface AdminSession {
  email: string;
  name: string;
}

async function getVerifiedSession(): Promise<AdminSession> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('__session')?.value;
  if (!sessionCookie) redirect('/admin/login');

  let email: string | undefined;
  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    email = decoded.email;
  } catch {
    redirect('/admin/login');
  }
  if (!email) redirect('/admin/login');

  const adminDoc = await adminDb.collection('admins').doc(email).get();
  if (!adminDoc.exists) redirect('/admin/login');

  const name = (adminDoc.data()?.name as string | undefined) || email;

  return { email, name };
}

async function fetchSubmissions(): Promise<Submission[]> {
  const snapshot = await adminDb
    .collection('submissions')
    .orderBy('submittedAt', 'desc')
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    const timestamp = data.submittedAt as Timestamp | undefined;
    return {
      id: doc.id,
      name: data.name ?? '',
      email: data.email ?? '',
      talkTitle: data.talkTitle ?? '',
      abstract: data.abstract ?? '',
      format: data.format ?? 'talk',
      track: data.track ?? 'developer',
      experienceLevel: data.experienceLevel ?? 'beginner',
      linkedinUrl: data.linkedinUrl ?? '',
      githubUrl: data.githubUrl ?? '',
      websiteUrl: data.websiteUrl ?? '',
      speakerTagline: data.speakerTagline ?? '',
      speakerBio: data.speakerBio ?? '',
      previousTalkLink: data.previousTalkLink ?? '',
      howDidYouHear: data.howDidYouHear ?? '',
      coSpeakerEmails: data.coSpeakerEmails ?? '',
      accessibilityNeeds: data.accessibilityNeeds ?? '',
      requiresTravelSupport: data.requiresTravelSupport ?? false,
      travelSupportLocation: data.travelSupportLocation ?? '',
      isGoogleDeveloperExpert: data.isGoogleDeveloperExpert ?? false,
      isFirstTimeSpeaker: data.isFirstTimeSpeaker ?? false,
      wantsMentoring: data.wantsMentoring ?? false,
      hasSpokenAtGdgSydneyBefore: data.hasSpokenAtGdgSydneyBefore ?? false,
      isOpenToAudienceQuestions: data.isOpenToAudienceQuestions ?? false,
      optOutOfRecording: data.optOutOfRecording ?? false,
      tracking: {
        utmSource: data.tracking?.utm_source ?? '',
        utmMedium: data.tracking?.utm_medium ?? '',
        utmCampaign: data.tracking?.utm_campaign ?? '',
        utmContent: data.tracking?.utm_content ?? '',
        utmTerm: data.tracking?.utm_term ?? '',
        ref: data.tracking?.ref ?? '',
      },
      submittedAt: timestamp ? timestamp.toDate().toISOString() : new Date().toISOString(),
      status: data.status ?? 'pending',
    } satisfies Submission;
  });
}

export default async function AdminPage() {
  const admin = await getVerifiedSession();
  const submissions = await fetchSubmissions();

  return <SubmissionsDashboard submissions={submissions} adminEmail={admin.email} adminName={admin.name} />;
}
