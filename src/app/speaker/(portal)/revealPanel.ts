// Brings a just-opened panel into view on the dashboard. A panel that fits on screen moves only
// as far as it must ('nearest'); a taller one (the proposal form) is brought to its top, under
// the sticky header (each panel's scroll-mt), so the form is read from the beginning. Instant
// for people who prefer reduced motion.
const HEADER_AND_MARGIN = 140;

export function revealPanel(element: HTMLElement | null): void {
  if (!element) return;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTallerThanScreen = element.offsetHeight > window.innerHeight - HEADER_AND_MARGIN;
  element.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: isTallerThanScreen ? 'start' : 'nearest' });
}
