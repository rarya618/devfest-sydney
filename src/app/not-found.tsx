import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { areTicketsOpen } from '@/lib/tickets';
import { isCfsOpen } from '@/lib/cfs';

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false },
};

// Site-wide 404. The most likely way here is a stale speaker link after someone drops
// off the lineup, so the page points back at the speakers list as well as home.
export default function NotFound() {
  return (
    <div className="bg-[#17181a] text-white min-h-screen flex flex-col">
      <Navbar accent="blue" isCfsOpen={isCfsOpen()} cfsCloseDate={process.env.CFS_CLOSE_DATE} areTicketsOpen={areTicketsOpen()} />

      <section className="relative flex-1 flex items-center pt-36 pb-24 px-4 sm:px-6 lg:px-12 overflow-hidden">
        <div className="absolute inset-0 hero-atmosphere pointer-events-none" aria-hidden="true" />
        <div className="relative max-w-2xl mx-auto text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-white/55 mb-4 animate-fade-in">404</p>
          <h1
            className="text-[clamp(2.5rem,9vw,4.5rem)] font-bold leading-[1] tracking-tight mb-6 animate-slide-up"
            style={{ animationDelay: '0.1s' }}
          >
            That page isn&apos;t here
          </h1>
          <p className="text-white/70 text-lg leading-relaxed mb-12 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            The link may be out of date, or the page may have moved. The lineup and the rest of the event are still where they should be.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-5 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <Link
              href="/speakers"
              className="inline-flex items-center px-7 py-2 bg-transparent text-white text-base font-bold rounded border border-white/40 transition-colors hover:border-white"
            >
              See the speakers
            </Link>
            <Link
              href="/"
              className="inline-flex items-center px-7 py-2 bg-google-blue-deep text-white text-base font-bold rounded border border-google-blue-deep transition-opacity hover:opacity-80"
            >
              Back to home
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
