import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/metadata';
import PublicShell from '@/components/PublicShell';
import { PrivacyPolicyMobileNav, PrivacyPolicySidebar } from './PrivacyPolicyNav';


const title = 'Privacy policy';
const description = 'How GDG Sydney collects, uses and protects your personal information.';

export const metadata: Metadata = buildPageMetadata({ title, description, path: '/privacy' });

const sections = [
  {
    slug: 'information-we-collect',
    title: 'Information we collect',
    content: `We collect the information you provide directly to us, such as when you submit a Call for Speakers proposal, sign up to volunteer, or contact us by email.

This may include your name, email address, phone number, talk or session details, social and portfolio links, speaker bio, motivations for volunteering, areas of interest, dietary requirements, and any other details you choose to share with us in a form.`,
  },
  {
    slug: 'how-we-use-it',
    title: 'How we use it',
    bullets: [
      'To review and respond to Call for Speakers submissions and volunteer sign-ups.',
      'To send confirmation and follow-up emails about your submission or signup.',
      'To plan the event, including catering and accessibility arrangements based on dietary requirements or access needs you share with us.',
      'To publish accepted speaker names, bios and talk details on our event pages, if you are accepted as a speaker.',
      'To understand how people find our site, using anonymous campaign parameters (see Cookies and tracking below).',
    ],
  },
  {
    slug: 'meetup-proposals',
    title: 'Meetup talk proposals',
    content: `Talk proposals for our monthly meetups are sent from the Speak page on gdgsydney.com, or by an AI assistant on a speaker's behalf, and are stored and reviewed here. The gdgsydney.com privacy policy (gdgsydney.com/privacy) describes what they contain.

To stop the form being used to flood someone's inbox, we keep a one-way fingerprint of the email address on each proposal for a day. We also note whether a proposal came from the Speak page or from an AI assistant, so our organisers know when they read it.`,
  },
  {
    slug: 'speaker-portal',
    title: 'Speaker portal',
    content: `Speakers can sign in to our speaker portal with a link we email them. To send it, we keep the address you sign in with for as long as the link is valid (30 minutes), and a one-way fingerprint of it for an hour so we can stop the form being used to flood someone's inbox. While you are signed in, we keep a record of your session for up to 30 days, or until you sign out.

In the portal you can see the talks and proposals filed under your email address and edit your speaker profile. You can also keep talks there to propose later: these saved talks are private to you, are not seen by our organisers until you send one as a proposal, and are deleted when you delete them. Changes to your bio, tagline, links and photo are published straight away wherever we show our speakers.`,
  },
  {
    slug: 'job-board',
    title: 'Job board',
    content: `If you post a role or a profile to the job board, an organiser reviews it before it appears. Your email address is never shown publicly: it is only used to contact you about your post.

Profiles from people looking for work are shown only with your consent, are kept out of search engines, and can be changed or removed at any time by emailing hello@gdgsydney.com. We take the job board down, and delete the profiles on it, after the event.`,
  },
  {
    slug: 'feedback',
    title: 'Event feedback',
    content: `Our post-event survey is anonymous unless you choose to give your email address, which we use only to reply to something you wrote. Answers are read by the organising team to plan future events and are never published alongside your email.`,
  },
  {
    slug: 'workshop-credits',
    title: 'Workshop credits',
    content: `If you request credits for a workshop, we keep your name, email address and the workshop you were in, and use them only to send you those credits. We delete the list once the credits have been sent.`,
  },
  {
    slug: 'speaker-gifts',
    title: 'Speaker gifts',
    content: `After the event we offer our speakers a mug and an Asana Enterprise trial. If you ask for the mug, we keep the postal address and phone number you give us and use them only to post it, sharing them with the courier or postal service that delivers it. If you ask for the trial, we share your name and work email with Asana, only with your agreement, so they can set it up; from then on Asana's own privacy policy applies to what they hold. We delete the addresses and work emails once the mugs have shipped and the list has gone to Asana.`,
  },
  {
    slug: 'third-party-services',
    title: 'Third-party services',
    content: `We use a small number of trusted third parties to run this website and event:`,
    bullets: [
      'Firebase (Google) — stores form submissions and powers admin sign-in. Governed by Google\'s Privacy Policy.',
      'Resend — sends confirmation emails on our behalf.',
      'Humanitix — handles ticketing and payment separately, on their own platform. We never see or store your payment details.',
    ],
  },
  {
    slug: 'cookies-and-tracking',
    title: 'Cookies and tracking',
    content: `We don't use advertising cookies or third-party trackers. The only cookies we set are the ones that keep you signed in to the speaker portal or our admin. When you arrive via a shared link (for example, one with a utm_source parameter), we store that campaign information in your browser's local storage for up to 30 days so we can understand which channels bring people to the site. This information is anonymous and is only ever attached to a form if you choose to submit one.`,
  },
  {
    slug: 'data-retention',
    title: 'Data retention',
    content: `We keep Call for Speakers and volunteer submissions for as long as needed to plan the current event and follow up with you, and for a reasonable period afterwards for record-keeping. If you'd like your information deleted sooner, contact us and we'll action it.`,
  },
  {
    slug: 'your-rights',
    title: 'Your rights',
    content: `You can ask us to access, correct, or delete the personal information we hold about you at any time. To do so, or if you have any other questions about how your data is handled, email us at hello@gdgsydney.com.`,
  },
];

export default function PrivacyPolicy() {
  return (
    <PublicShell>
      <p className="font-mono text-sm text-white/60">Last updated November 2026</p>
      <h1 className="mt-3 text-[clamp(2.25rem,6vw,3.5rem)] font-bold leading-[1.02] tracking-[-0.02em]">Privacy policy</h1>
      <p className="mt-5 max-w-2xl text-white/70 leading-relaxed">
        What information GDG Sydney collects through this site, how we use it, and who we share it with.
        Questions about it? Write to{' '}
        <a href="mailto:hello@gdgsydney.com" aria-label="Email hello@gdgsydney.com" className="text-google-blue-light underline hover:no-underline">
          hello@gdgsydney.com
        </a>
        .
      </p>

      <PrivacyPolicyMobileNav sections={sections} />

      <div className="mt-10 lg:mt-16 lg:flex lg:items-start lg:gap-16">
        <PrivacyPolicySidebar sections={sections} />

        <div className="max-w-2xl space-y-14">
          {sections.map((section) => (
            <section key={section.slug} id={section.slug} aria-labelledby={`${section.slug}-heading`} className="scroll-mt-20">
              <h2 id={`${section.slug}-heading`} className="text-2xl font-bold mb-4">{section.title}</h2>
              {section.content && (
                <div className="text-white/70 leading-relaxed space-y-4">
                  {section.content.split('\n\n').map((paragraph) => (
                    <p key={paragraph.slice(0, 40)}>{paragraph}</p>
                  ))}
                </div>
              )}
              {section.bullets && (
                <ul className="mt-4 space-y-2.5">
                  {section.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-3 text-white/70 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-google-blue mt-2.5 shrink-0" aria-hidden="true" />
                      {bullet}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </div>
    </PublicShell>
  );
}
