import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { buildPageMetadata } from '@/lib/metadata';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { SectionMobileNav, SectionSidebar } from '@/components/SectionNav';
import { areTicketsOpen } from '@/lib/tickets';
import { isBuildersSpaceRevealed } from '@/lib/buildersSpace';
import { STARTER_GUIDES, type StarterGuide } from './guides';

// Rendered per request: the navbar ticket CTA follows the on-sale date (see the note in
// `src/app/page.tsx`), and like /builders-space this stays a 404 until the day.
export const dynamic = 'force-dynamic';

const title = 'Starter Guides';
const description =
  "Short, self-paced guides for trying something new in the Builder's Space at DevFest Sydney 2026.";

export const metadata: Metadata = buildPageMetadata({ title, description, path: '/builders-space/starter-guides' });

function GuideSection({ guide }: { guide: StarterGuide }) {
  const metaLine = [guide.timeNeeded, guide.audience].filter(Boolean).join(' · ');

  return (
    <article id={guide.slug} className="scroll-mt-40 lg:scroll-mt-28">
      <h2 className="text-3xl font-bold text-white mb-2">{guide.title}</h2>
      {metaLine && <p className="font-mono text-sm text-white/60 mb-4">{metaLine}</p>}
      <p className="text-white/80 text-lg leading-relaxed">{guide.summary}</p>

      {guide.prerequisites && guide.prerequisites.length > 0 && (
        <div className="mt-8 bg-google-green/8 border border-google-green/20 rounded-xl p-5">
          <h3 className="text-base font-bold text-white mb-3">Before you start</h3>
          <ul className="space-y-2">
            {guide.prerequisites.map((prerequisite) => (
              <li key={prerequisite} className="flex items-start gap-3 text-white/70 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-google-green mt-2.5 flex-shrink-0" aria-hidden="true" />
                {prerequisite}
              </li>
            ))}
          </ul>
        </div>
      )}

      <ol className="mt-10 space-y-10">
        {guide.steps.map((step, stepIndex) => (
          <li key={step.title} className="flex gap-5">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/35 font-mono text-sm text-white"
              aria-hidden="true"
            >
              {stepIndex + 1}
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
              <div className="text-white/70 leading-relaxed space-y-3">
                {step.body.split('\n\n').map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
              {step.code && (
                <pre className="mt-4 overflow-x-auto rounded-lg border border-white/10 bg-surface p-4 font-mono text-sm leading-relaxed text-white/90">
                  <code>{step.code}</code>
                </pre>
              )}
            </div>
          </li>
        ))}
      </ol>

      {guide.nextSteps && guide.nextSteps.length > 0 && (
        <div className="mt-10 border-t border-white/10 pt-6">
          <h3 className="text-base font-bold text-white mb-3">Where to go next</h3>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {guide.nextSteps.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${link.label} (opens in a new tab)`}
                  className="text-google-blue hover:underline underline-offset-2"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}

export default function StarterGuides() {
  if (!isBuildersSpaceRevealed()) notFound();

  const sections = STARTER_GUIDES.map((guide) => ({ slug: guide.slug, title: guide.title }));

  return (
    <div className="bg-[#010103] text-white min-h-screen">
      <Navbar accent="green" areTicketsOpen={areTicketsOpen()} />

      <section className="relative pt-36 pb-10 px-6 overflow-hidden">
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
            Short, self-paced guides for trying something new. Pick one, open your laptop and
            work through it at your own pace.
          </p>
        </div>
      </section>

      {STARTER_GUIDES.length === 0 ? (
        <section className="pt-8 pb-28 px-6">
          <div className="max-w-xl mx-auto bg-white/[0.025] border border-white/10 rounded-2xl p-12 text-center">
            <h2 className="text-lg font-bold text-white/70 mb-3">The guides are on their way</h2>
            <p className="text-sm text-white/55 leading-relaxed">
              Check back soon. In the meantime, the Builder&apos;s Space is open for your own project.
            </p>
          </div>
        </section>
      ) : (
        <>
          <SectionMobileNav sections={sections} />

          <section className="pt-8 lg:pt-0 pb-28 px-6">
            <div className="max-w-5xl mx-auto lg:flex lg:items-start lg:gap-12">
              <SectionSidebar sections={sections} />

              <div className="min-w-0 max-w-3xl flex-1 space-y-20">
                {STARTER_GUIDES.map((guide) => (
                  <GuideSection key={guide.slug} guide={guide} />
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      <Footer />
    </div>
  );
}
