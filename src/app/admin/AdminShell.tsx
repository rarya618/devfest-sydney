'use client';

import { useState, useRef, useEffect, useTransition, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getInitials } from '@/lib/format';
import Alert from '@/components/Alert';
import { MobileBarContext } from './MobileBarContext';
import { selectAdminDevfest } from './eventActions';

interface NavLinkItem {
  href: string;
  label: string;
}

// A dropdown in the nav: a button that opens to its links. Open on its own while one of its
// pages is the current one.
interface NavDropdownItem {
  label: string;
  children: NavLinkItem[];
}

type NavItem = NavLinkItem | NavDropdownItem;

interface NavGroup {
  label: string;
  items: NavItem[];
  hasDevfestPicker?: boolean;
  // The heading is a toggle that hides the group's items. Open on its own while one of its
  // pages is the current one, like a dropdown.
  isCollapsible?: boolean;
}

function isDropdown(item: NavItem): item is NavDropdownItem {
  return 'children' in item;
}

function groupHrefs(group: NavGroup): string[] {
  return group.items.flatMap((item) => (isDropdown(item) ? item.children.map((child) => child.href) : [item.href]));
}

function toDomId(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function Chevron({ isOpen }: { isOpen: boolean }) {
  return (
    <svg
      className={`w-3 h-3 shrink-0 text-white/55 transition-transform ${isOpen ? 'rotate-180' : ''}`}
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 4.5l3.5 3.5 3.5-3.5" />
    </svg>
  );
}

// Opens while one of the given pages is current; otherwise starts closed. Arriving on one of
// those pages from a link elsewhere opens it; it is never closed for you.
function useOpenOnActivePage(containsActivePage: boolean) {
  const [isOpen, setIsOpen] = useState(containsActivePage);
  useEffect(() => {
    if (containsActivePage) setIsOpen(true);
  }, [containsActivePage]);
  return [isOpen, setIsOpen] as const;
}

// DevFest and general events are kept apart (stage 4b, PM.md). The DevFest group shows one
// edition at a time, picked in its heading; general events, and the tools and settings that
// belong to all of GDG Sydney, sit below it.
const NAV_GROUPS: NavGroup[] = [
  {
    label: 'DevFest',
    hasDevfestPicker: true,
    isCollapsible: true,
    items: [
      // Everything that arrives through one of DevFest's public forms, in one place.
      {
        label: 'Forms',
        children: [
          { href: '/admin/devfest/proposals', label: 'Talk proposals' },
          { href: '/admin/devfest/volunteers', label: 'Volunteers' },
          { href: '/admin/devfest/showcase', label: 'Showcase' },
          { href: '/admin/devfest/feedback', label: 'Feedback' },
          { href: '/admin/devfest/credits', label: 'Credits' },
          { href: '/admin/devfest/speaker-gifts', label: 'Speaker gifts' },
        ],
      },
      { href: '/admin/devfest/speakers', label: 'Speakers' },
      { href: '/admin/devfest/crew', label: 'Crew' },
      { href: '/admin/devfest/analytics', label: 'Analytics' },
    ],
  },
  {
    label: 'General events',
    items: [
      { href: '/admin/meetups', label: 'Meetup talks' },
      { href: '/admin/event-volunteers', label: 'Volunteers' },
    ],
  },
  {
    // GDG-wide since stage 4c: one profile per person, across DevFests and general events.
    label: 'GDG Sydney',
    items: [
      { href: '/admin/people', label: 'All speakers' },
      { href: '/admin/volunteer-pool', label: 'Volunteer pool' },
    ],
  },
  {
    label: 'Tools',
    items: [{ href: '/admin/links', label: 'Links' }],
  },
  {
    label: 'Settings',
    items: [
      { href: '/admin/events', label: 'Events' },
      { href: '/admin/admins', label: 'Admins' },
    ],
  },
];

interface Props {
  adminEmail: string;
  adminName: string;
  devfests: DevfestOption[];
  selectedDevfestId: string | null;
  children: ReactNode;
}

interface DevfestOption {
  id: string;
  name: string;
  isCurrent: boolean;
}

interface DevfestPickerProps {
  devfests: DevfestOption[];
  selectedDevfestId: string | null;
  onError: (message: string) => void;
  idSuffix: string;
}

// The DevFest group's heading, doubling as its edition picker: "DEVFEST [2026]". A native
// select, which is keyboard and screen-reader friendly as it is. With one DevFest there is
// nothing to pick, so it is plain text.
function DevfestPicker({ devfests, selectedDevfestId, onError, idSuffix }: DevfestPickerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  if (devfests.length < 2) return null;

  function handleChange(eventId: string) {
    startTransition(async () => {
      const result = await selectAdminDevfest(eventId);
      if (result.error) onError(result.error);
      else router.refresh();
    });
  }

  return (
    <select
      id={`admin-devfest-picker-${idSuffix}`}
      value={selectedDevfestId ?? ''}
      onChange={(changeEvent) => handleChange(changeEvent.target.value)}
      disabled={isPending}
      aria-label="Choose which DevFest the DevFest sections show"
      className="ml-2 rounded-full border border-white/35 bg-white/[0.06] px-2.5 py-0.5 text-xs font-bold text-off-white focus:outline-none focus:border-google-blue focus:ring-2 focus:ring-google-blue/40 disabled:opacity-60"
    >
      {devfests.map((devfest) => (
        <option key={devfest.id} value={devfest.id} className="bg-surface-raised">
          {devfest.name}
          {devfest.isCurrent ? ' (current)' : ''}
        </option>
      ))}
    </select>
  );
}

function isActive(href: string, pathname: string): boolean {
  return href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
}

interface NavLinksProps {
  pathname: string;
  onNavigate?: () => void;
  rounded: boolean;
  devfestPicker: ReactNode;
}

function navLinkClasses(active: boolean, rounded: boolean, nested = false): string {
  return `block text-sm transition-colors ${nested ? 'pl-8 pr-4' : 'px-4'} ${rounded ? 'py-2 rounded-full' : 'py-2.5'} ${
    active ? 'bg-white/10 text-off-white font-bold' : 'text-white/65 font-medium hover:text-off-white hover:bg-white/[0.06]'
  }`;
}

interface NavDropdownProps {
  item: NavDropdownItem;
  pathname: string;
  onNavigate?: () => void;
  rounded: boolean;
}

function NavDropdown({ item, pathname, onNavigate, rounded }: NavDropdownProps) {
  const containsActivePage = item.children.some((child) => isActive(child.href, pathname));
  const [isOpen, setIsOpen] = useOpenOnActivePage(containsActivePage);

  const listId = `nav-dropdown-${toDomId(item.label)}-${rounded ? 'sidebar' : 'menu'}`;
  return (
    <li>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-controls={listId}
        aria-label={`${isOpen ? 'Hide' : 'Show'} ${item.label.toLowerCase()}`}
        className={`w-full flex items-center justify-between text-left text-sm px-4 transition-colors ${rounded ? 'py-2 rounded-full' : 'py-2.5'} ${
          containsActivePage && !isOpen
            ? 'bg-white/10 text-off-white font-bold'
            : `${containsActivePage ? 'text-off-white font-bold' : 'text-white/65 font-medium'} hover:text-off-white hover:bg-white/[0.06]`
        }`}
      >
        {item.label}
        <Chevron isOpen={isOpen} />
      </button>
      {isOpen && (
        <ul id={listId} className={rounded ? 'mt-0.5 space-y-0.5' : undefined}>
          {item.children.map((child) => {
            const active = isActive(child.href, pathname);
            return (
              <li key={child.href}>
                <Link
                  href={child.href}
                  onClick={onNavigate}
                  aria-current={active ? 'page' : undefined}
                  className={navLinkClasses(active, rounded, true)}
                >
                  {child.label}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}

interface NavGroupSectionProps extends NavLinksProps {
  group: NavGroup;
}

function NavGroupSection({ group, pathname, onNavigate, rounded, devfestPicker }: NavGroupSectionProps) {
  const containsActivePage = groupHrefs(group).some((href) => isActive(href, pathname));
  const [isOpen, setIsOpen] = useOpenOnActivePage(containsActivePage);
  const showItems = !group.isCollapsible || isOpen;
  const listId = `nav-group-${toDomId(group.label)}-${rounded ? 'sidebar' : 'menu'}`;
  // Plain sentence-case labels, as on gdgsydney.com and the speaker portal (an ALL-CAPS mono
  // eyebrow until 2026-11-14).
  const labelClasses = 'text-xs font-bold';

  return (
    <div>
      <div className={`flex items-center px-4 ${rounded ? 'mb-1.5' : 'pt-1 pb-1'}`}>
        {group.isCollapsible ? (
          // Collapsed while you are on one of its pages, the heading stays bright, so it still
          // says where you are.
          <button
            type="button"
            onClick={() => setIsOpen((open) => !open)}
            aria-expanded={isOpen}
            aria-controls={listId}
            aria-label={`${isOpen ? 'Hide' : 'Show'} the ${group.label} sections`}
            className={`-my-1 py-1 flex items-center gap-1.5 rounded transition-colors hover:text-white ${labelClasses} ${
              containsActivePage && !isOpen ? 'text-white' : 'text-white/50'
            }`}
          >
            {group.label}
            <Chevron isOpen={isOpen} />
          </button>
        ) : (
          <p className={`${labelClasses} text-white/50`}>{group.label}</p>
        )}
        {group.hasDevfestPicker && devfestPicker}
      </div>
      {showItems && (
        <ul id={listId} className={rounded ? 'space-y-0.5' : undefined}>
          {group.items.map((item) => {
            if (isDropdown(item)) {
              return <NavDropdown key={item.label} item={item} pathname={pathname} onNavigate={onNavigate} rounded={rounded} />;
            }
            const active = isActive(item.href, pathname);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? 'page' : undefined}
                  className={navLinkClasses(active, rounded)}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function NavLinks(props: NavLinksProps) {
  return (
    <nav aria-label="Admin sections" className={props.rounded ? 'space-y-5' : 'space-y-2'}>
      {NAV_GROUPS.map((group) => (
        <NavGroupSection key={group.label} group={group} {...props} />
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
      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white/15 text-off-white text-xs font-bold shrink-0">
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
        className="shrink-0 p-2 -mr-2 rounded-full text-white/60 hover:text-google-red-light hover:bg-google-red/[0.08] transition-colors disabled:opacity-50"
      >
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 14H3.5A1.5 1.5 0 012 12.5v-9A1.5 1.5 0 013.5 2H6" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 11.5L14 8l-3.5-3.5M14 8H6" />
        </svg>
      </button>
    </div>
  );
}

export default function AdminShell({ adminEmail, adminName, devfests, selectedDevfestId, children }: Props) {
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

  // GDG Sydney's logo (the admin covers every event, not only DevFest), the same file the
  // speaker portal and emails use.
  const wordmark = (
    <Link href="/admin" className="inline-flex items-center rounded hover:opacity-85 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-google-blue" aria-label="GDG Sydney admin, home">
      <Image src="https://gdgsydney.com/gdg-logo-dark.png" alt="" width={1700} height={215} className="h-7 w-auto" />
    </Link>
  );

  return (
    <div className="min-h-screen bg-black-02 md:flex md:items-start">
      {/* Mobile top bar */}
      <div
        className={`md:hidden sticky top-0 z-30 flex items-center justify-between pl-3 pr-4 pt-4 pb-3 bg-black-02 transition-transform duration-300 ease-in-out ${
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
          <div className="md:hidden fixed top-[57px] right-3 mt-2 z-50 w-72 max-w-[calc(100vw-1.5rem)] max-h-[calc(100dvh-5rem)] overflow-y-auto bg-surface-raised border border-white/10 rounded-3xl shadow-[0_12px_32px_rgba(0,0,0,0.45)] overflow-hidden">
            <div className="py-1.5">
              <NavLinks
                pathname={pathname}
                onNavigate={() => setMobileMenuOpen(false)}
                rounded={false}
                devfestPicker={
                  <DevfestPicker devfests={devfests} selectedDevfestId={selectedDevfestId} onError={setAlertMessage} idSuffix="mobile" />
                }
              />
            </div>
            <div className="border-t border-white/10 px-1 py-1.5 bg-white/[0.04]">
              <AccountRow adminName={adminName} adminEmail={adminEmail} signingOut={signingOut} onSignOut={handleSignOut} />
            </div>
          </div>
        </>
      )}

      {/* Sidebar (desktop only) */}
      <aside className="hidden md:sticky md:flex top-0 left-0 z-50 w-72 shrink-0 h-screen flex-col border-r border-white/10 px-3 pt-7 pb-4 bg-black-02">
        <div className="pl-3 mb-6">{wordmark}</div>

        <div className="flex-1 min-h-0 overflow-y-auto -mx-3 px-3">
          <NavLinks
            pathname={pathname}
            rounded
            devfestPicker={
              <DevfestPicker devfests={devfests} selectedDevfestId={selectedDevfestId} onError={setAlertMessage} idSuffix="sidebar" />
            }
          />
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
