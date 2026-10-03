import type { Metadata } from 'next';
import Link from 'next/link';
import { buildPageMetadata } from '@/lib/metadata';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import TicketsLink from '@/components/TicketsLink';
import { areTicketsOpen } from '@/lib/tickets';

// Rendered per request: the navbar ticket CTA follows the on-sale date (see the note in
// `src/app/page.tsx`). Live, but not linked from the footer until isBuildersSpaceRevealed().
export const dynamic = 'force-dynamic';

const title = "Builder's Space";
const description =
  'A room at DevFest Sydney 2026 set aside for building. Bring your laptop and work on your own project, or pick up a starter guide and try something new.';

export const metadata: Metadata = buildPageMetadata({ title, description, path: '/builders-space' });

// Deliberately limited to what EVENT.md confirms: a dedicated room, open all day,
// unstaffed, with starter guides. Nothing here should read as a promise of mentors or
// help on hand. No room number, opening hours or guide topics until the organisers
// settle them.
const WHAT_ITS_FOR = [
  {
    title: 'Bring what you are building',
    desc: 'A side project, a work problem, an idea you have not started yet. Code or no-code, find a seat and get on with it.',
    color: 'google-green',
  },
  {
    title: 'Explore something new',
    desc: 'Came out of a talk wanting to give it a go? We will have starter guides for anyone exploring something new, so you can try it while it is still fresh.',
    color: 'google-blue',
  },
  {
    title: 'Team up',
    desc: 'Met someone in the queue for coffee who is building the same thing? Bring them along and pair on it.',
    color: 'google-yellow',
  },
  {
    title: 'Get your demo ready',
    desc: 'Presenting at the Builder Showcase? Use the room to get your project working before you take it on stage.',
    color: 'google-red',
  },
];

// Tailwind needs the full class name in the source to generate it, so the accent can't be
// interpolated into `border-${color}`. Mirrors STEP_BORDER on /builder-showcase.
const CARD_BORDER: Record<string, string> = {
  'google-blue': 'border-google-blue',
  'google-green': 'border-google-green',
  'google-yellow': 'border-google-yellow',
  'google-red': 'border-google-red',
};

export default function BuildersSpace() {
  const ticketsOpen = areTicketsOpen();

  return (
    <div className="bg-[#010103] text-white min-h-screen">
      <Navbar accent="green" areTicketsOpen={ticketsOpen} />

      {/* Hero */}
      <section className="relative min-h-[64vh] flex items-center pt-36 pb-24 px-6 overflow-hidden">
        <div className="absolute inset-0 hero-atmosphere pointer-events-none" aria-hidden="true" />

        <div className="relative w-full max-w-4xl mx-auto text-center">
          <p className="mb-4 font-mono text-base text-white/80 animate-fade-in">
            Open all day · Saturday 10 October
          </p>

          <h1 className="text-[clamp(2.5rem,10vw,4rem)] md:text-[clamp(2.25rem,5.5vw,4rem)] font-bold leading-[0.95] tracking-tight text-white mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Builder&apos;s Space
          </h1>

          <p className="text-white text-lg max-w-2xl mx-auto leading-relaxed mb-14 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            A room set aside for building, open all day. Bring your laptop, work on
            your own project, or pick up a starter guide and try something new.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-5">
            <Link
              href="/builders-space/starter-guides"
              className="inline-flex items-center px-7 py-2 bg-transparent text-white text-base font-bold rounded border border-white/40 transition-colors hover:border-white animate-slide-up"
              style={{ animationDelay: '0.25s' }}
            >
              Starter guides
            </Link>
            {ticketsOpen && (
              <TicketsLink
                source="builders-space-hero"
                aria-label="Get tickets for DevFest Sydney 2026 on Humanitix"
                className="inline-flex items-center gap-2.5 px-7 py-2 bg-google-green-deep text-white text-base font-bold rounded border border-google-green-deep transition-opacity hover:opacity-80 animate-slide-up"
                style={{ animationDelay: '0.3s' }}
              >
                Get tickets
              </TicketsLink>
            )}
          </div>
        </div>
      </section>

      {/* What it's for */}
      <section id="what-its-for" className="scroll-mt-28 pt-4 pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight text-center mb-12 animate-slide-up">
            What it&apos;s for
          </h2>

          <ul className="grid sm:grid-cols-2 gap-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            {WHAT_ITS_FOR.map((item) => (
              <li
                key={item.title}
                className={`flex flex-col gap-3 bg-surface border-l-6 ${CARD_BORDER[item.color]} rounded-lg pt-8 pb-10 px-6 md:px-8`}
              >
                <h3 className="text-xl md:text-2xl font-bold text-white">{item.title}</h3>
                <p className="text-base text-white/80 leading-relaxed">{item.desc}</p>
              </li>
            ))}
          </ul>

          <p className="mt-10 text-center text-white/70 text-lg">
            Want to show what you built?{' '}
            <Link href="/builder-showcase" className="text-white/85 hover:text-white underline underline-offset-2 transition-colors">
              Enter the Builder Showcase
            </Link>
            .
          </p>
        </div>
      </section>

      {/* Expectations: the room is unstaffed, so say where help is instead */}
      <section className="pt-4 pb-28 px-6">
        <div className="max-w-xl mx-auto bg-white/[0.025] border border-white/10 rounded-2xl p-10 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Need a hand?</h2>
          <p className="text-white/70 leading-relaxed">
            The Builder&apos;s Space is self-serve: there are starter guides, but no one stationed in the room. For anything
            you need on the day, find someone from the crew around the venue, or email{' '}
            <a href="mailto:hello@gdgsydney.com" className="text-white/85 hover:text-white underline underline-offset-2 transition-colors">
              hello@gdgsydney.com
            </a>
            .
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
