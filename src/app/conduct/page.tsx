import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { CodeOfConductMobileNav, CodeOfConductSidebar } from './CodeOfConductNav';

const title = 'Code of Conduct';
const description = 'DevFest Sydney is dedicated to providing a harassment-free and inclusive experience for everyone. Read our community standards.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/conduct' },
  openGraph: {
    title: `${title} — DevFest Sydney 2026`,
    description,
    url: '/conduct',
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
    slug: 'our-pledge',
    title: 'Our Pledge',
    content: `DevFest Sydney is a community event intended for collaboration and learning. We are committed to providing a harassment-free and inclusive experience for everyone, regardless of gender, gender identity and expression, age, sexual orientation, disability, physical appearance, body size, race, ethnicity, religion (or lack thereof), or technology choices.

We do not tolerate harassment of event participants in any form. Sexual language and imagery is not appropriate for any event venue, including talks, workshops, networking events, and online channels. Participants violating these rules may be sanctioned or expelled from the event at the discretion of the organisers.`,
  },
  {
    slug: 'expected-behaviour',
    title: 'Expected Behaviour',
    bullets: [
      'Be kind and considerate to fellow participants.',
      'Communicate respectfully and constructively, both in person and online.',
      'Respect differing viewpoints and experiences.',
      'Gracefully accept constructive criticism.',
      'Focus on what is best for the community.',
      'Show empathy towards other community members.',
    ],
  },
  {
    slug: 'unacceptable-behaviour',
    title: 'Unacceptable Behaviour',
    bullets: [
      'Harassment, intimidation, or discrimination in any form.',
      'Verbal abuse or offensive comments related to gender, gender identity, sexual orientation, disability, physical appearance, body size, race, or religion.',
      'Sexual images or behaviour in public spaces.',
      'Deliberate intimidation, stalking, or following.',
      'Harassing photography or recording.',
      'Sustained disruption of talks or other events.',
      'Uninvited physical contact.',
      'Unwelcome sexual attention.',
      'Advocating for, or encouraging, any of the above behaviour.',
    ],
  },
  {
    slug: 'consequences',
    title: 'Consequences',
    content: `Participants asked to stop any harassing behaviour are expected to comply immediately. If a participant engages in harassing behaviour, the event organisers retain the right to take any actions to keep the event a welcoming environment for all participants. This includes warning the offender or expulsion from the event with no refund.

Event organisers may take action to address anything designed to, or with the clear impact of, disrupting the event or making the environment hostile for any participants.`,
  },
  {
    slug: 'reporting',
    title: 'Reporting',
    content: `If you are being harassed, notice that someone else is being harassed, or have any other concerns, please contact a member of the organising team immediately. Organisers will be identifiable by their event lanyards.

You can also report incidents via email at hello@gdgsydney.com. All reports will be treated with discretion and confidentiality.

We expect participants to follow these rules at all event venues and event-related social activities.`,
  },
  {
    slug: 'credit',
    title: 'Credit',
    content: `This Code of Conduct is based on the GDG Community guidelines and draws from the Conference Code of Conduct (confcodeofconduct.com). We thank the many people who have worked to create inclusive community spaces.`,
  },
];

export default function CodeOfConduct() {
  return (
    <div className="bg-[#17181a] text-white min-h-screen">
      <Navbar accent="green" />

      <section className="relative pt-36 pb-10 px-6 overflow-hidden">
        <div className="relative max-w-4xl mx-auto text-center">
          <p className="mb-4 text-base font-bold text-white/80 animate-fade-in">
            Last updated June 2026
          </p>

          <h1 className="text-[clamp(3rem,13vw,5rem)] md:text-[clamp(2.5rem,7vw,5rem)] font-bold leading-[0.95] tracking-tight text-white mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Code of Conduct
          </h1>

          <p className="text-white/70 text-lg max-w-2xl mx-auto leading-relaxed animate-slide-up" style={{ animationDelay: '0.2s' }}>
            All attendees, speakers, sponsors, and volunteers at DevFest Sydney are required to agree to and follow this code of conduct.
          </p>

          <div className="mt-6 p-5 bg-google-green/8 border border-google-green/20 rounded-xl text-sm text-white/70 leading-relaxed text-center max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.25s' }}>
            Questions about this Code of Conduct?{' '}
            <a href="mailto:hello@gdgsydney.com" className="text-google-green hover:underline">
              hello@gdgsydney.com
            </a>
          </div>
        </div>
      </section>

      <CodeOfConductMobileNav sections={sections} />

      <section className="pt-8 lg:pt-0 pb-28 px-6">
        <div className="max-w-5xl mx-auto lg:flex lg:items-start lg:gap-12 gap-y-10">
          {/* Sidebar — desktop only */}
          <CodeOfConductSidebar sections={sections} />

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
                  <ul className="space-y-2">
                    {section.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-3 text-lg text-white/60 leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-google-green mt-2.5 flex-shrink-0" />
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
