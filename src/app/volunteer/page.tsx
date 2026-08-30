import type { Metadata } from 'next';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { areTicketsOpen } from '@/lib/tickets';
import VolunteerForm from './VolunteerForm';
import { adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

const title = 'Volunteer';
const description = 'Sign up to volunteer at DevFest Sydney 2026. Help with registration, AV, speaker support, and more.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/volunteer' },
  openGraph: {
    title: `${title} — DevFest Sydney 2026`,
    description,
    url: '/volunteer',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${title} — DevFest Sydney 2026`,
    description,
  },
};

const isVolunteerOpen = process.env.VOLUNTEER_OPEN === 'true';

const areas: { label: string; desc: string }[] = [
  { label: 'Registration', desc: 'Welcome attendees and help check them in.' },
  { label: 'AV / Tech', desc: 'Support speakers with mics, slides, and stage tech.' },
  { label: 'Speaker support', desc: 'Look after speakers and keep sessions running on time.' },
  { label: 'Workshop facilitator', desc: 'Help run a hands-on workshop alongside the speaker.' },
  { label: 'General floater', desc: 'Jump in wherever help is needed on the day.' },
  { label: 'Setup / Pack-down', desc: 'Help set up before the day and pack down afterwards.' },
  { label: 'Photography', desc: 'Capture photos of talks, workshops, and the community on the day.' },
  { label: 'Social media', desc: 'Post live updates and highlights across our social channels.' },
  { label: 'Merch table', desc: 'Look after the merch table and hand out swag to attendees.' },
];

async function fetchVolunteerHeroImageUrl(): Promise<string | null> {
  try {
    const doc = await adminDb.collection('settings').doc('site').get();
    return (doc.data()?.volunteerHeroImageUrl as string | undefined) ?? null;
  } catch {
    return null;
  }
}

export default async function Volunteer() {
  const heroImageUrl = await fetchVolunteerHeroImageUrl();

  return (
    <div className="bg-[#17181a] text-white min-h-screen">
      <Navbar accent="red" areTicketsOpen={areTicketsOpen()} />

      {/* Hero */}
      <section className={`relative pb-30 px-6 overflow-hidden ${isVolunteerOpen ? 'pt-36' : 'pt-28'}`}>
        {heroImageUrl ? (
          <>
            <Image src={heroImageUrl} alt="" fill priority sizes="100vw" className="object-cover scale-125 sm:scale-100" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#17181a]/95 via-[#17181a]/75 to-[#17181a]/40" aria-hidden="true" />
          </>
        ) : (
          <div className="absolute inset-0 hero-atmosphere pointer-events-none" aria-hidden="true" />
        )}

        <div className="relative max-w-4xl mx-auto text-center">
          {isVolunteerOpen && (
            <p className="mb-4 text-base font-bold text-white/80 animate-fade-in">
              Accepting applications
            </p>
          )}

          <h1 className="text-[clamp(3rem,13vw,5rem)] md:text-[clamp(2.5rem,7vw,5rem)] font-bold leading-[0.95] tracking-tight text-white mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Volunteer
          </h1>

          <p className="text-white text-lg max-w-2xl mx-auto leading-relaxed mb-14 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            DevFest Sydney runs on volunteers. We&apos;d love your help for the full day
            with registration, AV, speaker support, and more.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-5">
            <a
              href="#areas"
              className="inline-flex items-center px-7 py-2 bg-transparent text-white text-base font-bold rounded border border-[#555555] transition-colors hover:border-white animate-slide-up"
              style={{ animationDelay: '0.25s' }}
            >
              Learn more
            </a>
            {isVolunteerOpen && (
              <a
                href="#signup"
                className="inline-flex items-center gap-2.5 px-7 py-2 bg-google-red text-white text-base font-bold rounded border border-google-red transition-opacity hover:opacity-80 animate-slide-up"
                style={{ animationDelay: '0.3s' }}
              >
                Sign up
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Areas marquee */}
      <section id="areas" className="pt-0 pb-0 px-6">
        <div className="relative -mx-6 overflow-hidden border-y border-[#CCCCCC] bg-white/[0.06] animate-slide-up">
          <div className="absolute inset-y-0 left-0 w-12 sm:w-24 bg-gradient-to-r from-[#17181a] to-transparent z-10 pointer-events-none" aria-hidden="true" />
          <div className="absolute inset-y-0 right-0 w-12 sm:w-24 bg-gradient-to-l from-[#17181a] to-transparent z-10 pointer-events-none" aria-hidden="true" />
          <div className="flex w-max items-center gap-10 py-4 animate-marquee hover:[animation-play-state:paused]" aria-hidden="true">
            {[...areas, ...areas].map(({ label }, i) => (
              <span key={i} className="flex items-center gap-2.5 text-base font-normal text-white whitespace-nowrap">
                <span className="w-2 h-2 rounded-full bg-google-red shrink-0" />
                {label}
              </span>
            ))}
          </div>
          <p className="sr-only">
            Areas we need help with: {areas.map(({ label }) => label).join(', ')}, and more.
          </p>
        </div>
      </section>

      {/* Form or Closed State */}
      <section id="signup" className="pt-16 pb-20 px-6 bg-[#17181a]">
        <div className={isVolunteerOpen ? 'max-w-4xl mx-auto' : 'max-w-xl mx-auto'}>
          <div className="mb-10 text-center animate-slide-up">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">Help bring DevFest Sydney to life</h2>
            <p className="text-white/70 mt-4 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              Have questions before signing up? Email{' '}
              <a href="mailto:hello@gdgsydney.com" className="text-white/85 hover:text-white underline underline-offset-2 transition-colors">
                hello@gdgsydney.com
              </a>
              .
            </p>
          </div>

          {isVolunteerOpen ? (
            <VolunteerForm />
          ) : (
            <div className="bg-white/[0.025] border border-white/10 rounded-2xl p-12 text-center">
              <div className="w-14 h-14 rounded-full border border-white/15 flex items-center justify-center mx-auto mb-5">
                <svg className="w-6 h-6 text-white/35" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white/70 mb-3">Volunteer signups are not yet open</h3>
              <p className="text-sm text-white/45 leading-relaxed max-w-sm mx-auto">
                We&apos;re not taking volunteer signups just yet for DevFest Sydney 2026. Check back closer to the event.
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

      <Footer />
    </div>
  );
}
