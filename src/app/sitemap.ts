import type { MetadataRoute } from 'next';

// Only the public pages this app still serves. DevFest's content pages (the landing page,
// speakers, schedule, partners, tickets, FAQ, conduct and the 2026 forms) moved to
// gdgsydney.com in stage 3 of the plan in PM.md and redirect there (src/lib/siteRedirects.ts),
// so they are listed in that site's sitemap instead. The Builder's Space pages and /crew
// stay here until they are ported to Astro.
// No lastModified: nothing here records when a page's content actually changed.

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://devfest.gdgsydney.com';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${siteUrl}/builders-space`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${siteUrl}/builders-space/starter-guides`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${siteUrl}/crew`, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${siteUrl}/privacy`, changeFrequency: 'yearly', priority: 0.3 },
  ];
}
