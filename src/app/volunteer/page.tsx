import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import VolunteerForm from './VolunteerForm';

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

export default function Volunteer() {
  return (
    <div className="bg-off-white text-black-02 min-h-screen">
      <Navbar light />

      {/* Hero */}
      <section className={`relative pb-24 px-6 overflow-hidden ${isVolunteerOpen ? 'pt-40' : 'pt-36'}`}>
        <div className="absolute inset-0 hero-atmosphere pointer-events-none" aria-hidden="true" />

        <div className="relative max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Help bring
            <br />
            <span className="text-google-green">DevFest Sydney</span> to life
          </h1>

          <p className="text-black-02/55 text-lg max-w-2xl mx-auto leading-relaxed mb-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            DevFest Sydney runs on volunteers. We&apos;d love your help for the full day
            with registration, AV, speaker support, and more.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1.5 mb-10 text-sm text-black-02/45 animate-slide-up" style={{ animationDelay: '0.25s' }}>
            <span>Free attendance for volunteers</span>
            <span className="text-black-02/20" aria-hidden="true">·</span>
            <span>Full-day commitment</span>
            <span className="text-black-02/20" aria-hidden="true">·</span>
            <span>Meet the GDG Sydney community</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-5">
            <a
              href="#areas"
              className="inline-flex items-center px-5 py-2.5 bg-transparent text-black-02/80 text-sm font-bold rounded-[3px] border border-black-02/15 transition-colors hover:border-black-02/30 animate-slide-up"
              style={{ animationDelay: '0.25s' }}
            >
              Learn more
            </a>
            {isVolunteerOpen && (
              <a
                href="#signup"
                className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-google-green text-white text-sm font-bold rounded-[3px] border border-google-green transition-colors hover:bg-transparent hover:text-google-green animate-slide-up"
                style={{ animationDelay: '0.3s' }}
              >
                Sign up to volunteer
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" />
                </svg>
              </a>
            )}
          </div>

          <p className="text-black-02/35 text-sm mt-5 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            No experience necessary: first-time volunteers are very welcome.
          </p>
        </div>
      </section>

      {/* Areas */}
      <section id="areas" className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12 text-center animate-slide-up">
            <p className="text-xs font-bold text-black-02/40 tracking-[0.15em] uppercase mb-3">Where you can help</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Ways to volunteer</h2>
            <p className="text-black-02/45 mt-3 text-sm max-w-lg mx-auto">
              We need volunteers across a few different areas on the day. Pick whatever suits you best.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 justify-center animate-slide-up" style={{ animationDelay: '0.1s' }}>
            {areas.map(({ label, desc }) => (
              <span
                key={label}
                title={desc}
                className="inline-flex items-center gap-2 px-4 py-2 bg-off-white border border-black-02/8 rounded-full text-sm text-black-02/70 hover:text-black-02/90 hover:border-black-02/15 transition-colors"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-google-green" aria-hidden="true" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Form or Closed State */}
      <section id="signup" className="py-20 px-6">
        <div className={isVolunteerOpen ? 'max-w-2xl mx-auto' : 'max-w-xl mx-auto'}>
          <div className="mb-10 text-center animate-slide-up">
            <p className="text-xs font-bold text-black-02/40 tracking-[0.15em] uppercase mb-3">Sign up</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Become a volunteer</h2>
            <p className="text-black-02/45 mt-3 text-sm max-w-md mx-auto">
              Have questions before signing up? Email{' '}
              <a href="mailto:hello@gdgsydney.com" className="text-black-02/60 hover:text-black-02/80 underline underline-offset-2 transition-colors">
                hello@gdgsydney.com
              </a>
              .
            </p>
          </div>

          {isVolunteerOpen ? (
            <VolunteerForm />
          ) : (
            <div className="bg-white border border-black-02/8 rounded-2xl p-12 text-center">
              <div className="w-14 h-14 rounded-full border border-black-02/15 flex items-center justify-center mx-auto mb-5">
                <svg className="w-6 h-6 text-black-02/35" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-black-02/70 mb-3">Volunteer signups are not yet open</h3>
              <p className="text-sm text-black-02/45 leading-relaxed max-w-sm mx-auto">
                We&apos;re not taking volunteer signups just yet for DevFest Sydney 2026. Check back closer to the event.
              </p>
              <a
                href="mailto:hello@gdgsydney.com"
                className="inline-flex mt-6 text-sm text-black-02/50 hover:text-black-02/70 underline underline-offset-2 transition-colors"
              >
                Contact us if you have questions
              </a>
            </div>
          )}
        </div>
      </section>

      <Footer light />
    </div>
  );
}
