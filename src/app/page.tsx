import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FAQ from '@/components/FAQ';

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

const schedule = [
  { time: '9:00 AM', title: 'Registration & Welcome Coffee', type: 'break', track: null },
  { time: '9:30 AM', title: 'Opening Keynote', type: 'keynote', track: 'Main Stage' },
  { time: '10:30 AM', title: 'Morning Sessions', type: 'session', track: 'Developer & Builder Tracks' },
  { time: '12:30 PM', title: 'Lunch Break', type: 'break', track: null },
  { time: '1:30 PM', title: 'Afternoon Sessions', type: 'session', track: 'Developer & Builder Tracks' },
  { time: '3:00 PM', title: 'Builder Showcase', type: 'special', track: 'Main Stage' },
  { time: '4:00 PM', title: 'Agentathon', type: 'special', track: "Builder's Space" },
  { time: '5:30 PM', title: 'Closing Keynote & Prize Ceremony', type: 'keynote', track: 'Main Stage' },
  { time: '6:00 PM', title: 'Networking & Close', type: 'break', track: null },
];

const scheduleTypeColor: Record<string, string> = {
  break: 'bg-white/10 text-white/40',
  keynote: 'bg-google-blue/20 text-google-blue',
  session: 'bg-google-green/20 text-google-green',
  special: 'bg-google-yellow/20 text-google-yellow',
};

const sponsorTiers = [
  { label: 'Gold', count: 3, size: 'h-16' },
  { label: 'Silver', count: 4, size: 'h-12' },
  { label: 'Community', count: 6, size: 'h-9' },
];

const teamMembers = [
  { name: 'Coming Soon', role: 'Lead Organiser' },
  { name: 'Coming Soon', role: 'Technical Lead' },
  { name: 'Coming Soon', role: 'Community Manager' },
  { name: 'Coming Soon', role: 'Logistics' },
];

