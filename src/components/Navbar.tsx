'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import CfsLink from './CfsLink';
import ShowcaseLink from './ShowcaseLink';
import TicketsLink from './TicketsLink';

type Accent = 'blue' | 'green' | 'red' | 'yellow';

const ACCENT_CLASSES: Record<Accent, string> = {
  blue: 'bg-google-blue border-google-blue text-white',
  green: 'bg-google-green border-google-green text-white',
  red: 'bg-google-red border-google-red text-white',
  // Yellow is light enough that white on it fails WCAG AA, so this accent pairs with
  // Black 02 text rather than the white the other three use.
  yellow: 'bg-google-yellow border-google-yellow text-[#1e1e1e]',
};

// Kept short. /tickets is reached from the CTA button beside these links, from the
// landing page's ticket section, and from the footer, so a nav item for it would only
// repeat the CTA sitting next to it.
//
// /builder-showcase is not gated on whether entries are open, for the same reason the
// footer's /tickets link is permanent: the page has its own closed state, and Navbar is a
// client component that cannot read the server-only SHOWCASE_OPEN anyway.

// Matched against so the showcase item renders as a ShowcaseLink, which tags the click
// with its own ref the way the tickets and CfS CTAs do.
const SHOWCASE_HREF = '/builder-showcase';

const NAV_LINKS = [
  { href: '/#about', label: 'About' },
  { href: '/#tracks', label: 'Tracks' },
  { href: SHOWCASE_HREF, label: 'Builder Showcase' },
];

export default function Navbar({
  accent = 'blue',
  isCfsOpen = false,
  cfsCloseDate,
  // Computed on the server by areTicketsOpen() and passed in: this is a client component,
  // so it cannot read the server-only env vars that decide it.
  areTicketsOpen = false,
}: {
  accent?: Accent;
  isCfsOpen?: boolean;
  cfsCloseDate?: string;
  areTicketsOpen?: boolean;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [mobileMenuOpen]);

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}
      {(areTicketsOpen || isCfsOpen) && (
        <div
          className={`overflow-hidden transition-[max-height,opacity] duration-300 ${
            scrolled ? 'max-h-0 opacity-0' : 'max-h-16 opacity-100'
          }`}
        >
          {areTicketsOpen ? (
            <TicketsLink
              source="banner"
              className="block bg-google-blue text-white text-center py-2 text-sm font-semibold tracking-wide underline underline-offset-2 decoration-white/40 hover:decoration-white transition-colors"
            >
              DevFest Sydney 2026 tickets are on sale now. Grab yours before they go
            </TicketsLink>
          ) : (
            <CfsLink
              source="banner"
              className="block bg-google-red text-white text-center py-2 text-sm font-semibold tracking-wide underline underline-offset-2 decoration-white/40 hover:decoration-white transition-colors"
            >
              {cfsCloseDate
                ? 'Last chance: the Call for Speakers closes at midnight tonight. Submit your session'
                : 'The Call for Speakers is open. Submit your session'}
            </CfsLink>
          )}
        </div>
      )}
      <nav
        className={`relative z-50 transition-all duration-300 ${
          scrolled ? 'bg-[#17181a]/90 backdrop-blur-lg shadow-sm shadow-black/20' : 'bg-transparent'
        }`}
      >
        <div className="px-4 sm:px-6 lg:px-12 py-6 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="inline-flex items-center group" aria-label="DevFest Sydney home">
            <Image
              src="/logo-wordmark.png"
              alt="DevFest Sydney"
              width={1331}
              height={240}
              className="h-9 w-auto object-contain group-hover:opacity-80 transition-opacity"
              priority
            />
          </Link>

          <div className="flex items-center gap-8">
            {/* Links */}
            <div className="hidden md:flex items-center gap-8 text-sm font-bold text-white whitespace-nowrap">
              {NAV_LINKS.map((link) =>
                link.href === SHOWCASE_HREF ? (
                  <ShowcaseLink key={link.href} source="navbar" className="hover:text-white/80 transition-colors">
                    {link.label}
                  </ShowcaseLink>
                ) : (
                  <Link key={link.href} href={link.href} className="hover:text-white/80 transition-colors">
                    {link.label}
                  </Link>
                )
              )}
            </div>

            {/* CTA: tickets are the primary conversion once they are on sale */}
            {areTicketsOpen ? (
              <TicketsLink
                source="navbar"
                aria-label="Get tickets for DevFest Sydney 2026 on Humanitix"
                className={`hidden md:inline-flex items-center px-5.5 py-1.75 text-sm font-bold rounded-sm border transition-opacity hover:opacity-80 ${ACCENT_CLASSES[accent]}`}
              >
                Get tickets
              </TicketsLink>
            ) : (
              <CfsLink
                source="navbar"
                className={`hidden md:inline-flex items-center px-5.5 py-1.75 text-sm font-bold rounded-sm border transition-opacity hover:opacity-80 ${ACCENT_CLASSES[accent]}`}
              >
                Apply to speak
              </CfsLink>
            )}

            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
              className="md:hidden inline-flex items-center justify-center w-10 h-10 text-white"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu panel */}
        <div
          className={`md:hidden overflow-hidden transition-[max-height] duration-300 bg-[#17181a]/95 backdrop-blur-lg ${
            mobileMenuOpen ? 'max-h-96' : 'max-h-0'
          }`}
        >
          <div className="px-4 sm:px-6 py-6 flex flex-col gap-5">
            {NAV_LINKS.map((link) =>
              link.href === SHOWCASE_HREF ? (
                <ShowcaseLink
                  key={link.href}
                  source="navbar-mobile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base font-bold text-white hover:text-white/80 transition-colors"
                >
                  {link.label}
                </ShowcaseLink>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base font-bold text-white hover:text-white/80 transition-colors"
                >
                  {link.label}
                </Link>
              )
            )}
            {areTicketsOpen ? (
              <TicketsLink
                source="navbar-mobile"
                aria-label="Get tickets for DevFest Sydney 2026 on Humanitix"
                className={`inline-flex items-center justify-center px-5.5 py-1.75 text-sm font-bold rounded-sm border transition-opacity hover:opacity-80 ${ACCENT_CLASSES[accent]}`}
              >
                Get tickets
              </TicketsLink>
            ) : (
              <CfsLink
                source="navbar"
                className={`inline-flex items-center justify-center px-5.5 py-1.75 text-sm font-bold rounded-sm border transition-opacity hover:opacity-80 ${ACCENT_CLASSES[accent]}`}
              >
                Apply to speak
              </CfsLink>
            )}
          </div>
        </div>
      </nav>
    </div>
  );
}
