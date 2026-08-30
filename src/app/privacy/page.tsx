import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { areTicketsOpen } from '@/lib/tickets';
import { PrivacyPolicyMobileNav, PrivacyPolicySidebar } from './PrivacyPolicyNav';

// The navbar ticket CTA follows the on-sale date, so this page is rendered per request
// rather than prerendered: see the note in `src/app/page.tsx`.
export const dynamic = 'force-dynamic';

const title = 'Privacy Policy';
const description = 'How DevFest Sydney collects, uses, and protects your personal information.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/privacy' },
  openGraph: {
    title: `${title} — DevFest Sydney 2026`,
    description,
    url: '/privacy',
    type: 'website',
    images: ['/opengraph-image'],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${title} — DevFest Sydney 2026`,
    description,
    images: ['/opengraph-image'],
  },
};

const sections = [
  {
    slug: 'information-we-collect',
    title: 'Information We Collect',
    content: `We collect the information you provide directly to us, such as when you submit a Call for Speakers proposal, sign up to volunteer, or contact us by email.

This may include your name, email address, phone number, talk or session details, social and portfolio links, speaker bio, motivations for volunteering, areas of interest, dietary requirements, and any other details you choose to share with us in a form.`,
  },
  {
    slug: 'how-we-use-it',
    title: 'How We Use It',
    bullets: [
      'To review and respond to Call for Speakers submissions and volunteer sign-ups.',
      'To send confirmation and follow-up emails about your submission or signup.',
      'To plan the event, including catering and accessibility arrangements based on dietary requirements or access needs you share with us.',
      'To publish accepted speaker names, bios, and talk details on the DevFest Sydney website, if you are accepted as a speaker.',
      'To understand how people find our site, using anonymous campaign parameters (see Cookies & Tracking below).',
    ],
  },
  {
    slug: 'third-party-services',
    title: 'Third-Party Services',
    content: `We use a small number of trusted third parties to run this website and event:`,
    bullets: [
      'Firebase (Google) — stores form submissions and powers admin sign-in. Governed by Google\'s Privacy Policy.',
      'Resend — sends confirmation emails on our behalf.',
      'Humanitix — handles ticketing and payment separately, on their own platform. We never see or store your payment details.',
    ],
  },
  {
    slug: 'cookies-and-tracking',
    title: 'Cookies & Tracking',
    content: `We don't use advertising cookies or third-party trackers. When you arrive via a shared link (for example, one with a utm_source parameter), we store that campaign information in your browser's local storage for up to 30 days so we can understand which channels bring people to the site. This information is anonymous and is only ever attached to a form if you choose to submit one.`,
  },
  {
    slug: 'data-retention',
    title: 'Data Retention',
    content: `We keep Call for Speakers and volunteer submissions for as long as needed to plan the current event and follow up with you, and for a reasonable period afterwards for record-keeping. If you'd like your information deleted sooner, contact us and we'll action it.`,
  },
  {
    slug: 'your-rights',
    title: 'Your Rights',
    content: `You can ask us to access, correct, or delete the personal information we hold about you at any time. To do so, or if you have any other questions about how your data is handled, email us at hello@gdgsydney.com.`,
  },
];

export default function PrivacyPolicy() {
  return (
    <div className="bg-[#17181a] text-white min-h-screen">
      <Navbar accent="blue" areTicketsOpen={areTicketsOpen()} />

      <section className="relative pt-36 pb-10 px-6 overflow-hidden">
        <div className="relative max-w-4xl mx-auto text-center">
          <p className="mb-4 text-base font-bold text-white/80 animate-fade-in">
            Last updated August 2026
          </p>

          <h1 className="text-[clamp(3rem,13vw,5rem)] md:text-[clamp(2.5rem,7vw,5rem)] font-bold leading-[0.95] tracking-tight text-white mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Privacy Policy
          </h1>

          <p className="text-white/70 text-lg max-w-2xl mx-auto leading-relaxed animate-slide-up" style={{ animationDelay: '0.2s' }}>
            This explains what information DevFest Sydney collects, how we use it, and who we share it with.
          </p>

          <div className="mt-6 p-5 bg-google-blue/8 border border-google-blue/20 rounded-xl text-sm text-white/70 leading-relaxed text-center max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.25s' }}>
            Questions about this Privacy Policy?{' '}
            <a href="mailto:hello@gdgsydney.com" className="text-google-blue hover:underline">
              hello@gdgsydney.com
            </a>
          </div>
        </div>
      </section>

      <PrivacyPolicyMobileNav sections={sections} />

      <section className="pt-8 lg:pt-0 pb-28 px-6">
        <div className="max-w-5xl mx-auto lg:flex lg:items-start lg:gap-12 gap-y-10">
          {/* Sidebar — desktop only */}
          <PrivacyPolicySidebar sections={sections} />

          {/* Main content */}
          <div className="max-w-3xl space-y-14">
            {sections.map((section) => (
              <div key={section.slug} id={section.slug} className="scroll-mt-24">
                <h2 className="text-3xl font-bold text-white mb-4">{section.title}</h2>
                {section.content && (
                  <div className="text-white/60 leading-loose text-lg space-y-4">
                    {section.content.split('\n\n').map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                  </div>
                )}
                {section.bullets && (
                  <ul className="space-y-2 mt-4">
                    {section.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-3 text-lg text-white/60 leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-google-blue mt-2.5 flex-shrink-0" />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
