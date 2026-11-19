'use client';

// A row of filter chips that scrolls sideways when it's wider than the page, and fades at
// whichever edge has more chips behind it. Before, the rows on Crew and Volunteers were simply
// cut off ("Phot", "Setup / Pack-do") with nothing to say more were there.

import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

interface FilterChipRowProps {
  /** The group's accessible name: "Filter crew by assigned area". */
  label: string;
  className?: string;
  children: ReactNode;
}

const FADE = '32px';

export default function FilterChipRow({ label, className = '', children }: FilterChipRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState({ left: false, right: false });

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    function measure() {
      if (!row) return;
      const maxScroll = row.scrollWidth - row.clientWidth;
      setOverflow({ left: row.scrollLeft > 1, right: row.scrollLeft < maxScroll - 1 });
    }
    measure();
    row.addEventListener('scroll', measure, { passive: true });
    const observer = new ResizeObserver(measure);
    observer.observe(row);
    return () => {
      row.removeEventListener('scroll', measure);
      observer.disconnect();
    };
  }, []);

  const mask = `linear-gradient(to right, ${overflow.left ? 'transparent' : 'black'}, black ${FADE}, black calc(100% - ${FADE}), ${overflow.right ? 'transparent' : 'black'})`;

  return (
    <div
      ref={rowRef}
      role="group"
      aria-label={label}
      style={{ maskImage: mask, WebkitMaskImage: mask }}
      className={`px-4 md:px-5 flex items-center gap-2 overflow-x-auto overscroll-x-contain scroll-px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`}
    >
      {children}
    </div>
  );
}
