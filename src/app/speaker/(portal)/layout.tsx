import type { Metadata } from 'next';
import PortalHeader from './PortalHeader';

// The speaker portal (stage 6, PM.md): signed in with an emailed link (src/lib/portalAuth.ts),
// kept apart from /admin, which uses Google sign-in and its own cookie. A route group, so this
// layout wraps the portal's pages but not /speaker/confirm or /speaker/thanks.
export const metadata: Metadata = {
  title: { default: 'Speaker portal', template: '%s | GDG Sydney speaker portal' },
  // Personal pages behind a sign-in: nothing here belongs in search results.
  robots: { index: false, follow: false },
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    // The portal-swung class is set before the first paint when the badge has already swung this visit
    // (BadgeLanyard records it), so later loads fade the badge in instead of swinging it again.
    // Set by a script rather than React, hence suppressHydrationWarning on this one element.
    <div className="bg-black-02 text-off-white min-h-screen font-sans" suppressHydrationWarning>
      <script
        dangerouslySetInnerHTML={{
          __html: "try{if(sessionStorage.getItem('portal-badge-swung'))document.currentScript.parentElement.classList.add('portal-swung')}catch(e){}",
        }}
      />
      <PortalHeader />
      {children}
    </div>
  );
}
