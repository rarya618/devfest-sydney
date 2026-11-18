'use client';

import { useEffect, useRef, useState } from 'react';

// A panel that opens and closes by growing to and from its natural height (.panel-reveal in
// globals.css), so what sits below it glides instead of jumping. While it closes it keeps
// showing what it held, then unmounts.
const CLOSE_DURATION_MS = 320;

interface AnimatedPanelProps {
  isOpen: boolean;
  children: React.ReactNode;
  className?: string;
}

export default function AnimatedPanel({ isOpen, children, className = '' }: AnimatedPanelProps) {
  const [isMounted, setIsMounted] = useState(isOpen);
  const [isShown, setIsShown] = useState(isOpen);
  const lastChildren = useRef(children);
  if (isOpen) lastChildren.current = children;

  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
      // Two frames: one to mount at zero height, one to let it grow.
      let secondFrame = 0;
      const firstFrame = requestAnimationFrame(() => {
        secondFrame = requestAnimationFrame(() => setIsShown(true));
      });
      return () => {
        cancelAnimationFrame(firstFrame);
        cancelAnimationFrame(secondFrame);
      };
    }
    setIsShown(false);
    const timer = setTimeout(() => setIsMounted(false), CLOSE_DURATION_MS);
    return () => clearTimeout(timer);
  }, [isOpen]);

  // Renders the moment it opens (at zero height, so the page can focus and scroll to it in the
  // same commit) and stays until the close has played.
  if (!isOpen && !isMounted) return null;
  return (
    <div className={`panel-reveal ${className}`} data-open={isShown ? 'true' : 'false'} inert={!isOpen}>
      <div>{isOpen ? children : lastChildren.current}</div>
    </div>
  );
}
