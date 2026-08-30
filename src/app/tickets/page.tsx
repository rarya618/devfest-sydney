import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Reveal from '@/components/Reveal';
import TicketsLink from '@/components/TicketsLink';
import { areTicketsOpen, TICKET_INCLUSIONS, TICKET_INCLUSION_DOT } from '@/lib/tickets';

// Same reason as `/`: the on-sale flip has to happen without a deploy.
export const dynamic = 'force-dynamic';

const title = 'Tickets';
const description =
  'Get your ticket for DevFest Sydney 2026 on Saturday 10 October at Torrens University, Surry Hills. One ticket covers the Developer, Builder, and Workshops tracks.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/tickets' },
  openGraph: {
    title: `${title} — DevFest Sydney 2026`,
    description,
    url: '/tickets',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${title} — DevFest Sydney 2026`,
    description,
  },
};

const VENUE_ADDRESS = 'Shop 1/37 Foveaux St, Surry Hills NSW 2010';

const AUDIENCES: { title: string; description: string; color: string }[] = [
  {
    title: 'Professional developers',
    description:
      'Engineers who want a deep-tech day across the Gemini API, Flutter, Firebase, Android, and Google Cloud.',
    color: 'google-blue',
  },
  {
    title: 'Builders without a dev background',
    description:
      'Founders, product managers, and designers shipping real things with AI, automation, and low-code tooling.',
    color: 'google-green',
  },
  {
    title: 'People who learn by doing',
    description:
      'Anyone who would rather build alongside a speaker in a workshop than watch slides go by.',
    color: 'google-yellow',
  },
];

const DOT: Record<string, string> = {
  'google-blue': 'bg-google-blue',
  'google-green': 'bg-google-green',
  'google-yellow': 'bg-google-yellow',
  'google-red': 'bg-google-red',
};

export default function Tickets() {
  const ticketsOnSale = areTicketsOpen();

  return (
    <div className="bg-[#17181a] text-white min-h-screen">
      <Navbar accent="blue" areTicketsOpen={ticketsOnSale} />

      {/* Hero */}
      <section className={`relative pb-24 px-4 sm:px-6 lg:px-12 overflow-hidden ${ticketsOnSale ? 'pt-40' : 'pt-36'}`}>
        <div className="absolute inset-0 hero-atmosphere pointer-events-none" aria-hidden="true" />

        <div className="relative max-w-4xl mx-auto text-center">
          <p className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-center gap-1.5 sm:gap-2.5 text-base font-bold text-white/80 animate-fade-in">
            <span className="flex items-center gap-2.5">
              <span>Saturday, 10 October 2026</span>
              <span className="w-1.5 h-1.5 rounded-full bg-white/80 shrink-0" aria-hidden="true" />
            </span>
            <span>Torrens University, Surry Hills</span>
          </p>

          <h1
            className="text-[clamp(3rem,13vw,5rem)] md:text-[clamp(2.5rem,7vw,5rem)] font-bold leading-[0.95] tracking-tight text-white mb-6 animate-slide-up"
            style={{ animationDelay: '0.1s' }}
          >
            Tickets
          </h1>

          <p
            className="text-white/70 text-lg max-w-2xl mx-auto leading-relaxed mb-14 animate-slide-up"
            style={{ animationDelay: '0.2s' }}
          >
            {ticketsOnSale
              ? 'One ticket, one full day of talks, workshops, and building together. Move between tracks as you like.'
              : "Tickets aren't on sale just yet. We'll announce them through the GDG Sydney community first, so you'll hear about it there."}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-5">
            {ticketsOnSale ? (
              <>
                <a
                  href="#included"
                  className="inline-flex items-center px-7 py-2 bg-transparent text-white text-base font-bold rounded border border-[#555555] transition-colors hover:border-white animate-slide-up"
                  style={{ animationDelay: '0.25s' }}
                >
                  What&apos;s included
                </a>
                <TicketsLink
                  source="tickets-hero"
                  aria-label="Get tickets for DevFest Sydney 2026 on Humanitix"
                  className="inline-flex items-center gap-2.5 px-7 py-2 bg-google-blue text-white text-base font-bold rounded border border-google-blue transition-opacity hover:opacity-80 animate-slide-up"
                  style={{ animationDelay: '0.3s' }}
                >
                  Get tickets
                </TicketsLink>
              </>
            ) : (
              <>
                <Link
                  href="/#tracks"
                  className="inline-flex items-center px-7 py-2 bg-transparent text-white text-base font-bold rounded border border-[#555555] transition-colors hover:border-white animate-slide-up"
                  style={{ animationDelay: '0.25s' }}
                >
                  See the tracks
                </Link>
                <a
                  href="https://gdg.community.dev/gdg-sydney/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 px-7 py-2 bg-google-blue text-white text-base font-bold rounded border border-google-blue transition-opacity hover:opacity-80 animate-slide-up"
                  style={{ animationDelay: '0.3s' }}
                  aria-label="Join the GDG Sydney community page to hear when tickets go on sale"
                >
                  Get notified
                </a>
              </>
            )}
          </div>
        </div>
      </section>

      {/* What's included */}
      <section id="included" className="pb-24 px-4 sm:px-6 lg:px-12">
        <div className="max-w-5xl mx-auto">
          <Reveal className="mb-14 text-center">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">What your ticket gets you</h2>
          </Reveal>

          <div className="grid sm:grid-cols-2 gap-8">
            {TICKET_INCLUSIONS.map((inclusion, i) => (
              <Reveal
                key={inclusion.title}
                delay={i * 0.1}
                className="card-hover-lift bg-white/[0.045] rounded-2xl p-6 md:p-7"
              >
                <span className="inline-flex items-center gap-3 text-lg font-bold text-white mb-3">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${TICKET_INCLUSION_DOT[inclusion.color]}`}
                    aria-hidden="true"
                  />
                  {inclusion.title}
                </span>
                <p className="text-white/55 leading-relaxed">{inclusion.description}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="pb-24 px-4 sm:px-6 lg:px-12">
        <div className="max-w-5xl mx-auto">
          <Reveal className="mb-14 text-center">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Who it&apos;s for</h2>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-8">
            {AUDIENCES.map((audience, i) => (
              <Reveal
                key={audience.title}
                delay={i * 0.1}
                className="card-hover-lift bg-white/[0.045] rounded-2xl p-6 md:p-7"
              >
                <span className="inline-flex items-center gap-3 text-lg font-bold text-white mb-3">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${DOT[audience.color]}`} aria-hidden="true" />
                  {audience.title}
                </span>
                <p className="text-white/55 leading-relaxed">{audience.description}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Practicalities */}
      <section className="pb-24 px-4 sm:px-6 lg:px-12">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="rounded-xl border-l-[8px] border-google-blue bg-white/[0.035] p-8 md:p-10">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-6">Before you book</h2>
              <dl className="grid sm:grid-cols-2 gap-x-10 gap-y-7 mb-10">
                <div>
                  <dt className="font-mono text-sm uppercase tracking-wide text-white/45 mb-1.5">When</dt>
                  <dd className="text-lg font-bold text-white">Saturday, 10 October 2026</dd>
                </div>
                <div>
                  <dt className="font-mono text-sm uppercase tracking-wide text-white/45 mb-1.5">Where</dt>
                  <dd className="text-lg font-bold text-white">Torrens University, Surry Hills</dd>
                  <dd className="text-white/55 leading-relaxed">{VENUE_ADDRESS}</dd>
                </div>
                <div>
                  <dt className="font-mono text-sm uppercase tracking-wide text-white/45 mb-1.5">Ticketing</dt>
                  <dd className="text-white/70 leading-relaxed">
                    Handled by Humanitix. Your payment details go to them, never to us.
                  </dd>
                </div>
                <div>
                  <dt className="font-mono text-sm uppercase tracking-wide text-white/45 mb-1.5">Conduct</dt>
                  <dd className="text-white/70 leading-relaxed">
                    Everyone attending agrees to our{' '}
                    <Link href="/conduct" className="text-white underline underline-offset-2 hover:text-white/70 transition-colors">
                      Code of Conduct
                    </Link>
                    .
                  </dd>
                </div>
              </dl>

              <div className="flex flex-wrap items-center gap-5">
                {ticketsOnSale && (
                  <TicketsLink
                    source="tickets-footer"
                    aria-label="Get tickets for DevFest Sydney 2026 on Humanitix"
                    className="inline-flex items-center gap-2.5 px-7 py-2 bg-google-blue text-white text-base font-bold rounded border border-google-blue transition-opacity hover:opacity-80"
                  >
                    Get tickets
                  </TicketsLink>
                )}
                <Link
                  href="/faq"
                  className="inline-flex items-center px-7 py-2 bg-transparent text-white text-base font-bold rounded border border-[#555555] transition-colors hover:border-white"
                >
                  Read the FAQ
                </Link>
              </div>

              <p className="mt-8 text-white/55 leading-relaxed">
                Something not covered here? Email us at{' '}
                <a
                  href="mailto:hello@gdgsydney.com"
                  className="text-white underline underline-offset-2 hover:text-white/70 transition-colors"
                >
                  hello@gdgsydney.com
                </a>
                .
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}
