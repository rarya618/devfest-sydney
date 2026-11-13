import type { Metadata } from 'next';
import Link from 'next/link';
import PublicShell from '@/components/PublicShell';

// The app host's home (app.gdgsydney.com), added 2026-11-14 in place of a redirect to /admin:
// one choice between the two ways in. Speakers sign in with an emailed link at /speaker,
// organisers with Google at /admin. Each destination sends a signed-out visitor to its own
// sign-in, and a signed-in one straight through.

export const metadata: Metadata = {
  title: { absolute: 'Sign in — GDG Sydney' },
  // A door into signed-in areas, not content: kept out of search like every page but /privacy.
  robots: { index: false, follow: false },
};

const DOORS = [
  {
    href: '/speaker',
    title: 'Speakers',
    description: 'See your talks and proposals, keep your speaker profile up to date, and propose a talk.',
    howToSignIn: 'We email you a link to sign in.',
    action: 'Speaker sign-in',
    ariaLabel: 'Sign in as a speaker',
  },
  {
    href: '/admin',
    title: 'Organisers',
    description: 'Run events: proposals, speakers, volunteers and the schedule.',
    howToSignIn: 'Sign in with your Google account.',
    action: 'Organiser sign-in',
    ariaLabel: 'Sign in as an organiser',
  },
] as const;

export default function LandingPage() {
  return (
    <PublicShell>
      <h1 className="text-[clamp(2.25rem,6vw,3.5rem)] font-bold leading-[1.02] tracking-[-0.02em]">Sign in to GDG Sydney.</h1>
      <p className="mt-5 max-w-xl text-white/70 leading-relaxed">Choose how you work with us.</p>

      <ul className="mt-12 grid gap-5 sm:grid-cols-2">
        {DOORS.map((door) => (
          <li key={door.href}>
            <Link
              href={door.href}
              aria-label={door.ariaLabel}
              className="group flex h-full flex-col rounded-3xl bg-white/[0.05] p-7 sm:p-8 transition-colors hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-google-blue"
            >
              <h2 className="text-2xl font-bold">{door.title}</h2>
              <p className="mt-3 text-white/70 leading-relaxed">{door.description}</p>
              <p className="mt-2 text-sm text-white/60">{door.howToSignIn}</p>
              <span className="mt-8 inline-flex self-start items-center px-6 py-2.5 rounded-full bg-google-blue-deep text-white font-bold transition-opacity group-hover:opacity-85">
                {door.action}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </PublicShell>
  );
}
