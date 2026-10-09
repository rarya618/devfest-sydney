'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  // Scroll speed in pixels per second, so a long column takes longer to loop rather than
  // moving faster than anyone can read.
  pixelsPerSecond?: number;
}

// Rolls a column upwards on a loop, but only once its content is taller than the space it
// has: a short list sits still. The content is rendered twice and the pair is moved up by
// exactly one copy, so the loop has no seam. The second copy is hidden from screen readers.
export default function VerticalMarquee({ children, pixelsPerSecond = 30 }: Props) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [loopHeight, setLoopHeight] = useState<number | null>(null);

  useEffect(() => {
    const viewport = viewportRef.current;
    const content = contentRef.current;
    if (!viewport || !content) return;

    const measure = () => {
      const contentHeight = content.offsetHeight;
      setLoopHeight(contentHeight > viewport.clientHeight ? contentHeight : null);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    observer.observe(content);
    return () => observer.disconnect();
  }, []);

  const isRolling = loopHeight !== null;

  return (
    <div
      ref={viewportRef}
      // Fade the top and bottom edges while rolling, so cards slide in and out rather than
      // being sliced off by the edge of the column.
      className={`relative h-full overflow-hidden ${
        isRolling ? '[mask-image:linear-gradient(to_bottom,transparent,black_6%,black_94%,transparent)]' : ''
      }`}
    >
      <div
        className={isRolling ? 'animate-marquee-up' : undefined}
        style={isRolling ? { animationDuration: `${loopHeight / pixelsPerSecond}s` } : undefined}
      >
        {/* While rolling, pb-4 matches the gap between cards, so the last card and the repeat
            of the first are spaced like any other pair. Only then: a list that just fits
            would otherwise be pushed over the edge by its own padding. */}
        <div ref={contentRef} className={isRolling ? 'pb-4' : undefined}>
          {children}
        </div>
        {isRolling && (
          <div className="pb-4" aria-hidden="true">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
