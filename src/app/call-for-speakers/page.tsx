import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CfsForm from './CfsForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Call for Speakers',
  description: 'Submit a talk, workshop, or lightning talk for DevFest Sydney 2026. We are looking for passionate speakers across the Developer and Builder tracks.',
};

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
    <div className="bg-off-white text-black-02 min-h-screen">
      <Navbar light />

      {/* Hero */}
      <section className="relative pt-36 pb-24 px-6 overflow-hidden">
        <div className="absolute inset-0 hero-atmosphere pointer-events-none" aria-hidden="true" />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-8 animate-fade-in">
            <span className={`w-1.5 h-1.5 rounded-full ${isCfsOpen ? 'bg-google-red animate-pulse' : 'bg-black-02/30'}`} />
            <span className={`text-sm font-medium ${isCfsOpen ? 'text-google-red' : 'text-black-02/50'}`}>
              {isCfsOpen ? 'Call for speakers: now open' : 'Call for speakers: closed'}
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Share your story at
            <br />
            <span className="text-google-blue">DevFest Sydney</span>
          </h1>

          <p className="text-black-02/55 text-lg max-w-2xl mx-auto leading-relaxed mb-10 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            We&apos;re looking for passionate speakers across the Developer and Builder tracks. Whether you&apos;re an engineer,
            designer, PM, or founder. If you have something worth sharing, we want to hear from you.
          </p>

          {isCfsOpen && (
            <a
              href="#apply"
              className="inline-flex px-7 py-2 bg-google-blue text-white text-base font-semibold rounded-full shadow-[0_1px_6px_rgba(66,133,244,0.28)] hover:bg-[#3574db] hover:-translate-y-0.5 transition-all animate-slide-up"
              style={{ animationDelay: '0.3s' }}
            >
              Submit your talk
            </a>
          )}

          <p className="text-black-02/35 text-sm mt-5 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            Sydney CBD · DevFest Sydney
          </p>
        </div>
      </section>

      {/* Topics */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12 text-center animate-slide-up">
            <p className="text-xs font-bold text-black-02/40 tracking-[0.15em] uppercase mb-3">Topic Ideas</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">What are we looking for?</h2>
            <p className="text-black-02/45 mt-3 text-sm max-w-lg mx-auto">
              We welcome proposals on any topic relevant to our two tracks. Here are some ideas to get you started.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 justify-center animate-slide-up" style={{ animationDelay: '0.1s' }}>
            {topics.map((topic) => (
              <span
                key={topic}
                className="px-4 py-2 bg-white border border-black-02/8 rounded-full text-sm text-black-02/70 hover:text-black-02/90 hover:border-black-02/15 transition-colors"
              >
                {topic}
              </span>
            ))}
            <span className="px-4 py-2 bg-white border border-black-02/8 rounded-full text-sm text-black-02/40">
              and more...
            </span>
          </div>
        </div>
      </section>

      {/* Form or Closed State */}
      <section id="apply" className="py-20 px-6">
        <div className="max-w-xl mx-auto">
          <div className="mb-10 text-center animate-slide-up">
            <p className="text-xs font-bold text-black-02/40 tracking-[0.15em] uppercase mb-3">Apply</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Submit your proposal</h2>
          </div>

          {isCfsOpen ? (
            <CfsForm />
          ) : (
            <div className="bg-white border border-black-02/8 rounded-2xl p-12 text-center">
              <div className="w-14 h-14 rounded-full border border-black-02/15 flex items-center justify-center mx-auto mb-5">
                <svg className="w-6 h-6 text-black-02/35" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-black-02/70 mb-3">Applications are now closed</h3>
              <p className="text-sm text-black-02/45 leading-relaxed max-w-sm mx-auto">
                The Call for Speakers has closed for DevFest Sydney 2026. Thank you to everyone who submitted a proposal. We&apos;ll be in touch soon.
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
