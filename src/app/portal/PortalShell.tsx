import Image from 'next/image';
import Link from 'next/link';
import { getInitials } from '@/lib/format';
import { loadOwnedProfiles } from '@/lib/portalData';
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

// The header's way to the profile editor: the first profile on the address (the only one, for
// nearly everyone; a shared address picks between them on the dashboard). Hidden when the
// address has no profile yet, or the read fails: the header shouldn't take the page down.
async function ProfileButton({ email }: { email: string }) {
  let profile: Awaited<ReturnType<typeof loadOwnedProfiles>>[number] | undefined;
  try {
    profile = (await loadOwnedProfiles(email))[0];
  } catch (error) {
    console.error('Portal header could not load the profile for', email, error);
  }
  if (!profile) return null;

  const firstName = profile.name.trim().split(/\s+/)[0] || profile.name;
  return (
    <Link
      href={`/portal/profile/${profile.id}`}
      aria-label={`Your profile, ${profile.name}`}
      className="inline-flex items-center gap-2.5 rounded-full border border-white/35 py-1 pl-1 pr-4 text-sm font-bold text-off-white transition-colors hover:border-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-google-blue"
    >
      {profile.photoUrl ? (
        <Image src={profile.photoUrl} alt="" width={28} height={28} className="w-7 h-7 rounded-full object-cover" />
      ) : (
        <span aria-hidden="true" className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center text-[11px] font-bold text-white/80">
          {getInitials(profile.name)}
        </span>
      )}
      <span className="max-w-[10rem] truncate">{firstName}</span>
    </Link>
  );
}

export default function PortalShell({ email, width = 'wide', children }: PortalShellProps) {
  return (
    <>
      <header>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-4">
          <Link
            href="/portal"
            aria-label="GDG Sydney speaker portal, home"
            className="shrink-0 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-google-blue"
          >
            <Image src={GDG_LOGO_URL} alt="" width={1700} height={215} priority className="h-7 sm:h-9 w-auto" />
          </Link>
          {email && (
            <div className="flex items-center gap-3">
              <ProfileButton email={email} />
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
