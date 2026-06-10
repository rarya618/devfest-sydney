'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const navLinks = ['About', 'FAQ'];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#070B14]/90 backdrop-blur-lg border-b border-white/5 shadow-xl shadow-black/20'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-0.5 group" aria-label="DevFest Sydney home">
          <Image
            src="/logo.png"
            alt="GDG"
            width={120}
            height={32}
            className="h-8 w-auto object-contain group-hover:opacity-80 transition-opacity"
            priority
          />
          <span className="font-bold text-white text-xl tracking-wide group-hover:text-white/80 transition-colors">
            DevFest Sydney
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-7">
          {navLinks.map((item) => (
            <a
              key={item}
              href={`/#${item.toLowerCase()}`}
              className="text-sm text-white/50 hover:text-white transition-colors"
            >
              {item}
            </a>
          ))}
        </div>

        {/* Desktop CTA */}
        <Link
          href="/call-for-speakers"
          className="hidden md:inline-flex items-center px-5 py-2 bg-google-red text-white text-sm font-bold rounded-full hover:bg-[#d63b2f] transition-all hover:scale-105 active:scale-95"
        >
          Submit your talk
        </Link>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-white/70 hover:text-white transition-colors p-1"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-[#070B14]/98 backdrop-blur-xl border-t border-white/5 px-6 py-5 flex flex-col gap-4">
          {navLinks.map((item) => (
            <a
              key={item}
              href={`/#${item.toLowerCase()}`}
              className="text-white/70 hover:text-white transition-colors py-1"
              onClick={() => setMobileOpen(false)}
            >
              {item}
            </a>
          ))}
          <Link
            href="/call-for-speakers"
            className="mt-2 px-5 py-2.5 bg-google-red text-white text-sm font-bold rounded-full text-center hover:bg-[#d63b2f] transition-colors"
            onClick={() => setMobileOpen(false)}
          >
            Submit your talk
          </Link>
        </div>
      )}
    </nav>
  );
}
