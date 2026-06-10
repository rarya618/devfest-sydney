import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FAQ from '@/components/FAQ';
import GdgDivider from '@/components/GdgDivider';

const tracks = [
  {
    color: 'var(--google-blue)',
    label: 'Developer Track',
    desc: 'Technical sessions for professional engineers. Agentic app development, Gemini API, Flutter, Firebase, Android, and Google Cloud.',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
      </svg>
    ),
  },
  {
    color: 'var(--google-green)',
    label: 'Builder Track',
    desc: 'For product managers, designers, and founders. AI prototyping, automation, no-code and low-code tooling.',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
      </svg>
    ),
  },
  {
    color: 'var(--google-yellow)',
    label: 'Builder Showcase',
    desc: 'Mid-afternoon 5-minute demos from attendees with live audience voting. Show the community what you\'ve built.',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
      </svg>
    ),
  },
];

export default function Home() {
  return (
    <div className="bg-[#070B14] text-white min-h-screen">
      <Navbar />

      {/* ─── HERO ─── */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 gdg-dots opacity-40" />
          <div className="absolute -top-32 -right-32 w-[520px] h-[520px] rounded-full border-[40px] border-halftone-blue/10" />
          <div className="absolute -top-16 -right-16 w-[340px] h-[340px] rounded-full border-[28px] border-halftone-red/10" />
          <div className="absolute -bottom-24 -left-24 w-[300px] h-[300px] rounded-full border-[24px] border-halftone-green/10" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-28 pb-24 w-full">
          {/* Badge */}
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-white/10 bg-white/[0.06] mb-10 animate-fade-in">
            <span className="text-sm text-white/60 tracking-wide">DevFest Sydney · 10 October 2026 · Sydney CBD</span>
          </div>

          {/* Headline */}
          <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <h1 className="text-[clamp(2.8rem,8vw,7rem)] font-bold leading-[0.95] tracking-tight">
              Build, Secure,
            </h1>
            <h1 className="text-[clamp(2.8rem,8vw,7rem)] font-bold leading-[0.95] tracking-tight gradient-text">
              Scale.
            </h1>
            <h2 className="mt-5 text-[clamp(1rem,2.2vw,1.5rem)] font-bold text-white/35 max-w-2xl leading-snug">
              Developers and Builders in the Agentic Era
            </h2>
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap gap-4 mt-10 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <Link
              href="/call-for-speakers"
              className="px-8 py-3.5 bg-google-red text-white font-bold rounded-full hover:bg-[#d63b2f] transition-all hover:scale-[1.03] active:scale-95 shadow-lg shadow-google-red/20"
            >
              Submit your talk
            </Link>
            <a
              href="#about"
              className="px-8 py-3.5 bg-white/6 text-white font-bold rounded-full border border-white/10 hover:bg-white/10 transition-all hover:scale-[1.03] active:scale-95"
            >
              About the event
            </a>
          </div>

          {/* CfS open indicator + event facts */}
          <div
            className="flex flex-wrap items-center gap-x-8 gap-y-3 mt-14 pt-10 border-t border-white/6 animate-slide-up text-sm font-mono"
            style={{ animationDelay: '0.4s' }}
          >
            <div className="flex items-center gap-2 text-google-red">
              <span className="w-1.5 h-1.5 rounded-full bg-google-red animate-pulse" />
              <span>Call for Speakers open</span>
            </div>
            <span className="text-white/15">·</span>
            <span className="text-white/35">Developer Track</span>
            <span className="text-white/15">·</span>
            <span className="text-white/35">Builder Track</span>
            <span className="text-white/15">·</span>
            <span className="text-white/35">Builder Showcase</span>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#070B14] to-transparent pointer-events-none" />
      </section>

      {/* ─── ABOUT ─── */}
      <section id="about" className="py-28 px-6 bg-[#0A0F1C]">
        <div className="max-w-7xl mx-auto">
          <div className="mb-14">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-google-blue/15 text-google-blue text-xs font-bold tracking-[0.15em] uppercase">About the Event</span>
            <h2 className="text-4xl md:text-5xl font-bold mt-3 max-w-2xl leading-tight">
              Sydney&apos;s biggest Google Developer Festival
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-12 mb-16">
            <div className="space-y-4 text-white/55 leading-relaxed">
              <p>
                DevFest Sydney is an annual community-run conference organised by GDG Sydney and presented
                by Google. It brings together developers, designers, product managers, and founders for a full
                day of talks, workshops, and hands-on challenges.
              </p>
              <p>
                The 2026 edition centres on the theme <span className="text-white/80 italic">&ldquo;Build, Secure, Scale: Developers and Builders in the Agentic Era&rdquo;</span>, exploring how the role of the professional developer is evolving in a world of agentic AI.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Date', value: 'Saturday, 10 Oct 2026' },
                { label: 'Location', value: 'Sydney CBD' },
                { label: 'Format', value: 'Full-day multi-track' },
                { label: 'Organiser', value: 'GDG Sydney' },
              ].map((item) => (
                <div key={item.label} className="bg-white/[0.03] border border-white/6 rounded-xl p-5">
                  <div className="text-xs text-white/30 uppercase tracking-widest mb-1">{item.label}</div>
                  <div className="font-medium text-white/80">{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Tracks */}
          <div className="grid md:grid-cols-3 gap-5">
            {tracks.map((track) => (
              <div
                key={track.label}
                className="rounded-2xl p-6 hover:brightness-110 transition-all group overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${track.color}10 0%, transparent 60%)`,
                  border: `1px solid ${track.color}30`,
                  borderLeft: `3px solid ${track.color}`,
                }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${track.color}20`, color: track.color }}
                >
                  {track.icon}
                </div>
                <h3 className="font-bold text-white mb-2">{track.label}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{track.desc}</p>
              </div>
            ))}
          </div>

          {/* Special features */}
          <div className="mt-8 grid md:grid-cols-2 gap-5">
            {[
              {
                color: 'var(--google-red)',
                label: "Builder's Space",
                desc: "A dedicated room staffed by Google Developer Experts (GDEs) and mentors, offering hands-on support throughout the entire day.",
              },
              {
                color: 'var(--google-blue)',
                label: 'Agentathon',
                desc: "A 2-hour structured team challenge using Gemini to solve real problems, complete with a live leaderboard and prizes.",
              },
            ].map((feature) => (
              <div
                key={feature.label}
                className="rounded-2xl p-6 flex gap-5 hover:brightness-110 transition-all"
                style={{
                  background: `linear-gradient(135deg, ${feature.color}10 0%, transparent 60%)`,
                  border: `1px solid ${feature.color}30`,
                  borderLeft: `3px solid ${feature.color}`,
                }}
              >
                <div>
                  <h3 className="font-bold text-white mb-1">{feature.label}</h3>
                  <p className="text-sm text-white/50 leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="flex justify-center py-6" aria-hidden="true"><GdgDivider /></div>

      {/* ─── FAQ ─── */}
      <section id="faq" className="py-28 px-6 bg-[#0A0F1C]">
        <div className="max-w-3xl mx-auto">
          <div className="mb-14 text-center">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-google-green/15 text-google-green text-xs font-bold tracking-[0.15em] uppercase">FAQ</span>
            <h2 className="text-4xl md:text-5xl font-bold mt-3">Common questions</h2>
          </div>
          <FAQ />
        </div>
      </section>

      <div className="flex justify-center py-6" aria-hidden="true"><GdgDivider /></div>

      {/* ─── FINAL CTA ─── */}
      <section className="py-28 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold leading-tight mb-5">
            Ready to speak?
          </h2>
          <p className="text-white/45 leading-relaxed mb-10 max-w-lg mx-auto">
            The Call for Speakers is open now. We review every submission and get back to all applicants.
          </p>
          <Link
            href="/call-for-speakers"
            className="inline-flex px-10 py-4 bg-google-red text-white font-bold rounded-full hover:bg-[#d63b2f] transition-all hover:scale-[1.03] active:scale-95 shadow-xl shadow-google-red/25 text-lg"
          >
            Submit your talk
          </Link>
          <p className="text-xs text-white/25 font-mono mt-5">10 October 2026 · Sydney CBD</p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
