'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Navbar({ light = false }: { light?: boolean }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isLight = light;

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isLight
          ? scrolled
            ? 'bg-white/90 backdrop-blur-lg'
            : 'bg-transparent'
          : scrolled
          ? 'bg-[#070B14]/90 backdrop-blur-lg shadow-lg shadow-black/40'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-12 h-[68px] flex items-center justify-between">
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
        <Link
          href="/call-for-speakers"
          className="inline-flex items-center px-5 py-[5px] bg-google-blue text-white text-sm font-semibold rounded-full shadow-[0_1px_6px_rgba(66,133,244,0.28)] hover:bg-[#3574db] hover:-translate-y-0.5 transition-all"
        >
          Submit your talk
        </Link>
      </div>
    </nav>
  );
}
