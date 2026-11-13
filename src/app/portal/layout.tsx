import type { Metadata } from 'next';

// The speaker portal (stage 6, PM.md): signed in with an emailed link (src/lib/portalAuth.ts),
// kept apart from /admin, which uses Google sign-in and its own cookie.
export const metadata: Metadata = {
  title: { default: 'Speaker portal', template: '%s — GDG Sydney speaker portal' },
  // Personal pages behind a sign-in: nothing here belongs in search results.
  robots: { index: false, follow: false },
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <div className="bg-black-02 text-off-white min-h-screen font-sans">{children}</div>;
}
