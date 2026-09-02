import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { areTicketsOpen } from '@/lib/tickets';
import { isShowcaseOpen } from '@/lib/showcase';
import { formatCloseDateTime } from '@/lib/format';
import ShowcaseForm from './ShowcaseForm';
import ShowcaseFaq, { type ShowcaseFaqItem } from './ShowcaseFaq';

// isShowcaseOpen() is evaluated per request against SHOWCASE_CLOSE_DATE, so this page
// must never be prerendered: a build-time render would freeze the form open or shut.
export const dynamic = 'force-dynamic';

const title = 'Builder Showcase';
const description = 'Enter the Builder Showcase at DevFest Sydney 2026. Five minutes on stage to demo what you built, with the room voting on the winner.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/builder-showcase' },
  openGraph: {
    title: `${title} — DevFest Sydney 2026`,
    description,
    url: '/builder-showcase',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${title} — DevFest Sydney 2026`,
    description,
  },
};

const HOW_IT_WORKS = [
  {
    title: 'Tell us what you built',
    desc: 'An app, an agent, an automation, a weekend hack. Code or no-code, finished or half-finished.',
    color: 'google-blue',
  },
  {
    title: 'We pick the lineup',
    desc: 'We review every entry and email you either way, whether or not your demo makes the cut.',
    color: 'google-green',
  },
  {
    title: 'You get five minutes',
    desc: 'Mid-afternoon, on the main stage, in front of the room. No slides required.',
    color: 'google-yellow',
  },
  {
    title: 'The room votes',
    desc: 'Every attendee votes on their favourite demo, and we crown a winner before the day is out.',
    color: 'google-red',
  },
];

// Prize tiers are not finalised yet, so each `prize` reads "To be announced" for now.
// When they are locked in, edit the strings here and nothing else needs to change.
const PRIZES = [
  {
    place: 'Winner',
    prize: 'To be announced',
    desc: 'The demo the room votes for, announced on stage before the day is out.',
    color: 'google-yellow',
  },
  {
    place: 'Runner-up',
    prize: 'To be announced',
    desc: 'Second on the night, and second to hear their name called.',
    color: 'google-blue',
  },
  {
    place: 'Every presenter',
    prize: 'To be announced',
    desc: 'Everyone who makes the lineup gets something for putting their work in front of the room.',
    color: 'google-green',
  },
];

const SHOWCASE_FAQS: ShowcaseFaqItem[] = [
  {
    q: 'Does my project need to be finished?',
    a: 'No. We take entries at any stage: a rough idea, a working prototype, or something already live and in use. Tell us which on the entry form. Rough edges are expected, and half-finished projects often make the most interesting demos.',
  },
  {
    q: 'Do I need to be a developer?',
    a: 'Not at all. The Builder Showcase is open to everyone at DevFest: engineers, product managers, designers, founders, and students. No-code and low-code projects are just as welcome as ones with a repository behind them.',
  },
  {
    q: 'How long do I get on stage?',
    a: 'Five minutes, mid-afternoon, on the main stage. Slides are optional and most people skip them: the room would rather see the thing working than a deck about it.',
  },
  {
    q: 'Can I present with someone else?',
    a: 'Yes. Add up to four co-presenters to your entry, each with their name and email, and we will introduce them alongside you and keep them in the loop about the lineup.',
  },
  {
    q: 'What if my demo needs sound or internet?',
    a: 'Tell us in the "Anything you need to demo?" field on the entry form. A screen and a mic come as standard, so flag anything beyond that, such as audio, a stable connection, or a physical device on stage, and we will work it out with you before the day.',
  },
  {
    q: 'How is the winner decided?',
    a: 'The room votes. Every attendee picks their favourite demo once the presentations are done, and we announce the winner before the day is out.',
  },
  {
    q: 'What do I win?',
    a: 'The audience-voted winner and the runner-up both take home a prize, and everyone who makes the lineup gets something for presenting. We are still finalising exactly what those prizes are and will announce them here before entries close.',
  },
  {
    q: 'When will I hear back?',
    a: 'We review every entry and email you either way once the lineup is set, whether or not your demo makes the cut.',
  },
];

// Tailwind needs the full class name in the source to generate it, so the accent can't be
// interpolated into `border-${color}`. Mirrors REASON_BORDER on /call-for-speakers.
const STEP_BORDER: Record<string, string> = {
  'google-blue': 'border-google-blue',
  'google-green': 'border-google-green',
  'google-yellow': 'border-google-yellow',
  'google-red': 'border-google-red',
};

export default async function BuilderShowcase() {
  const showcaseOpen = isShowcaseOpen();
  const closeDate = process.env.SHOWCASE_CLOSE_DATE;

  return (
    <div className="bg-[#17181a] text-white min-h-screen">
      <Navbar accent="yellow" areTicketsOpen={areTicketsOpen()} />

      {/* Hero */}
      <section className={`relative min-h-[72vh] flex items-center pb-30 px-6 overflow-hidden ${showcaseOpen ? 'pt-36' : 'pt-28'}`}>
        <div className="absolute inset-0 hero-atmosphere pointer-events-none" aria-hidden="true" />

        <div className="relative w-full max-w-4xl mx-auto text-center">
          {showcaseOpen && (
            <p className="mb-4 text-base font-bold text-white/80 animate-fade-in">
              Accepting demos{closeDate ? ` · closes ${formatCloseDateTime(closeDate)}` : ''}
            </p>
          )}

          <h1 className="text-[clamp(3rem,13vw,5rem)] md:text-[clamp(2.5rem,7vw,5rem)] font-bold leading-[0.95] tracking-tight text-white mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Builder Showcase
          </h1>

          <p className="text-white text-lg max-w-2xl mx-auto leading-relaxed mb-14 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            Five minutes on stage to demo what you built, in front of the whole room.
            No talk to write, no slides to make. Just show us the thing.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-5">
            <a
              href="#how-it-works"
              className="inline-flex items-center px-7 py-2 bg-transparent text-white text-base font-bold rounded border border-[#555555] transition-colors hover:border-white animate-slide-up"
              style={{ animationDelay: '0.25s' }}
            >
              How it works
            </a>
            {showcaseOpen && (
              <a
                href="#enter"
                className="inline-flex items-center gap-2.5 px-7 py-2 bg-google-yellow text-[#1e1e1e] text-base font-bold rounded border border-google-yellow transition-opacity hover:opacity-80 animate-slide-up"
                style={{ animationDelay: '0.3s' }}
              >
                Enter your demo
              </a>
            )}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-28 pt-4 pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight text-center mb-12 animate-slide-up">
            How it works
          </h2>

          <ol className="grid sm:grid-cols-2 gap-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            {HOW_IT_WORKS.map((item) => (
              <li
                key={item.title}
                className={`flex flex-col gap-3 bg-white/[0.035] border-l-6 ${STEP_BORDER[item.color]} rounded-lg pt-8 pb-10 px-6 md:px-8`}
              >
                <h3 className="text-xl md:text-2xl font-bold text-white">{item.title}</h3>
                <p className="text-base text-white/80 leading-relaxed">{item.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Prizes */}
      <section id="prizes" className="scroll-mt-28 pt-4 pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight text-center mb-4 animate-slide-up">
            Prizes
          </h2>
          <p className="text-white/70 text-lg text-center max-w-2xl mx-auto leading-relaxed mb-12 animate-slide-up" style={{ animationDelay: '0.05s' }}>
            The room votes, and the demos it picks go home with more than the applause.
            We are still finalising the prize pool and will announce it here before entries close.
          </p>

          <ul className="grid sm:grid-cols-3 gap-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            {PRIZES.map((tier) => (
              <li
                key={tier.place}
                className={`flex flex-col gap-3 bg-white/[0.035] border-t-6 ${STEP_BORDER[tier.color]} rounded-lg pt-8 pb-10 px-6 md:px-8`}
              >
                <p className="font-mono text-sm uppercase tracking-wider text-white/50">{tier.place}</p>
                <h3 className="text-xl md:text-2xl font-bold text-white">{tier.prize}</h3>
                <p className="text-base text-white/80 leading-relaxed">{tier.desc}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Form or Closed State */}
      <section id="enter" className="pt-4 pb-20 px-6 bg-[#17181a]">
        <div className={showcaseOpen ? 'max-w-4xl mx-auto' : 'max-w-xl mx-auto'}>
          <div className="mb-10 text-center animate-slide-up">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">Show us what you built</h2>
            <p className="text-white/70 mt-4 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              Have questions before entering? Email{' '}
              <a href="mailto:hello@gdgsydney.com" className="text-white/85 hover:text-white underline underline-offset-2 transition-colors">
                hello@gdgsydney.com
              </a>
              .
            </p>
          </div>

          {showcaseOpen ? (
            <ShowcaseForm />
          ) : (
            <div className="bg-white/[0.025] border border-white/10 rounded-2xl p-12 text-center">
              <div className="w-14 h-14 rounded-full border border-white/15 flex items-center justify-center mx-auto mb-5">
                <svg className="w-6 h-6 text-white/35" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white/70 mb-3">Builder Showcase entries are not open</h3>
              <p className="text-sm text-white/45 leading-relaxed max-w-sm mx-auto">
                We&apos;re not taking demos for the DevFest Sydney 2026 Builder Showcase right now.
                Check back closer to the event.
              </p>
              <a
                href="mailto:hello@gdgsydney.com"
                className="inline-flex mt-6 text-sm text-white/50 hover:text-white/70 underline underline-offset-2 transition-colors"
              >
                Contact us if you have questions
              </a>
            </div>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-28 pt-4 pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight text-center mb-12 animate-slide-up">
            Common questions
          </h2>
          <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <ShowcaseFaq faqs={SHOWCASE_FAQS} />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
