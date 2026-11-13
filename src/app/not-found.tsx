import type { Metadata } from 'next';
import Link from 'next/link';
import PublicShell from '@/components/PublicShell';

export const metadata: Metadata = {
  title: { absolute: 'Page not found — GDG Sydney' },
  robots: { index: false },
};

// Site-wide 404. Since stage 3 (PM.md) this app holds only the sign-ins and the pages behind
// them; DevFest 2026's public pages moved to gdgsydney.com. So the likely ways here are an old
// link to a page that moved, or a mistyped address: point at both places someone might want.
export default function NotFound() {
  return (
    <PublicShell>
      <p className="font-mono text-sm text-white/60">404</p>
      <h1 className="mt-3 text-[clamp(2.25rem,6vw,3.5rem)] font-bold leading-[1.02] tracking-[-0.02em]">That page isn&rsquo;t here.</h1>
      <p className="mt-5 max-w-xl text-white/70 leading-relaxed">
        The link may be out of date, or the page may have moved. Our events, including DevFest Sydney,
        are on gdgsydney.com. Speakers and organisers sign in here.
      </p>
      <div className="mt-10 flex flex-wrap gap-3">
        <a
          href="https://gdgsydney.com"
          aria-label="Go to gdgsydney.com for our events"
          className="inline-flex items-center px-6 py-2.5 rounded-full bg-google-blue-deep text-white font-bold transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-google-blue focus-visible:ring-offset-2 focus-visible:ring-offset-black-02"
        >
          Go to gdgsydney.com
        </a>
        <Link
          href="/"
          aria-label="Go to the sign-in page"
          className="inline-flex items-center px-6 py-2.5 rounded-full border border-white/35 text-off-white font-bold transition-colors hover:border-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-google-blue"
        >
          Sign in
        </Link>
      </div>
    </PublicShell>
  );
}