export default function Home() {
  return (
    <div className="bg-[#070B14] text-white min-h-screen">
      <Navbar />

      {/* ─── HERO ─── */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Glow orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full bg-google-blue/10 blur-[140px]" />
          <div className="absolute top-1/4 right-1/5 w-80 h-80 rounded-full bg-google-red/8 blur-[120px]" />
          <div className="absolute bottom-1/3 right-1/4 w-96 h-96 rounded-full bg-google-yellow/8 blur-[130px]" />
          <div className="absolute bottom-1/4 left-1/3 w-72 h-72 rounded-full bg-google-green/8 blur-[110px]" />
          <div className="absolute inset-0 hero-grid" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-28 pb-24 w-full">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-white/10 bg-white/5 mb-10 animate-fade-in"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-google-green animate-pulse" />
            <span className="text-sm text-white/60 tracking-wide">10 October 2026 · Sydney CBD</span>
          </div>

          {/* Headline */}
          <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <h1 className="text-[clamp(3.5rem,11vw,8.5rem)] font-bold leading-[0.9] tracking-tight">
              DevFest
            </h1>
            <h1 className="text-[clamp(3.5rem,11vw,8.5rem)] font-bold leading-[0.9] tracking-tight gradient-text">
              Sydney
            </h1>
            <h1 className="text-[clamp(3.5rem,11vw,8.5rem)] font-bold leading-[0.9] tracking-tight text-white/10 select-none">
              2026
            </h1>
          </div>

          {/* Theme */}
          <p
            className="mt-10 text-base md:text-lg text-white/45 max-w-xl leading-relaxed italic animate-slide-up"
            style={{ animationDelay: '0.2s' }}
          >
            "Build, Secure, Scale: Developers and Builders in the Agentic Era"
          </p>

          {/* CTAs */}
          <div
            className="flex flex-wrap gap-4 mt-10 animate-slide-up"
            style={{ animationDelay: '0.3s' }}
          >
            <a
              href="#register"
              className="px-8 py-3.5 bg-google-blue text-white font-medium rounded-full hover:bg-[#3b78e7] transition-all hover:scale-[1.03] active:scale-95 shadow-lg shadow-google-blue/20"
            >
              Register to Attend
            </a>
            <Link
              href="/call-for-speakers"
              className="px-8 py-3.5 bg-white/6 text-white font-medium rounded-full border border-white/10 hover:bg-white/10 transition-all hover:scale-[1.03] active:scale-95"
            >
              Submit a Talk →
            </Link>
          </div>

          {/* Stats */}
          <div
            className="flex flex-wrap gap-10 mt-16 pt-10 border-t border-white/6 animate-slide-up"
            style={{ animationDelay: '0.4s' }}
          >
            {[
              { value: '300+', label: 'Expected Attendees' },
              { value: '2,000+', label: 'GDG Community Members' },
              { value: '3', label: 'Conference Tracks' },
              { value: '8+', label: 'Hours of Content' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl font-bold">{stat.value}</div>
                <div className="text-sm text-white/35 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#070B14] to-transparent pointer-events-none" />
      </section>

      {/* ─── ABOUT ─── */}
      <section id="about" className="py-28 px-6 bg-[#0A0F1C]">
        <div className="max-w-7xl mx-auto">
          <div className="mb-14">
            <span className="text-xs font-bold text-google-blue tracking-[0.2em] uppercase">About the Event</span>
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
                The 2026 edition centres on the theme <span className="text-white/80 italic">"Build, Secure, Scale: Developers and Builders in the Agentic Era"</span> — exploring how the role of the professional developer is evolving in a world of agentic AI.
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
                className="bg-white/[0.03] border border-white/6 rounded-2xl p-6 hover:border-white/12 transition-colors group"
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${track.color}18`, color: track.color }}
                >
                  {track.icon}
                </div>
                <h3 className="font-bold text-white mb-2">{track.label}</h3>
                <p className="text-sm text-white/45 leading-relaxed">{track.desc}</p>
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
                className="bg-white/[0.03] border border-white/6 rounded-2xl p-6 flex gap-5 hover:border-white/12 transition-colors"
              >
                <div
                  className="w-2 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: feature.color }}
                />
                <div>
                  <h3 className="font-bold text-white mb-1">{feature.label}</h3>
                  <p className="text-sm text-white/45 leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SPEAKERS ─── */}
      <section id="speakers" className="py-28 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-14 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="text-xs font-bold text-google-red tracking-[0.2em] uppercase">Speakers</span>
              <h2 className="text-4xl md:text-5xl font-bold mt-3">Meet the speakers</h2>
            </div>
            <Link
              href="/call-for-speakers"
              className="self-start md:self-auto px-6 py-2.5 border border-google-red/40 text-google-red text-sm font-medium rounded-full hover:bg-google-red/10 transition-colors"
            >
              Submit your talk →
            </Link>
          </div>

          {/* Coming soon state */}
          <div className="relative rounded-2xl border border-white/6 bg-white/[0.02] overflow-hidden">
            {/* Blurred placeholder grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-px bg-white/5 opacity-30 blur-sm pointer-events-none select-none" aria-hidden>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-[#0A0F1C] p-6 flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-white/8" />
                  <div className="w-24 h-3 bg-white/8 rounded" />
                  <div className="w-16 h-2 bg-white/5 rounded" />
                </div>
              ))}
            </div>
            {/* Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#070B14]/70 backdrop-blur-sm text-center px-6 py-16">
              <div className="w-12 h-12 rounded-full border border-google-red/30 flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-google-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Speakers to be announced</h3>
              <p className="text-white/45 text-sm max-w-sm leading-relaxed">
                Speaker announcements will be made after the Call for Speakers closes. Want to be on stage? Submit your proposal.
              </p>
              <Link
                href="/call-for-speakers"
                className="mt-6 px-6 py-2.5 bg-google-red text-white text-sm font-medium rounded-full hover:bg-[#d63b2f] transition-all hover:scale-[1.03]"
              >
                Apply to Speak
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SCHEDULE ─── */}
      <section id="schedule" className="py-28 px-6 bg-[#0A0F1C]">
        <div className="max-w-7xl mx-auto">
          <div className="mb-14">
            <span className="text-xs font-bold text-google-yellow tracking-[0.2em] uppercase">Programme</span>
            <h2 className="text-4xl md:text-5xl font-bold mt-3">Schedule</h2>
            <p className="text-white/40 mt-3 text-sm">All times are AEDT (UTC+11). Full schedule published closer to the event.</p>
          </div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[4.5rem] top-0 bottom-0 w-px bg-white/6 hidden md:block" />

            <div className="space-y-2">
              {schedule.map((item, i) => (
                <div
                  key={i}
                  className="flex flex-col md:flex-row gap-4 md:gap-8 items-start md:items-center relative"
                >
                  {/* Time */}
                  <div className="md:w-16 flex-shrink-0 text-sm text-white/30 font-medium tabular-nums pt-4 md:pt-0">
                    {item.time}
                  </div>

                  {/* Dot */}
                  <div className="hidden md:block w-2 h-2 rounded-full bg-white/15 flex-shrink-0 relative z-10" />

                  {/* Card */}
                  <div
                    className={`flex-1 flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-xl px-5 py-4 border ${
                      item.type === 'break'
                        ? 'border-white/4 bg-transparent'
                        : 'border-white/6 bg-white/[0.025]'
                    }`}
                  >
                    <span className={`font-medium ${item.type === 'break' ? 'text-white/30' : 'text-white/85'}`}>
                      {item.title}
                    </span>
                    <div className="flex items-center gap-3">
                      {item.track && (
                        <span className="text-xs text-white/30 hidden md:inline">{item.track}</span>
                      )}
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${scheduleTypeColor[item.type]}`}
                      >
                        {item.type === 'break' ? 'Break' : item.type === 'keynote' ? 'Keynote' : item.type === 'session' ? 'Sessions' : 'Special'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── VENUE ─── */}
      <section id="venue" className="py-28 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-14">
            <span className="text-xs font-bold text-google-green tracking-[0.2em] uppercase">Venue</span>
            <h2 className="text-4xl md:text-5xl font-bold mt-3">Getting there</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-start">
            <div className="space-y-6">
              <div className="bg-white/[0.03] border border-white/6 rounded-2xl p-6 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-lg bg-google-green/15 text-google-green flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-bold text-white">Sydney CBD</div>
                    <div className="text-sm text-white/40 mt-1">Exact venue to be announced</div>
                  </div>
                </div>
              </div>

              {[
                { icon: '🚆', title: 'By Train', desc: 'Central Station and Town Hall are both within walking distance of the venue.' },
                { icon: '🚌', title: 'By Bus', desc: 'Multiple bus routes service the Sydney CBD area throughout the day.' },
                { icon: '🚗', title: 'By Car', desc: 'Several public car parks are available in the CBD. Check Wilson Parking for rates.' },
              ].map((option) => (
                <div key={option.title} className="flex gap-4 items-start bg-white/[0.02] border border-white/5 rounded-xl p-5">
                  <span className="text-xl">{option.icon}</span>
                  <div>
                    <div className="font-medium text-white/85 text-sm">{option.title}</div>
                    <div className="text-sm text-white/40 mt-1 leading-relaxed">{option.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Map placeholder */}
            <div className="rounded-2xl overflow-hidden border border-white/6 bg-white/[0.02] aspect-[4/3] flex flex-col items-center justify-center gap-3 text-white/20">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
              </svg>
              <span className="text-sm">Map available once venue is confirmed</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SPONSORS ─── */}
      <section id="sponsors" className="py-28 px-6 bg-[#0A0F1C]">
        <div className="max-w-7xl mx-auto">
          <div className="mb-14 text-center">
            <span className="text-xs font-bold text-google-blue tracking-[0.2em] uppercase">Our Sponsors</span>
            <h2 className="text-4xl md:text-5xl font-bold mt-3">Supported by</h2>
            <p className="text-white/35 mt-3 text-sm max-w-sm mx-auto">
              DevFest Sydney is made possible by the generous support of our sponsors.
              Interested in sponsoring?{' '}
              <a href="mailto:sydney@gdg.community" className="text-google-blue hover:underline">
                Get in touch.
              </a>
            </p>
          </div>

          <div className="space-y-10">
            {sponsorTiers.map((tier) => (
              <div key={tier.label}>
                <div className="text-xs text-white/25 uppercase tracking-widest mb-5 text-center">{tier.label}</div>
                <div className={`flex flex-wrap justify-center gap-4`}>
                  {Array.from({ length: tier.count }).map((_, i) => (
                    <div
                      key={i}
                      className={`${tier.size} w-40 bg-white/[0.025] border border-white/6 rounded-xl flex items-center justify-center hover:border-white/12 transition-colors`}
                    >
                      <span className="text-xs text-white/15">Your logo</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TEAM ─── */}
      <section id="team" className="py-28 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-14">
            <span className="text-xs font-bold text-google-red tracking-[0.2em] uppercase">The Team</span>
            <h2 className="text-4xl md:text-5xl font-bold mt-3">Organising committee</h2>
            <p className="text-white/35 mt-3 text-sm">DevFest Sydney is organised entirely by volunteers from GDG Sydney.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {teamMembers.map((member, i) => (
              <div
                key={i}
                className="bg-white/[0.02] border border-white/6 rounded-2xl p-6 flex flex-col items-center text-center hover:border-white/12 transition-colors"
              >
                <div className="w-16 h-16 rounded-full bg-white/6 mb-4 flex items-center justify-center">
                  <svg className="w-7 h-7 text-white/15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
                <div className="font-medium text-white/50 text-sm">{member.name}</div>
                <div className="text-xs text-white/25 mt-1">{member.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" className="py-28 px-6 bg-[#0A0F1C]">
        <div className="max-w-3xl mx-auto">
          <div className="mb-14 text-center">
            <span className="text-xs font-bold text-google-green tracking-[0.2em] uppercase">FAQ</span>
            <h2 className="text-4xl md:text-5xl font-bold mt-3">Common questions</h2>
          </div>
          <FAQ />
        </div>
      </section>

      {/* ─── REGISTER CTA ─── */}
      <section id="register" className="py-28 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex gap-1 mb-8">
            <span className="w-3 h-3 rounded-full bg-google-blue" />
            <span className="w-3 h-3 rounded-full bg-google-red" />
            <span className="w-3 h-3 rounded-full bg-google-yellow" />
            <span className="w-3 h-3 rounded-full bg-google-green" />
          </div>
          <h2 className="text-4xl md:text-6xl font-bold mb-5 leading-tight">
            Ready to join us?
          </h2>
          <p className="text-white/40 text-lg mb-10 max-w-md mx-auto leading-relaxed">
            Secure your spot at DevFest Sydney 2026. Tickets are available on Humanitix.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href="#"
              className="px-10 py-4 bg-google-blue text-white font-medium rounded-full hover:bg-[#3b78e7] transition-all hover:scale-[1.03] active:scale-95 shadow-lg shadow-google-blue/20 text-lg"
            >
              Register on Humanitix
            </a>
            <Link
              href="/call-for-speakers"
              className="px-10 py-4 border border-white/10 text-white/70 font-medium rounded-full hover:border-white/20 hover:text-white transition-all text-lg"
            >
              Submit a Talk
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
