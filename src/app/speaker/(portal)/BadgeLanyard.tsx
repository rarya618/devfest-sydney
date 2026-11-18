'use client';

import { useEffect, useRef } from 'react';

// The portal's signature: a badge hanging from a GDG lanyard. It swings in on its strap and
// settles when the page arrives (CSS, .badge-hang in globals.css), then, on a mouse or
// trackpad, tilts toward the pointer with a sheen that follows it. The tilt is written straight
// to CSS custom properties in an animation frame, so moving the pointer never re-renders React.
// People who prefer reduced motion get the badge at rest: no swing, no tilt.

const STRAP_COLOURS = ['bg-google-blue', 'bg-google-red', 'bg-google-yellow', 'bg-google-green'];
const MAX_TILT_DEGREES = 7;

interface BadgeLanyardProps {
  children: React.ReactNode;
  // 'arrive' for a quieter entrance (a second badge on a shared address, the sign-in page).
  entrance?: 'swing' | 'arrive';
  // A badge holding a form (sign-in) stays still under the pointer, so it never moves while
  // someone is typing into it.
  canTilt?: boolean;
  // The strap's length: shorter on the sign-in pages, where the form needs the room.
  strapClassName?: string;
  // Hangs straight rather than at the slight resting tilt: for a badge holding text to read.
  isLevel?: boolean;
}

export default function BadgeLanyard({ children, entrance = 'swing', canTilt = true, strapClassName = 'h-14 sm:h-20', isLevel = false }: BadgeLanyardProps) {
  const tiltLayer = useRef<HTMLDivElement>(null);

  // Remember that the badge has swung this visit, so the next load fades it in instead.
  useEffect(() => {
    if (entrance !== 'swing') return;
    try {
      sessionStorage.setItem('portal-badge-swung', '1');
    } catch {
      // Storage blocked: the badge just swings again next time.
    }
  }, [entrance]);

  useEffect(() => {
    const layer = tiltLayer.current;
    if (!layer || !canTilt) return;
    const finePointer = window.matchMedia('(pointer: fine)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!finePointer.matches || reducedMotion.matches) return;

    let frame = 0;
    let pending: { x: number; y: number } | null = null;

    function apply() {
      frame = 0;
      if (!layer || !pending) return;
      const { x, y } = pending;
      layer.style.setProperty('--tilt-x', `${(-y * MAX_TILT_DEGREES).toFixed(2)}deg`);
      layer.style.setProperty('--tilt-y', `${(x * MAX_TILT_DEGREES).toFixed(2)}deg`);
      layer.style.setProperty('--sheen-x', `${((x + 1) * 50).toFixed(1)}%`);
      layer.style.setProperty('--sheen-y', `${((y + 1) * 50).toFixed(1)}%`);
    }

    function handleMove(event: PointerEvent) {
      // Measured on the hanger, which the tilt never moves: measuring the tilting layer itself
      // would feed each frame's rotation into the next and jitter at the edges.
      const box = layer?.parentElement?.getBoundingClientRect();
      if (!layer || !box) return;
      // -1 to 1 across the badge, from its centre.
      pending = {
        x: Math.max(-1, Math.min(1, ((event.clientX - box.left) / box.width) * 2 - 1)),
        y: Math.max(-1, Math.min(1, ((event.clientY - box.top) / box.height) * 2 - 1)),
      };
      layer.dataset.tilting = 'true';
      if (!frame) frame = requestAnimationFrame(apply);
    }

    function handleLeave() {
      if (!layer) return;
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      pending = null;
      layer.dataset.tilting = 'false';
      layer.style.setProperty('--tilt-x', '0deg');
      layer.style.setProperty('--tilt-y', '0deg');
    }

    layer.addEventListener('pointermove', handleMove);
    layer.addEventListener('pointerleave', handleLeave);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      layer.removeEventListener('pointermove', handleMove);
      layer.removeEventListener('pointerleave', handleLeave);
    };
  }, [canTilt]);

  return (
    <div className="flex flex-col items-center">
      {/* The strap, striped in the four GDG colours, and the clip that holds the badge. */}
      <div aria-hidden="true" className={`flex w-4 overflow-hidden rounded-b-[3px] ${strapClassName}`}>
        {STRAP_COLOURS.map((colour) => <span key={colour} className={`flex-1 ${colour}`} />)}
      </div>
      <div aria-hidden="true" className="relative z-10 -mt-0.5 h-5 w-10 rounded-lg border border-white/15 bg-surface-raised shadow-[0_4px_8px_-2px_rgba(0,0,0,0.5)]">
        <span className="absolute left-1/2 top-1/2 h-1.5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black-02" />
      </div>
      <div
        data-swing={entrance === 'swing' ? 'full' : 'arrive'}
        style={isLevel ? ({ '--badge-rest': '0deg' } as React.CSSProperties) : undefined}
        className="badge-hang -mt-[26px] w-full [perspective:1000px]">
        <div
          ref={tiltLayer}
          data-tilting="false"
          className="group relative transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] data-[tilting=true]:duration-150 [transform:rotateX(var(--tilt-x,0deg))_rotateY(var(--tilt-y,0deg))] [transform-style:preserve-3d]"
        >
          {children}
          {/* The sheen: light catching the badge where the pointer is. Invisible at rest. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-[28px] opacity-0 transition-opacity duration-500 [background:radial-gradient(circle_at_var(--sheen-x,50%)_var(--sheen-y,0%),rgba(255,255,255,0.09),transparent_55%)] group-data-[tilting=true]:opacity-100"
          />
        </div>
      </div>
    </div>
  );
}
