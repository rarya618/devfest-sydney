import Link from 'next/link';
import type { ReactNode } from 'react';

interface Props {
  // The board this form posts to, so the way back lands on the right tab.
  backHref: string;
  backLabel: string;
  title: string;
  children: ReactNode;
}

// The top of /jobs/post and /jobs/people/add. Shorter than the board's hero: the form is
// the page, so it should start near the fold.
export default function JobFormHero({ backHref, backLabel, title, children }: Props) {
  return (
    <section className="relative pt-36 pb-10 px-6 overflow-hidden">
      <div className="absolute inset-0 hero-atmosphere pointer-events-none" aria-hidden="true" />

      <div className="relative max-w-4xl mx-auto">
        <Link
          href={backHref}
          aria-label={backLabel}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-white/70 hover:text-white transition-colors mb-6"
        >
          <span className="material-symbols-outlined text-[18px] flex items-center justify-center" aria-hidden="true">
            arrow_back
          </span>
          {backLabel}
        </Link>

        <h1 className="text-[clamp(2.25rem,8vw,3.5rem)] font-bold leading-[1] tracking-tight text-white mb-5 animate-slide-up">
          {title}
        </h1>
        <div className="text-white/80 text-lg max-w-2xl leading-relaxed animate-slide-up" style={{ animationDelay: '0.1s' }}>
          {children}
        </div>
      </div>
    </section>
  );
}
