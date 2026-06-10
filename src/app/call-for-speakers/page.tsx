import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CfsForm from './CfsForm';

export const dynamic = 'force-dynamic';

const isCfsOpen = process.env.CFS_OPEN === 'true';

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
          <div className="absolute inset-0 gdg-dots opacity-30" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-8
            ${isCfsOpen
              ? 'border-google-red/20 bg-google-red/8'
              : 'border-white/10 bg-white/[0.04]'}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isCfsOpen ? 'bg-google-red animate-pulse' : 'bg-white/30'}`} />
            <span className={`text-sm font-medium ${isCfsOpen ? 'text-google-red' : 'text-white/40'}`}>
              {isCfsOpen ? 'Call for Speakers: Now Open' : 'Call for Speakers: Closed'}
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
            Share your story at{' '}
            <span className="gradient-text">DevFest Sydney</span>
          </h1>

          <p className="text-white/45 text-lg max-w-2xl mx-auto leading-relaxed mb-10">
            We&apos;re looking for passionate speakers across the Developer and Builder tracks. Whether you&apos;re an engineer,
            designer, PM, or founder. If you have something worth sharing, we want to hear from you.
          </p>

          {isCfsOpen && (
            <a
              href="#apply"
              className="inline-flex px-10 py-4 bg-google-red text-white font-bold rounded-full hover:bg-[#d63b2f] transition-all hover:scale-[1.03] active:scale-95 shadow-lg shadow-google-red/20 text-lg"
            >
              Submit your talk
            </a>
          )}

          <p className="text-white/25 text-sm mt-5">
            10 October 2026 · Sydney CBD · DevFest Sydney
          </p>
        </div>
      </section>

      {/* Topics */}
      <section className="py-20 px-6 bg-[#0A0F1C]">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12 text-center">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-google-blue/15 text-google-blue text-xs font-bold tracking-[0.15em] uppercase">Topic Ideas</span>
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

      {/* Form or Closed State */}
      <section id="apply" className="py-20 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="mb-10 text-center">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-google-red/15 text-google-red text-xs font-bold tracking-[0.15em] uppercase">Apply</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-3">Submit your proposal</h2>
          </div>

          {isCfsOpen ? (
            <CfsForm />
          ) : (
            <div className="bg-white/[0.03] border border-white/6 rounded-2xl p-12 text-center">
              <div className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center mx-auto mb-5">
                <svg className="w-6 h-6 text-white/25" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white/60 mb-3">Applications are now closed</h3>
              <p className="text-sm text-white/35 leading-relaxed max-w-sm mx-auto">
                The Call for Speakers has closed for DevFest Sydney 2026. Thank you to everyone who submitted a proposal. We&apos;ll be in touch soon.
              </p>
              <a
                href="mailto:sydney@gdg.community"
                className="inline-flex mt-6 text-sm text-white/40 hover:text-white/60 underline underline-offset-2 transition-colors"
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
