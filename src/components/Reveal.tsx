'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

export default function Reveal({
  children,
  className = '',
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // 15% of the element, but never more than 15% of the screen's height. A tall element (the
    // schedule list on a phone is over 5,000px) would otherwise need more of itself on screen
    // than the screen can show, and never appear.
    const threshold = Math.min(0.15, (window.innerHeight * 0.15) / Math.max(node.offsetHeight, 1));

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          setAnimating(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin: '0px 0px -60px 0px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`${className} ${animating ? 'animate-slide-up' : visible ? '' : 'opacity-0'}`}
      style={animating ? { animationDelay: `${delay}s` } : undefined}
      onAnimationEnd={() => setAnimating(false)}
    >
      {children}
    </div>
  );
}
