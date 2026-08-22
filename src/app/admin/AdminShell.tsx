'use client';

import { useState, useRef, useEffect, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getInitials } from '@/lib/format';
import Alert from '@/components/Alert';
import InviteAdminForm from './InviteAdminForm';

const NAV_ITEMS: { href: string; label: string }[] = [
  { href: '/admin', label: 'Submissions' },
  { href: '/admin/volunteers', label: 'Volunteers' },
  { href: '/admin/analytics', label: 'Analytics' },
  { href: '/admin/links', label: 'Links' },
  { href: '/admin/admins', label: 'Admins' },
];

interface Props {
  adminEmail: string;
  adminName: string;
  children: ReactNode;
}

export default function AdminShell({ adminEmail, adminName, children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuOpen(false);
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut(auth);
      await fetch('/api/admin/session', { method: 'DELETE' });
      router.push('/admin/login');
      router.refresh();
    } catch {
      setSigningOut(false);
      setAlertMessage('Sign-out failed. Please try again.');
    }
  }

  return (
    <div className="min-h-screen bg-[#202124] md:flex md:items-start">
      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-30 flex items-center justify-between pl-3 pr-4 pt-4 pb-3 bg-[#202124]">
        <Link href="/" className="inline-flex items-center hover:opacity-80 transition-opacity" aria-label="Back to DevFest Sydney home">
          <Image src="/logo-wordmark.png" alt="DevFest Sydney" width={1331} height={240} className="h-8 w-auto object-contain" />
        </Link>
        <button
          onClick={() => setSidebarOpen(true)}
          aria-label="Open admin menu"
          className="p-2 -mr-2 text-white/70 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
            <path strokeLinecap="round" d="M3.5 6.5h17M3.5 12h17M3.5 17.5h17" />
          </svg>
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
          <div className="md:hidden fixed top-[57px] right-3 mt-2 z-50 w-72 max-w-[calc(100vw-1.5rem)] bg-[#2d2e31] border border-white/10 rounded-2xl shadow-[0_12px_32px_rgba(0,0,0,0.45)] overflow-hidden">
            <nav aria-label="Admin sections" className="py-1.5">
              <ul>
                {NAV_ITEMS.map((item) => {
                  const active = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        aria-current={active ? 'page' : undefined}
                        className={`block text-sm px-4 py-2.5 transition-colors ${
                          active
                            ? 'bg-white/10 text-white font-bold'
                            : 'text-white/60 font-medium hover:text-white hover:bg-white/[0.08]'
                        }`}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="border-t border-white/10 flex items-center gap-3 px-4 py-3.5 bg-white/[0.04]">
              <span className="flex items-center justify-center w-9 h-9 rounded-full bg-google-blue text-white text-sm font-bold shrink-0">
                {getInitials(adminName)}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate" title={adminName}>{adminName}</p>
                <p className="text-xs text-white/50 truncate" title={adminEmail}>{adminEmail}</p>
              </div>
            </div>

            <div className="border-t border-white/10 py-1.5">
              <button
                onClick={() => {
                  setSidebarOpen(false);
                  setInviting(true);
                }}
                aria-label="Invite a new admin"
                className="w-full flex items-center gap-2.5 text-left text-sm px-4 py-2.5 text-white hover:bg-white/[0.08] transition-colors"
              >
                <svg className="w-4 h-4 text-white/40 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                  <circle cx="6" cy="5.5" r="2.75" />
                  <path strokeLinecap="round" d="M1.5 14c0-2.76 2.24-4.5 4.5-4.5s4.5 1.74 4.5 4.5" />
                  <path strokeLinecap="round" d="M12.5 5.5v4M10.5 7.5h4" />
                </svg>
                Invite admin
              </button>
            </div>

            <div className="border-t border-white/10 py-1.5">
              <button
                onClick={() => {
                  setSidebarOpen(false);
                  handleSignOut();
                }}
                disabled={signingOut}
                aria-label="Sign out of admin panel"
                className="w-full flex items-center gap-2.5 text-left text-sm px-4 py-2.5 text-google-red/85 hover:bg-google-red/[0.06] transition-colors disabled:opacity-50"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 14H3.5A1.5 1.5 0 012 12.5v-9A1.5 1.5 0 013.5 2H6" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 11.5L14 8l-3.5-3.5M14 8H6" />
                </svg>
                {signingOut ? 'Signing out…' : 'Sign out'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Sidebar (desktop only) */}
      <div className="hidden md:sticky md:flex top-0 left-0 z-50 w-64 shrink-0 h-screen flex-col border-r border-white/10 px-3 pt-7 pb-5 bg-[#202124]">
        <div className="flex items-center justify-between gap-2 pl-3 pr-2 mb-6">
          <Link href="/" className="inline-flex items-center hover:opacity-80 transition-opacity" aria-label="Back to DevFest Sydney home">
            <Image
              src="/logo-wordmark.png"
              alt="DevFest Sydney"
              width={1331}
              height={240}
              className="h-8 w-auto object-contain"
            />
          </Link>
        </div>

        <nav aria-label="Admin sections" className="flex-1">
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const active = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={`block text-sm px-4 py-2 rounded-lg transition-colors ${
                      active
                        ? 'bg-white/10 text-white font-bold'
                        : 'text-white/50 font-medium hover:text-white hover:bg-white/[0.08]'
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="relative" ref={menuRef}>
          {menuOpen && (
            <div
              role="menu"
              className="absolute left-0 bottom-full mb-2 w-full bg-[#2d2e31] border border-white/10 rounded-2xl shadow-[0_12px_32px_rgba(0,0,0,0.45)] overflow-hidden"
            >
              <div className="flex items-center gap-3 px-4 py-3.5 bg-white/[0.04]">
                <span className="flex items-center justify-center w-9 h-9 rounded-full bg-google-blue text-white text-sm font-bold shrink-0">
                  {getInitials(adminName)}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate" title={adminName}>{adminName}</p>
                  <p className="text-xs text-white/50 truncate" title={adminEmail}>{adminEmail}</p>
                </div>
              </div>

              <div className="py-1.5">
                <button
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    setInviting(true);
                  }}
                  aria-label="Invite a new admin"
                  className="w-full flex items-center gap-2.5 text-left text-sm px-4 py-2.5 text-white hover:bg-white/[0.08] transition-colors"
                >
                  <svg className="w-4 h-4 text-white/40 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                    <circle cx="6" cy="5.5" r="2.75" />
                    <path strokeLinecap="round" d="M1.5 14c0-2.76 2.24-4.5 4.5-4.5s4.5 1.74 4.5 4.5" />
                    <path strokeLinecap="round" d="M12.5 5.5v4M10.5 7.5h4" />
                  </svg>
                  Invite admin
                </button>
              </div>

              <div className="border-t border-white/10 py-1.5">
                <button
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    handleSignOut();
                  }}
                  disabled={signingOut}
                  aria-label="Sign out of admin panel"
                  className="w-full flex items-center gap-2.5 text-left text-sm px-4 py-2.5 text-google-red/85 hover:bg-google-red/[0.06] transition-colors disabled:opacity-50"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 14H3.5A1.5 1.5 0 012 12.5v-9A1.5 1.5 0 013.5 2H6" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 11.5L14 8l-3.5-3.5M14 8H6" />
                  </svg>
                  {signingOut ? 'Signing out…' : 'Sign out'}
                </button>
              </div>
            </div>
          )}

          <button
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Admin menu"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-lg border transition-colors ${
              menuOpen ? 'border-white/15 bg-white/[0.05]' : 'border-transparent hover:border-white/10 hover:bg-white/[0.06]'
            }`}
          >
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-google-blue text-white text-xs font-bold shrink-0">
              {getInitials(adminName)}
            </span>
            <span className="min-w-0 flex-1 text-left">
              <span className="block text-sm font-semibold text-white truncate" title={adminName}>{adminName}</span>
            </span>
            <svg className={`w-3 h-3 text-white/40 shrink-0 transition-transform ${menuOpen ? '' : 'rotate-180'}`} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 4.5l3.5 3.5 3.5-3.5" />
            </svg>
          </button>
        </div>
      </div>

      <main className="flex-1 min-w-0 w-full pb-10">{children}</main>

      {inviting && (
        <InviteAdminForm
          onDone={() => setInviting(false)}
          onError={(message) => {
            setInviting(false);
            setAlertMessage(message);
          }}
        />
      )}

      {alertMessage && <Alert message={alertMessage} onDismiss={() => setAlertMessage(null)} />}
    </div>
  );
}
