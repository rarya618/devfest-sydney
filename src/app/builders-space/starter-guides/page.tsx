import type { Metadata } from 'next';
import Link from 'next/link';
import { buildPageMetadata } from '@/lib/metadata';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { areTicketsOpen } from '@/lib/tickets';
import { STARTER_GUIDES, STARTER_GUIDES_LAST_CHECKED, formatStarterGuidesCheckedDate } from './guides';
import StarterGuidesBrowser from './StarterGuidesBrowser';

// Rendered per request: the navbar ticket CTA follows the on-sale date (see the note in
// `src/app/page.tsx`). Live, but like /builders-space not promoted until the day.
export const dynamic = 'force-dynamic';

const title = 'Starter Guides';
const description =
  "Short, self-paced guides for trying something new in the Builder's Space at DevFest Sydney 2026.";

export const metadata: Metadata = buildPageMetadata({ title, description, path: '/builders-space/starter-guides' });

export default function StarterGuides() {
  return (
    <div className="bg-[#010103] text-white min-h-screen">
      <Navbar accent="green" areTicketsOpen={areTicketsOpen()} />

      <section className="relative pt-36 pb-12 px-6 overflow-hidden">
        <div className="relative max-w-4xl mx-auto text-center">
          <p className="mb-4 font-mono text-base text-white/80 animate-fade-in">
            <Link href="/builders-space" className="hover:text-white underline underline-offset-2 transition-colors">
              Builder&apos;s Space
            </Link>
          </p>

          <h1 className="text-[clamp(2.5rem,10vw,4rem)] md:text-[clamp(2.25rem,5.5vw,4rem)] font-bold leading-[0.95] tracking-tight text-white mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Starter Guides
          </h1>

          <p className="text-white/70 text-lg max-w-2xl mx-auto leading-relaxed animate-slide-up" style={{ animationDelay: '0.2s' }}>
            Handpicked starter guides for trying something new. Pick one, open your laptop and
            work through it at your own pace.
          </p>

          <p className="mt-6 font-mono text-sm text-white/55 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            All links checked {formatStarterGuidesCheckedDate(STARTER_GUIDES_LAST_CHECKED)}
          </p>
        </div>
      </section>

      <section className="pt-4 pb-28 px-6">
        {STARTER_GUIDES.length === 0 ? (
          <div className="max-w-xl mx-auto bg-white/[0.025] border border-white/10 rounded-2xl p-12 text-center">
            <h2 className="text-lg font-bold text-white/70 mb-3">The guides are on their way</h2>
            <p className="text-sm text-white/55 leading-relaxed">
              Check back soon. In the meantime, the Builder&apos;s Space is open for your own project.
            </p>
          </div>
        ) : (
          <StarterGuidesBrowser />
        )}
      </section>

      <Footer />
    </div>
  );
}
