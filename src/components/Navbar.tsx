'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

// Pages only, never anchors into the landing page: a nav item should take you somewhere,
// not scroll the page you are on. About and Tracks stay reachable from the footer.
// Kept short. /tickets is reached from the CTA button beside these links, from the
// landing page's ticket section, and from the footer, so a nav item for it would only
// repeat the CTA sitting next to it. /builder-showcase left the nav on 2026-10-10, once
// demos were settled for the day; it is still in the footer's Support column.
const NAV_LINKS = [
  { href: '/speakers', label: 'Speakers' },
  { href: '/schedule', label: 'Schedule' },
  { href: '/partners', label: 'Partners' },
];

// The public pages' header, still used by /privacy, /feedback, /credits and the 404. Its ticket
// banner and "Get tickets" / "Apply to speak" button went in stage 4a (2026-11-13): both
// pointed at pages this app no longer has, and the next DevFest's forms and tickets are
// promoted on gdgsydney.com.
export default function Navbar() {
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
      <nav
        className={`relative z-50 transition-all duration-300 ${
          scrolled ? 'bg-[#010103]/90 backdrop-blur-lg shadow-sm shadow-black/20' : 'bg-transparent'
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

          <div className="flex items-center gap-6 lg:gap-8">
            {/* Links: tighter spacing below lg so the items and the CTA fit beside the logo at 768px */}
            <div className="hidden md:flex items-center gap-5 lg:gap-8 text-sm font-bold text-white whitespace-nowrap">
              {NAV_LINKS.map((link) => (
                <Link key={link.href} href={link.href} className="hover:text-white/80 transition-colors">
                  {link.label}
                </Link>
              ))}
            </div>

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
          className={`md:hidden overflow-hidden transition-[max-height] duration-300 bg-[#010103]/95 backdrop-blur-lg ${
            mobileMenuOpen ? 'max-h-96' : 'max-h-0'
          }`}
        >
          <div className="px-4 sm:px-6 py-6 flex flex-col gap-5">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-bold text-white hover:text-white/80 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </div>
  );
}
