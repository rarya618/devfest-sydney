import Link from 'next/link';
import type { ReactNode } from 'react';

type JobForm = 'hiring' | 'seeking';

const FORMS: { value: JobForm; label: string; href: string }[] = [
  { value: 'hiring', label: "I'm hiring", href: '/jobs/post' },
  { value: 'seeking', label: "I'm looking for work", href: '/jobs/people/add' },
];

interface Props {
  // Which of the two forms this page holds, for the switcher.
  activeForm: JobForm;
  // The board this form posts to, so the way back lands on the right tab.
  backHref: string;
  backLabel: string;
  title: string;
  children: ReactNode;
}

// The top of /jobs/post and /jobs/people/add. Shorter than the board's hero: the form is
// the page, so it should start near the fold. The switcher is links between the two pages,
// like the board's tabs, so each form keeps its own URL; it sits above the form, so
// switching costs at most a field or two of typing.
export default function JobFormHero({ activeForm, backHref, backLabel, title, children }: Props) {
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

        <nav aria-label="Choose a job board form" className="flex w-fit rounded-full bg-white/[0.06] p-1 mb-6 animate-fade-in">
          {FORMS.map((form) => {
            const isActive = form.value === activeForm;
            return (
              <Link
                key={form.value}
                href={form.href}
                aria-current={isActive ? 'page' : undefined}
                className={`px-4 sm:px-5 py-2 rounded-full text-sm font-bold transition-colors ${
                  isActive ? 'bg-white text-black-02' : 'text-white/70 hover:text-white'
                }`}
              >
                {form.label}
              </Link>
            );
          })}
        </nav>

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
