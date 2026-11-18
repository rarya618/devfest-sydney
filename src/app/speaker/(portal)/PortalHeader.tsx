import Image from 'next/image';
import Link from 'next/link';
import { getPortalSession } from '@/lib/portalAuth';
import { signOutOfPortal } from './actions';
import { secondaryButton } from './portalStyles';

// Same logo file the emails use (src/lib/eventCopy.ts), served by gdgsydney.com.
const GDG_LOGO_URL = 'https://gdgsydney.com/gdg-logo-dark.png';

// Rendered by the layout, so it stays on screen while the page below it loads: moving between
// portal pages swaps only the content. The badge on the dashboard is the way to the profile, so
// the header carries only the logo and Sign out. Sticky, on a slightly see-through page colour so content
// scrolling under it stays legible. Signed out (the sign-in pages), it shows just the logo.
export default async function PortalHeader() {
  // A failed read shows the signed-out header; the page itself decides what to do.
  const session = await getPortalSession().catch(() => null);
  return (
    <header className="sticky top-0 z-40 bg-black-02/90 backdrop-blur-md supports-[backdrop-filter]:bg-black-02/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-4">
        <Link
          href="/speaker"
          aria-label="GDG Sydney speaker portal, home"
          className="shrink-0 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-google-blue"
        >
          <Image src={GDG_LOGO_URL} alt="" width={1700} height={215} priority className="h-6 sm:h-8 w-auto" />
        </Link>
        {session && (
          <div className="flex items-center">
            <form action={signOutOfPortal}>
              <button type="submit" aria-label={`Sign out of the speaker portal (${session.email})`} className={secondaryButton}>
                Sign out
              </button>
            </form>
          </div>
        )}
      </div>
    </header>
  );
}
