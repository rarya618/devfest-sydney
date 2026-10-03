import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { buildPageMetadata } from '@/lib/metadata';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { areTicketsOpen } from '@/lib/tickets';
import { isBuildersSpaceRevealed } from '@/lib/buildersSpace';
import { findStarterGuide } from '../guides';

// Rendered per request: the navbar ticket CTA follows the on-sale date (see the note in
// `src/app/page.tsx`), and like /builders-space this stays a 404 until the day.
export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = findStarterGuide(slug);
  if (!guide) return { title: 'Starter Guides' };
  return buildPageMetadata({
    title: `${guide.title} · Starter Guides`,
    description: guide.summary,
    path: `/builders-space/starter-guides/${guide.slug}`,
  });
}

const INLINE_LINK_PATTERN = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;

// Turns [label](https://...) inside a step's text into links; everything else stays text.
function renderWithLinks(paragraph: string) {
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  for (const match of paragraph.matchAll(INLINE_LINK_PATTERN)) {
    const [fullMatch, label, href] = match;
    if (match.index > lastIndex) parts.push(paragraph.slice(lastIndex, match.index));
    parts.push(
      <a
        key={match.index}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${label} (opens in a new tab)`}
        className="text-google-blue hover:underline underline-offset-2"
      >
        {label}
      </a>
    );
    lastIndex = match.index + fullMatch.length;
  }
  if (lastIndex < paragraph.length) parts.push(paragraph.slice(lastIndex));
  return parts;
}

export default async function StarterGuidePage({ params }: PageProps) {
  if (!isBuildersSpaceRevealed()) notFound();

  const { slug } = await params;
  const guide = findStarterGuide(slug);
  if (!guide) notFound();

  const metaLine = [guide.timeNeeded, guide.audience].filter(Boolean).join(' · ');

  return (
    <div className="bg-[#010103] text-white min-h-screen">
      <Navbar accent="green" areTicketsOpen={areTicketsOpen()} />

      <article className="pt-36 pb-28 px-6">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/builders-space/starter-guides"
            className="inline-flex items-center gap-2 font-mono text-sm text-white/70 hover:text-white transition-colors mb-8"
          >
            <span aria-hidden="true">←</span> All starter guides
          </Link>

          {guide.logo && (
            <Image
              src={guide.logo.url}
              alt={guide.logo.alt}
              width={guide.logo.width}
              height={guide.logo.height}
              priority
              className="mb-6 h-10 w-auto object-contain"
            />
          )}
          <h1 className="text-[clamp(2.25rem,8vw,3.5rem)] font-bold leading-[1.05] tracking-tight text-white mb-4 animate-slide-up">
            {guide.title}
          </h1>
          {metaLine && <p className="font-mono text-sm text-white/60 mb-5">{metaLine}</p>}
          <p className="text-white/80 text-lg leading-relaxed">{guide.summary}</p>

          {guide.prerequisites && guide.prerequisites.length > 0 && (
            <div className="mt-10 bg-google-green/8 border border-google-green/20 rounded-xl p-5">
              <h2 className="text-base font-bold text-white mb-3">Before you start</h2>
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

          <ol className="mt-12 space-y-10">
            {guide.steps.map((step, stepIndex) => (
              <li key={step.title} className="flex gap-5">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/35 font-mono text-sm text-white"
                  aria-hidden="true"
                >
                  {stepIndex + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl font-bold text-white mb-2">{step.title}</h2>
                  <div className="text-white/70 leading-relaxed space-y-3">
                    {step.body.split('\n\n').map((paragraph) => (
                      <p key={paragraph}>{renderWithLinks(paragraph)}</p>
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
            <div className="mt-12 border-t border-white/10 pt-6">
              <h2 className="text-base font-bold text-white mb-3">Where to go next</h2>
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
        </div>
      </article>

      <Footer />
    </div>
  );
}
