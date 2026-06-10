import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const sections = [
  {
    title: 'Our Pledge',
    content: `DevFest Sydney is a community event intended for collaboration and learning. We are committed to providing a harassment-free and inclusive experience for everyone, regardless of gender, gender identity and expression, age, sexual orientation, disability, physical appearance, body size, race, ethnicity, religion (or lack thereof), or technology choices.

We do not tolerate harassment of event participants in any form. Sexual language and imagery is not appropriate for any event venue, including talks, workshops, networking events, and online channels. Participants violating these rules may be sanctioned or expelled from the event at the discretion of the organisers.`,
  },
  {
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
    title: 'Consequences',
    content: `Participants asked to stop any harassing behaviour are expected to comply immediately. If a participant engages in harassing behaviour, the event organisers retain the right to take any actions to keep the event a welcoming environment for all participants. This includes warning the offender or expulsion from the event with no refund.

Event organisers may take action to address anything designed to, or with the clear impact of, disrupting the event or making the environment hostile for any participants.`,
  },
  {
    title: 'Reporting',
    content: `If you are being harassed, notice that someone else is being harassed, or have any other concerns, please contact a member of the organising team immediately. Organisers will be identifiable by their event lanyards.

You can also report incidents via email at sydney@gdg.community. All reports will be treated with discretion and confidentiality.

We expect participants to follow these rules at all event venues and event-related social activities.`,
  },
  {
    title: 'Credit',
    content: `This Code of Conduct is based on the GDG Community guidelines and draws from the Conference Code of Conduct (confcodeofconduct.com). We thank the many people who have worked to create inclusive community spaces.`,
  },
];

export default function CodeOfConduct() {
  return (
    <div className="bg-[#070B14] text-white min-h-screen">
      <Navbar />

      <section className="pt-36 pb-16 px-6">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-white/30 hover:text-white/60 transition-colors mb-10"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to home
          </Link>

          <span className="text-xs font-bold text-google-green tracking-[0.2em] uppercase">Community Standards</span>
          <h1 className="text-5xl md:text-6xl font-bold mt-3 mb-4 leading-tight">
            Code of Conduct
          </h1>
          <p className="text-white/40 text-sm">DevFest Sydney 2026 · GDG Sydney · Last updated June 2026</p>

          <div className="mt-5 p-5 bg-google-green/8 border border-google-green/20 rounded-xl text-sm text-white/60 leading-relaxed">
            All attendees, speakers, sponsors, and volunteers at DevFest Sydney are required to agree to and follow this code of conduct.
          </div>
        </div>
      </section>

      <section className="pb-28 px-6">
        <div className="max-w-3xl mx-auto space-y-14">
          {sections.map((section) => (
            <div key={section.title}>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                <span className="w-1 h-5 rounded-full bg-google-green inline-block" />
                {section.title}
              </h2>
              {section.content && (
                <div className="text-white/50 leading-loose text-sm space-y-4 pl-4">
                  {section.content.split('\n\n').map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              )}
              {section.bullets && (
                <ul className="space-y-2 pl-4">
                  {section.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-3 text-sm text-white/50 leading-relaxed">
                      <span className="w-1 h-1 rounded-full bg-google-green mt-2 flex-shrink-0" />
                      {bullet}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}

          <div className="pt-10 border-t border-white/6 text-center">
            <p className="text-white/30 text-sm mb-4">Questions about this Code of Conduct?</p>
            <a
              href="mailto:sydney@gdg.community"
              className="text-google-green text-sm hover:underline"
            >
              sydney@gdg.community
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
