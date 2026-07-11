import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Code of Conduct',
  description: 'DevFest Sydney is dedicated to providing a harassment-free and inclusive experience for everyone. Read our community standards.',
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
    <div className="bg-off-white text-black-02 min-h-screen">
      <Navbar light />

      <section className="pt-36 pb-16 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center">
            <p className="text-xs font-bold text-google-green/70 tracking-[0.15em] uppercase mb-3">Community Standards</p>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4 leading-tight">
              Code of Conduct
            </h1>
            <p className="text-black-02/55 text-sm">DevFest Sydney 2026 · GDG Sydney · Last updated June 2026</p>

            <div className="mt-6 p-5 bg-google-green/8 border border-google-green/20 rounded-xl text-sm text-black-02/70 leading-relaxed text-left">
              All attendees, speakers, sponsors, and volunteers at DevFest Sydney are required to agree to and follow this code of conduct.
            </div>
          </div>

          {/* Contents — mobile only; desktop gets the sticky sidebar below */}
          <nav aria-label="Sections" className="lg:hidden mt-10 pt-8 border-t border-black-02/8 text-left">
            <p className="text-xs font-bold text-black-02/35 tracking-[0.15em] uppercase mb-4">On this page</p>
            <ol className="grid sm:grid-cols-2 gap-x-8 gap-y-2">
              {sections.map((section, i) => (
                <li key={section.slug}>
                  <a
                    href={`#${section.slug}`}
                    className="inline-flex items-baseline gap-3 text-sm text-black-02/60 hover:text-black-02 transition-colors"
                  >
                    <span className="font-mono text-xs text-black-02/30 tabular-nums">0{i + 1}</span>
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </div>
      </section>

      <section className="pb-28 px-6">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-[200px_1fr] gap-y-10 lg:gap-12">
          {/* Sidebar — desktop only */}
          <nav aria-label="Sections" className="hidden lg:block">
            <div className="sticky top-28">
              <p className="text-xs font-bold text-black-02/35 tracking-[0.15em] uppercase mb-4">On this page</p>
              <ol className="space-y-2.5">
                {sections.map((section, i) => (
                  <li key={section.slug}>
                    <a
                      href={`#${section.slug}`}
                      className="flex items-baseline gap-3 text-sm text-black-02/60 hover:text-black-02 transition-colors"
                    >
                      <span className="font-mono text-xs text-black-02/30 tabular-nums">0{i + 1}</span>
                      {section.title}
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          </nav>

          {/* Main content */}
          <div className="max-w-3xl space-y-14">
            {sections.map((section, i) => (
              <div key={section.slug} id={section.slug} className="scroll-mt-24">
                <div className="flex items-baseline gap-4 mb-4">
                  <span className="font-mono text-sm text-google-green/70 tabular-nums">0{i + 1}</span>
                  <h2 className="text-xl font-bold text-black-02">{section.title}</h2>
                </div>
                {section.content && (
                  <div className="text-black-02/60 leading-loose text-sm space-y-4 pl-8">
                    {section.content.split('\n\n').map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                  </div>
                )}
                {section.bullets && (
                  <ul className="space-y-2 pl-8">
                    {section.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-3 text-sm text-black-02/60 leading-relaxed">
                        <span className="w-1 h-1 rounded-full bg-google-green mt-2 flex-shrink-0" />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}

            <div className="pt-10 border-t border-black-02/8 text-center">
              <p className="text-black-02/45 text-sm mb-4">Questions about this Code of Conduct?</p>
              <a
                href="mailto:hello@gdgsydney.com"
                className="text-google-green text-sm hover:underline"
              >
                hello@gdgsydney.com
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer light />
    </div>
  );
}
