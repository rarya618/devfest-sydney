'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import CfsLink from './CfsLink';

export default function Navbar({ light = false, isCfsOpen = false }: { light?: boolean; isCfsOpen?: boolean }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isLight = light;

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      {isCfsOpen && (
        <div
          className={`overflow-hidden transition-[max-height,opacity] duration-300 ${
            scrolled ? 'max-h-0 opacity-0' : 'max-h-12 opacity-100'
          }`}
        >
          <CfsLink
            className="block bg-google-red text-white text-center py-2 text-xs font-semibold tracking-wide hover:underline underline-offset-2"
          >
            Call for Speakers is open — submit your session
          </CfsLink>
        </div>
      )}
      <nav
        className={`transition-all duration-300 ${
          isLight
            ? scrolled
              ? 'bg-off-white shadow-sm'
              : 'bg-transparent'
            : scrolled
            ? 'bg-[#070B14]/90 backdrop-blur-lg shadow-lg shadow-black/40'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 h-[68px] flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="inline-flex items-center gap-0.5 group" aria-label="DevFest Sydney home">
            <Image
              src="/logo.png"
              alt="GDG"
              width={120}
              height={32}
              className="h-7 w-auto object-contain group-hover:opacity-80 transition-opacity"
              priority
            />
            <span
              className={`font-bold text-lg tracking-tight transition-colors ${
                isLight ? 'text-black-02 group-hover:text-black-02/80' : 'text-white group-hover:text-white/80'
              }`}
            >
              DevFest Sydney
            </span>
          </Link>

          {/* CTA */}
          <CfsLink
            className="inline-flex items-center px-4 py-2 bg-google-blue text-white text-xs font-bold rounded-[3px] border border-google-blue transition-colors hover:bg-transparent hover:text-google-blue"
          >
            Call for Speakers
          </CfsLink>
        </div>
      </nav>
    </div>
  );
}
