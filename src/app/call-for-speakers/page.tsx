import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const formats = [
  { label: 'Talk', duration: '30 min', desc: 'A focused technical or builder session for the main track.' },
  { label: 'Workshop', duration: '60 min', desc: 'A hands-on guided session where attendees build something together.' },
  { label: 'Lightning Talk', duration: '10 min', desc: 'A short, punchy presentation on a single focused idea or demo.' },
];

const topics = [
  'Agentic app development',
  'Gemini API & AI Studio',
  'Flutter & Dart',
  'Firebase',
  'Android development',
  'Google Cloud',
  'AI prototyping',
  'Automation & no-code',
  'Product design with AI',
  'Developer productivity',
];

export default function CallForSpeakers() {
  return (
    <div className="bg-[#070B14] text-white min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-36 pb-24 px-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full bg-google-red/8 blur-[160px]" />
          <div className="absolute inset-0 hero-grid opacity-[0.025]" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-google-red/20 bg-google-red/8 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-google-red animate-pulse" />
            <span className="text-sm text-google-red font-medium">Call for Speakers — Now Open</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
            Share your story at{' '}
            <span className="gradient-text">DevFest Sydney</span>
          </h1>

          <p className="text-white/45 text-lg max-w-2xl mx-auto leading-relaxed mb-10">
            We&apos;re looking for passionate speakers across the Developer and Builder tracks. Whether you&apos;re an engineer,
            designer, PM, or founder — if you have something worth sharing, we want to hear from you.
          </p>

          <a
            href="#apply"
            className="inline-flex px-10 py-4 bg-google-red text-white font-medium rounded-full hover:bg-[#d63b2f] transition-all hover:scale-[1.03] active:scale-95 shadow-lg shadow-google-red/20 text-lg"
          >
            Submit your proposal
          </a>

          <p className="text-white/25 text-sm mt-5">
            10 October 2026 · Sydney CBD · DevFest Sydney
          </p>
        </div>
      </section>

      {/* Formats */}
      <section className="py-20 px-6 bg-[#0A0F1C]">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12 text-center">
            <span className="text-xs font-bold text-google-red tracking-[0.2em] uppercase">Talk Formats</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-3">What can you submit?</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {formats.map((format) => (
              <div
                key={format.label}
                className="bg-white/[0.03] border border-white/6 rounded-2xl p-6 hover:border-google-red/20 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-white">{format.label}</h3>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-google-red/15 text-google-red font-medium">
                    {format.duration}
                  </span>
                </div>
                <p className="text-sm text-white/45 leading-relaxed">{format.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Topics */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12 text-center">
            <span className="text-xs font-bold text-google-blue tracking-[0.2em] uppercase">Topic Ideas</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-3">What are we looking for?</h2>
            <p className="text-white/35 mt-3 text-sm max-w-lg mx-auto">
              We welcome proposals on any topic relevant to our two tracks. Here are some ideas to get you started.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 justify-center">
            {topics.map((topic) => (
              <span
                key={topic}
                className="px-4 py-2 bg-white/[0.04] border border-white/7 rounded-full text-sm text-white/60 hover:text-white/80 hover:border-white/15 transition-colors"
              >
                {topic}
              </span>
            ))}
            <span className="px-4 py-2 bg-white/[0.04] border border-white/7 rounded-full text-sm text-white/30">
              and more...
            </span>
          </div>
        </div>
      </section>

      {/* Form placeholder */}
      <section id="apply" className="py-20 px-6 bg-[#0A0F1C]">
        <div className="max-w-2xl mx-auto">
          <div className="mb-10 text-center">
            <span className="text-xs font-bold text-google-red tracking-[0.2em] uppercase">Apply</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-3">Submit your proposal</h2>
          </div>

          {/* Form coming in Milestone 3 */}
          <div className="bg-white/[0.03] border border-white/6 rounded-2xl p-10 text-center">
            <div className="w-12 h-12 rounded-full border border-google-red/25 flex items-center justify-center mx-auto mb-4">
              <svg className="w-5 h-5 text-google-red/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
            </div>
            <h3 className="font-bold text-white/70 mb-2">Submission form opening soon</h3>
            <p className="text-sm text-white/35 leading-relaxed">
              The application form will be available here shortly. In the meantime,{' '}
              <a href="mailto:sydney@gdg.community" className="text-google-red hover:underline">
                email us
              </a>{' '}
              if you have questions.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
