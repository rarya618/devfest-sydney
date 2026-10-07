import Link from 'next/link';

type JobBoardTab = 'roles' | 'people';

const TABS: { value: JobBoardTab; label: string; href: string }[] = [
  { value: 'roles', label: 'Roles', href: '/jobs' },
  { value: 'people', label: 'Open to work', href: '/jobs/people' },
];

interface Props {
  activeTab: JobBoardTab;
  // The page holding this tab's form, and what its button says.
  postHref: string;
  postLabel: string;
}

// Hero and tab bar shared by /jobs and /jobs/people. The tabs are plain links to two
// pages rather than client state, so each half has its own URL to share and both stay
// server components.
export default function JobBoardHeader({ activeTab, postHref, postLabel }: Props) {
  return (
    <section className="relative pt-36 pb-12 px-6 overflow-hidden">
      <div className="absolute inset-0 hero-atmosphere pointer-events-none" aria-hidden="true" />

      <div className="relative w-full max-w-4xl mx-auto text-center">
        <h1 className="text-[clamp(2.5rem,10vw,4rem)] md:text-[clamp(2.25rem,5.5vw,4rem)] font-bold leading-[0.95] tracking-tight text-white mb-6 animate-slide-up">
          Job board
        </h1>
        <p className="text-white text-lg max-w-2xl mx-auto leading-relaxed mb-10 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          Roles from the teams in the room at DevFest Sydney, and attendees looking for their next one.
          Every post is checked by an organiser before it appears.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-5 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <nav aria-label="Job board sections" className="inline-flex rounded-full bg-white/[0.06] p-1">
            {TABS.map((tab) => {
              const isActive = tab.value === activeTab;
              return (
                <Link
                  key={tab.value}
                  href={tab.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`px-5 py-2 rounded-full text-sm font-bold transition-colors ${
                    isActive ? 'bg-white text-black-02' : 'text-white/70 hover:text-white'
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>

          <Link
            href={postHref}
            className="inline-flex items-center px-6 py-2 bg-google-blue-deep text-white text-base font-bold rounded border border-google-blue-deep transition-opacity hover:opacity-80"
          >
            {postLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}
