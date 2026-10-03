// The Builder's Space pages are live, but not promoted until the day: the footer link and the
// sitemap entries stay hidden until midnight Sydney time on 10 October (AEDT, +11:00), so the
// pages are reached only by direct link until then, with no deploy needed that morning.
// Always shown in development so it can be previewed locally.
const BUILDERS_SPACE_REVEAL_AT = Date.parse('2026-10-10T00:00:00+11:00');

export function isBuildersSpaceRevealed(): boolean {
  if (process.env.NODE_ENV !== 'production') return true;
  return Date.now() >= BUILDERS_SPACE_REVEAL_AT;
}
