import Link from 'next/link';
import { signOutOfPortal } from './actions';

interface PortalShellProps {
  // The signed-in address; omitted on the sign-in pages.
  email?: string;
  children: React.ReactNode;
}

export default function PortalShell({ email, children }: PortalShellProps) {
  return (
    <>
      <header className="border-b border-white/10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <Link href="/portal" aria-label="Speaker portal home" className="flex items-baseline gap-2 min-w-0">
            <span className="font-bold text-white">GDG Sydney</span>
            <span className="font-mono text-sm text-white/60 truncate">speaker portal</span>
          </Link>
          {email && (
            <div className="flex items-center gap-4 min-w-0">
              <span className="hidden sm:block font-mono text-sm text-white/60 truncate">{email}</span>
              <form action={signOutOfPortal}>
                <button
                  type="submit"
                  aria-label={`Sign out of the speaker portal (${email})`}
                  className="px-4 py-1.5 text-sm font-bold text-white rounded border border-white/35 transition-colors hover:border-white"
                >
                  Sign out
                </button>
              </form>
            </div>
          )}
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">{children}</main>
    </>
  );
}
