'use client';

import { useState, useRef, useEffect, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getInitials } from '@/lib/format';
import Alert from '@/components/Alert';
import { MobileBarContext } from './MobileBarContext';

interface NavItem {
  href: string;
  label: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

// Grouped by what an admin is doing: working through what people sent in, managing
// what the public site shows, looking at how it is going, and running the panel itself.
const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Review',
    items: [
      { href: '/admin', label: 'Submissions' },
      { href: '/admin/volunteers', label: 'Volunteers' },
      { href: '/admin/showcase', label: 'Showcase' },
    ],
  },
  {
    label: 'Content',
    items: [{ href: '/admin/speakers', label: 'Speakers' }],
  },
  {
    label: 'Insights',
    items: [
      { href: '/admin/analytics', label: 'Analytics' },
      { href: '/admin/links', label: 'Links' },
    ],
  },
  {
    label: 'Settings',
    items: [{ href: '/admin/admins', label: 'Admins' }],
  },
];

interface Props {
  adminEmail: string;
  adminName: string;
  children: ReactNode;
}

function isActive(href: string, pathname: string): boolean {
  return href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
}

interface NavLinksProps {
  pathname: string;
  onNavigate?: () => void;
  rounded: boolean;
}

function NavLinks({ pathname, onNavigate, rounded }: NavLinksProps) {
  return (
    <nav aria-label="Admin sections" className={rounded ? 'space-y-5' : 'space-y-2'}>
      {NAV_GROUPS.map((group) => (
        <div key={group.label}>
          <p className={`font-mono text-[11px] uppercase tracking-[0.12em] text-white/50 px-4 ${rounded ? 'mb-1.5' : 'pt-1 pb-1'}`}>
            {group.label}
          </p>
          <ul className={rounded ? 'space-y-0.5' : undefined}>
            {group.items.map((item) => {
              const active = isActive(item.href, pathname);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? 'page' : undefined}
                    className={`block text-sm px-4 transition-colors ${rounded ? 'py-2 rounded-lg' : 'py-2.5'} ${
                      active
                        ? 'bg-white/10 text-white font-bold'
                        : 'text-white/55 font-medium hover:text-white hover:bg-white/[0.08]'
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

interface AccountRowProps {
  adminName: string;
  adminEmail: string;
  signingOut: boolean;
  onSignOut: () => void;
}

// Avatar, name and a sign-out button in one row. No popover: the only account action an
// admin has here is leaving, so a menu was a click in the way of it.
function AccountRow({ adminName, adminEmail, signingOut, onSignOut }: AccountRowProps) {
  return (
    <div className="flex items-center gap-3 px-3 py-2">
      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-google-blue-deep text-white text-xs font-bold shrink-0">
        {getInitials(adminName)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-white truncate" title={adminName}>{adminName}</p>
        <p className="text-xs text-white/50 truncate" title={adminEmail}>{adminEmail}</p>
      </div>
      <button
        onClick={onSignOut}
        disabled={signingOut}
        aria-label="Sign out of admin panel"
        title="Sign out"
        className="shrink-0 p-2 -mr-2 rounded-lg text-white/55 hover:text-google-red-light hover:bg-google-red/[0.08] transition-colors disabled:opacity-50"
      >
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 14H3.5A1.5 1.5 0 012 12.5v-9A1.5 1.5 0 013.5 2H6" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 11.5L14 8l-3.5-3.5M14 8H6" />
        </svg>
      </button>
    </div>
  );
}

export default function AdminShell({ adminEmail, adminName, children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileBarHidden, setMobileBarHidden] = useState(false);
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    lastScrollYRef.current = window.scrollY;

    function handleScroll() {
      const currentY = window.scrollY;
      const delta = currentY - lastScrollYRef.current;

      if (currentY <= 0) {
        setMobileBarHidden(false);
      } else if (delta > 4) {
        setMobileBarHidden(true);
      } else if (delta < -4) {
        setMobileBarHidden(false);
      }
      lastScrollYRef.current = currentY;
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setMobileMenuOpen(false);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  async function handleSignOut() {
    setSigningOut(true);
    setMobileMenuOpen(false);
    try {
      // Loaded on demand: importing `@/lib/firebase` at the top would pull the whole
      // client SDK (Auth, Firestore, Storage, App Check and its reCAPTCHA script) into
      // every admin page for the sake of this one button.
      const [{ signOut }, { auth }] = await Promise.all([import('firebase/auth'), import('@/lib/firebase')]);
      await signOut(auth);
      await fetch('/api/admin/session', { method: 'DELETE' });
      router.push('/admin/login');
      router.refresh();
    } catch {
      setSigningOut(false);
      setAlertMessage('Sign-out failed. Please try again.');
    }
  }

  const wordmark = (
    <Link href="/" className="inline-flex items-center hover:opacity-80 transition-opacity" aria-label="Back to DevFest Sydney home">
      <Image src="/logo-wordmark.png" alt="DevFest Sydney" width={1331} height={240} className="h-8 w-auto object-contain" />
    </Link>
  );

  return (
    <div className="min-h-screen bg-[#010103] md:flex md:items-start">
      {/* Mobile top bar */}
      <div
        className={`md:hidden sticky top-0 z-30 flex items-center justify-between pl-3 pr-4 pt-4 pb-3 bg-[#010103] transition-transform duration-300 ease-in-out ${
          mobileBarHidden ? '-translate-y-full' : 'translate-y-0'
        }`}
      >
        {wordmark}
        <button
          onClick={() => setMobileMenuOpen((open) => !open)}
          aria-label={mobileMenuOpen ? 'Close admin menu' : 'Open admin menu'}
          aria-expanded={mobileMenuOpen}
          className="p-2 -mr-2 text-white/70 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path strokeLinecap="round" d="M3.5 6.5h17M3.5 12h17M3.5 17.5h17" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <>
          <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMobileMenuOpen(false)} aria-hidden="true" />
          <div className="md:hidden fixed top-[57px] right-3 mt-2 z-50 w-72 max-w-[calc(100vw-1.5rem)] bg-[#191a1d] border border-white/10 rounded-2xl shadow-[0_12px_32px_rgba(0,0,0,0.45)] overflow-hidden">
            <div className="py-1.5">
              <NavLinks pathname={pathname} onNavigate={() => setMobileMenuOpen(false)} rounded={false} />
            </div>
            <div className="border-t border-white/10 px-1 py-1.5 bg-white/[0.04]">
              <AccountRow adminName={adminName} adminEmail={adminEmail} signingOut={signingOut} onSignOut={handleSignOut} />
            </div>
          </div>
        </>
      )}

      {/* Sidebar (desktop only) */}
      <aside className="hidden md:sticky md:flex top-0 left-0 z-50 w-64 shrink-0 h-screen flex-col border-r border-white/10 px-3 pt-7 pb-4 bg-[#010103]">
        <div className="pl-3 mb-6">{wordmark}</div>

        <div className="flex-1">
          <NavLinks pathname={pathname} rounded />
        </div>

        <div className="border-t border-white/10 pt-3 -mx-3 px-3">
          <AccountRow adminName={adminName} adminEmail={adminEmail} signingOut={signingOut} onSignOut={handleSignOut} />
        </div>
      </aside>

      <main className="flex-1 min-w-0 w-full pb-10">
        <MobileBarContext.Provider value={mobileBarHidden}>{children}</MobileBarContext.Provider>
      </main>

      {alertMessage && <Alert message={alertMessage} onDismiss={() => setAlertMessage(null)} />}
    </div>
  );
}
