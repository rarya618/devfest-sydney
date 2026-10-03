// The Builder's Space is a surprise on the day, so /builders-space, its footer link and its
// sitemap entry stay hidden until the doors open. Midnight Sydney time on 10 October (AEDT,
// +11:00), so the page is live before anyone arrives without needing a deploy that morning.
// Always shown in development so it can be previewed locally.
const BUILDERS_SPACE_REVEAL_AT = Date.parse('2026-10-10T00:00:00+11:00');

export function isBuildersSpaceRevealed(): boolean {
  if (process.env.NODE_ENV !== 'production') return true;
  return Date.now() >= BUILDERS_SPACE_REVEAL_AT;
}
