// Brings a just-opened panel into view on the dashboard, if it isn't already. A panel whose top
// already sits comfortably on screen stays where it is; otherwise the page glides to its top,
// under the sticky header (each panel's scroll-mt). Instant for people who prefer reduced motion.
const HEADER_HEIGHT = 96;

export function revealPanel(element: HTMLElement | null): void {
  if (!element) return;
  const top = element.getBoundingClientRect().top;
  const isComfortablyVisible = top >= HEADER_HEIGHT && top <= window.innerHeight * 0.55;
  if (isComfortablyVisible) return;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  element.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
}
