import { TICKETS_URL, areTicketsOpen } from '@/lib/tickets';
import type { PublicSpeaker } from '@/lib/types';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://devfest.gdgsydney.com';

// 10 October 2026 falls after Sydney's daylight-saving switch (first Sunday of October),
// so the offset is +11:00, not the +10:00 the CfS and ticket deadlines use. Times match
// the "Add to calendar" link on the landing page.
export const EVENT_START = '2026-10-10T09:00:00+11:00';
export const EVENT_END = '2026-10-10T17:00:00+11:00';

export const EVENT_LOCATION = {
  '@type': 'Place',
  name: 'Torrens University, Surry Hills',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Shop 1/37 Foveaux St',
    addressLocality: 'Surry Hills',
    addressRegion: 'NSW',
    postalCode: '2010',
    addressCountry: 'AU',
  },
} as const;

// Price and currency are left out until the Humanitix tiers are settled; Google treats
// them as recommended rather than required, and a wrong price is worse than none.
function buildOffers() {
  if (!TICKETS_URL) return undefined;
  const onSaleDate = process.env.TICKETS_ON_SALE_DATE;
  return {
    '@type': 'Offer',
    url: TICKETS_URL,
    availability: areTicketsOpen() ? 'https://schema.org/InStock' : 'https://schema.org/PreOrder',
    ...(onSaleDate ? { validFrom: onSaleDate } : {}),
  };
}

// The full Event block for `/`. Performers are the confirmed speakers, each pointing at
// their own page, which carries the matching `performerIn` in its Person block.
export function buildEventJsonLd(speakers: PublicSpeaker[]) {
  const offers = buildOffers();
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: 'DevFest Sydney 2026',
    description: 'Build, Secure, Scale: Developers and Builders in the Agentic Era.',
    startDate: EVENT_START,
    endDate: EVENT_END,
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    eventStatus: 'https://schema.org/EventScheduled',
    image: [`${siteUrl}/opengraph-image`],
    location: EVENT_LOCATION,
    organizer: {
      '@type': 'Organization',
      name: 'GDG Sydney',
      url: 'https://gdgsydney.com',
    },
    ...(offers ? { offers } : {}),
    ...(speakers.length > 0
      ? {
          performer: speakers.map((speaker) => ({
            '@type': 'Person',
            name: speaker.name,
            url: `${siteUrl}/speakers/${speaker.slug}`,
          })),
        }
      : {}),
    url: siteUrl,
  };
}

// The slimmer Event nested inside each speaker page's Person block.
export function buildEventReference() {
  return {
    '@type': 'Event',
    name: 'DevFest Sydney 2026',
    url: siteUrl,
    startDate: EVENT_START,
    endDate: EVENT_END,
    location: EVENT_LOCATION,
  };
}
