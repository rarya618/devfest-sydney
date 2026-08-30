import { INTERNAL_UTM_SOURCE, INTERNAL_UTM_MEDIUM } from './tracking';

// The URL stays public (NEXT_PUBLIC_): TicketsLink renders inside Navbar, a client
// component, so the href has to reach the browser bundle. It is a public event page,
// and it never changes on a schedule, so build-time inlining is fine for it.
export const TICKETS_URL = process.env.NEXT_PUBLIC_HUMANITIX_URL ?? '';

// Whether tickets are on sale is NOT public, and deliberately so: a NEXT_PUBLIC_ value is
// baked into the client bundle at build time, so it could only ever change on a deploy.
// Evaluating TICKETS_ON_SALE_DATE here, on the server, at render time is what lets sales
// open on their own. Callers must be server components; Navbar takes the result as a prop,
// and the pages that show ticket CTAs are force-dynamic so nothing is frozen at build time.
export function areTicketsOpen(now: Date = new Date()): boolean {
  // A missing URL means a half-configured environment: stay closed rather than render a
  // button pointing at nothing.
  if (TICKETS_URL === '') return false;

  const onSaleDate = process.env.TICKETS_ON_SALE_DATE;
  if (!onSaleDate) return false;

  const onSaleAt = new Date(onSaleDate);
  // An unparseable date is a misconfiguration, and opening sales early is the worse of the
  // two failure modes, so treat it as closed.
  if (Number.isNaN(onSaleAt.getTime())) return false;

  return now.getTime() >= onSaleAt.getTime();
}

// Unlike CfsLink and VolunteerLink, the attribution has to ride the visible URL: the
// destination is Humanitix, so localStorage attribution never reaches it. The label is
// one we chose for our own CTA (e.g. "navbar"), not the visitor's own tracking source.
export function ticketsHref(source?: string): string {
  if (!source) return TICKETS_URL;
  const separator = TICKETS_URL.includes('?') ? '&' : '?';
  const params = new URLSearchParams({
    utm_source: INTERNAL_UTM_SOURCE,
    utm_medium: INTERNAL_UTM_MEDIUM,
    ref: source,
  });
  return `${TICKETS_URL}${separator}${params.toString()}`;
}

// Shared by the landing page's ticket section and the /tickets page so the two never
// drift. Deliberately limited to what EVENT.md actually confirms: no claims about
// catering, swag, or recordings until those are locked in.
export const TICKET_INCLUSIONS: { title: string; description: string; color: string }[] = [
  {
    title: 'All three tracks',
    description: 'Move freely between the Developer, Builder, and Workshops tracks across the whole day.',
    color: 'google-blue',
  },
  {
    title: "The Builder's Space",
    description: 'A dedicated room with mentors and Google Developer Experts on hand to help you build.',
    color: 'google-green',
  },
  {
    title: 'The Builder Showcase',
    description: 'Five-minute demos from fellow attendees, with the room voting on the winner.',
    color: 'google-yellow',
  },
  {
    title: 'The whole community',
    description: 'A full day with the 2,000+ strong GDG Sydney community, in person in Surry Hills.',
    color: 'google-red',
  },
];

export const TICKET_INCLUSION_DOT: Record<string, string> = {
  'google-blue': 'bg-google-blue',
  'google-green': 'bg-google-green',
  'google-yellow': 'bg-google-yellow',
  'google-red': 'bg-google-red',
};
