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
  { href: '/admin/analytics', label: 'Analytics' },
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
    <div className="min-h-screen bg-off-white flex items-start">
      {/* Sidebar */}
      <div className="w-56 shrink-0 h-screen sticky top-0 flex flex-col border-r border-black-02/8 px-3 py-5">
        <Link href="/" className="inline-flex items-center gap-0.5 px-2 mb-6 hover:opacity-80 transition-opacity" aria-label="Back to DevFest Sydney home">
          <Image
            src="/logo.png"
            alt="GDG"
            width={100}
            height={27}
            className="h-6 w-auto object-contain"
          />
          <span className="font-bold text-black-02 text-lg tracking-tight">DevFest Sydney</span>
        </Link>

        <nav aria-label="Admin sections" className="flex-1">
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const active = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={`block text-sm px-3 py-2 rounded-lg transition-colors ${
                      active
                        ? 'bg-google-blue/10 text-google-blue font-bold'
                        : 'text-black-02/55 font-medium hover:text-black-02/80 hover:bg-black-02/[0.04]'
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
              className="absolute left-0 bottom-full mb-2 w-full bg-white border border-black-02/10 rounded-2xl shadow-[0_12px_32px_rgba(30,30,30,0.14)] overflow-hidden"
            >
              <div className="flex items-center gap-3 px-4 py-3.5 bg-black-02/[0.02]">
                <span className="flex items-center justify-center w-9 h-9 rounded-full bg-google-blue text-white text-sm font-bold shrink-0">
                  {getInitials(adminName)}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-black-02 truncate" title={adminName}>{adminName}</p>
                  <p className="text-xs text-black-02/45 truncate" title={adminEmail}>{adminEmail}</p>
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
                  className="w-full flex items-center gap-2.5 text-left text-sm px-4 py-2.5 text-black-02/75 hover:bg-black-02/[0.04] transition-colors"
                >
                  <svg className="w-4 h-4 text-black-02/40 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                    <circle cx="6" cy="5.5" r="2.75" />
                    <path strokeLinecap="round" d="M1.5 14c0-2.76 2.24-4.5 4.5-4.5s4.5 1.74 4.5 4.5" />
                    <path strokeLinecap="round" d="M12.5 5.5v4M10.5 7.5h4" />
                  </svg>
                  Invite admin
                </button>
              </div>

              <div className="border-t border-black-02/8 py-1.5">
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
              menuOpen ? 'border-black-02/25 bg-black-02/[0.03]' : 'border-transparent hover:border-black-02/15 hover:bg-black-02/[0.03]'
            }`}
          >
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-google-blue text-white text-xs font-bold shrink-0">
              {getInitials(adminName)}
            </span>
            <span className="min-w-0 flex-1 text-left">
              <span className="block text-sm font-semibold text-black-02 truncate" title={adminName}>{adminName}</span>
            </span>
            <svg className={`w-3 h-3 text-black-02/40 shrink-0 transition-transform ${menuOpen ? '' : 'rotate-180'}`} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 4.5l3.5 3.5 3.5-3.5" />
            </svg>
          </button>
        </div>
      </div>

      <main className="flex-1 min-w-0 pb-10">{children}</main>

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
