import { flushSync } from 'react-dom';

// Runs a state change as a view transition of the agenda stage (globals.css,
// ::view-transition-*(agenda-stage)): the card morphs to another talk, or into a form and
// back, instead of swapping. Browsers without view transitions, and people who prefer reduced
// motion, get the change at once.
export function withStageTransition(update: () => void): void {
  const doc = document as Document & { startViewTransition?: (callback: () => void) => unknown };
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (typeof doc.startViewTransition !== 'function' || prefersReducedMotion) {
    update();
    return;
  }
  doc.startViewTransition(() => flushSync(update));
}
