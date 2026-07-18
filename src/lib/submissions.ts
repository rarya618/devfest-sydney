import { adminDb } from '@/lib/firebase-admin';
import type { Submission } from '@/lib/types';
import type { Timestamp } from 'firebase-admin/firestore';

export async function fetchSubmissions(): Promise<Submission[]> {
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
