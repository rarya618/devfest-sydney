import Image from 'next/image';
import Link from 'next/link';
import { signOutOfPortal } from './actions';
import { secondaryButton } from './portalStyles';

interface PortalShellProps {
  // The signed-in address; omitted on the sign-in pages.
  email?: string;
  // The page's width: the dashboard needs room for two columns, forms read better narrow.
  width?: 'wide' | 'narrow';
  children: React.ReactNode;
}

// Same logo file the emails use (src/lib/eventCopy.ts), served by gdgsydney.com.
const GDG_LOGO_URL = 'https://gdgsydney.com/gdg-logo-dark.png';

export default function PortalShell({ email, width = 'wide', children }: PortalShellProps) {
  return (
    <>
      <header className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link
            href="/portal"
            aria-label="GDG Sydney speaker portal, home"
            className="flex items-center gap-3 min-w-0 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-google-blue"
          >
            <Image src={GDG_LOGO_URL} alt="" width={1700} height={215} priority className="h-6 w-auto" />
            <span className="hidden sm:block h-5 w-px bg-white/20" aria-hidden="true" />
            <span className="hidden sm:block text-sm font-bold text-white/80">Speaker portal</span>
          </Link>
          {email && (
            <div className="flex items-center gap-4 min-w-0">
              <span className="hidden md:block text-sm text-white/60 truncate">{email}</span>
              <form action={signOutOfPortal}>
                <button type="submit" aria-label={`Sign out of the speaker portal (${email})`} className={secondaryButton}>
                  Sign out
                </button>
              </form>
            </div>
          )}
        </div>
      </header>
      <main className={`mx-auto px-4 sm:px-6 py-10 sm:py-16 ${width === 'wide' ? 'max-w-6xl' : 'max-w-2xl'}`}>{children}</main>
    </>
  );
}
