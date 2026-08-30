import type { MetadataRoute } from 'next';
import { areTicketsOpen } from '@/lib/tickets';
import { isCfsOpen } from '@/lib/cfs';

// The /tickets priority follows areTicketsOpen(), so don't freeze this at build time.
export const dynamic = 'force-dynamic';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://devfest.gdgsydney.com';
const isVolunteerOpen = process.env.VOLUNTEER_OPEN === 'true';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${siteUrl}/tickets`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: areTicketsOpen() ? 0.9 : 0.4,
    },
    {
      url: `${siteUrl}/call-for-speakers`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: isCfsOpen() ? 0.9 : 0.4,
    },
    {
      url: `${siteUrl}/volunteer`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: isVolunteerOpen ? 0.7 : 0.3,
    },
    {
      url: `${siteUrl}/conduct`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${siteUrl}/faq`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];
}
