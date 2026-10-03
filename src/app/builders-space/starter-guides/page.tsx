import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { buildPageMetadata } from '@/lib/metadata';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { areTicketsOpen } from '@/lib/tickets';
import { isBuildersSpaceRevealed } from '@/lib/buildersSpace';
import { STARTER_GUIDES } from './guides';

// Rendered per request: the navbar ticket CTA follows the on-sale date (see the note in
// `src/app/page.tsx`), and like /builders-space this stays a 404 until the day.
export const dynamic = 'force-dynamic';

const title = 'Starter Guides';
const description =
  "Short, self-paced guides for trying something new in the Builder's Space at DevFest Sydney 2026.";

export const metadata: Metadata = buildPageMetadata({ title, description, path: '/builders-space/starter-guides' });

// Cards take the brand colours in turn. Full class names so Tailwind generates them.
const CARD_BORDERS = ['border-t-google-green', 'border-t-google-blue', 'border-t-google-yellow', 'border-t-google-red'];

export default function StarterGuides() {
  if (!isBuildersSpaceRevealed()) notFound();

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
            Official starter guides for trying something new. Pick one, open your laptop and
            work through it at your own pace.
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
          // Centred wrapping row rather than a grid, so one or two guides don't sit off to the left.
          <ul className="max-w-5xl mx-auto flex flex-wrap justify-center gap-6">
            {STARTER_GUIDES.map((guide, guideIndex) => (
                <li key={guide.href} className="w-full sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)]">
                  <a
                    href={guide.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Open ${guide.title} (opens in a new tab)`}
                    className={`group flex h-full flex-col gap-3 rounded-lg border-t-4 ${CARD_BORDERS[guideIndex % CARD_BORDERS.length]} bg-surface px-6 pt-9 pb-6 transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-google-blue`}
                  >
                    {guide.logo && (
                      <Image
                        src={guide.logo.url}
                        alt={guide.logo.alt}
                        width={guide.logo.width}
                        height={guide.logo.height}
                        className="mb-3 h-8 w-auto self-start object-contain"
                      />
                    )}
                    <h2 className="text-xl font-bold text-white">{guide.title}</h2>
                    <p className="flex-1 text-base text-white/75 leading-relaxed">{guide.summary}</p>
                    <span className="mt-2 text-sm font-bold text-white" aria-hidden="true">
                      Open guide <span className="inline-block transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">↗</span>
                    </span>
                  </a>
                </li>
            ))}
          </ul>
        )}
      </section>

      <Footer />
    </div>
  );
}
