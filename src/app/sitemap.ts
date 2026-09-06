import type { MetadataRoute } from 'next';
import { areTicketsOpen } from '@/lib/tickets';
import { isCfsOpen } from '@/lib/cfs';
import { isShowcaseOpen } from '@/lib/showcase';
import { fetchPublicSpeakers } from '@/lib/speakers';

// The /tickets priority follows areTicketsOpen(), so don't freeze this at build time.
// No lastModified: a date that reads "now" on every request tells crawlers nothing, and
// nothing here records when a page's content actually changed.
export const dynamic = 'force-dynamic';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://devfest.gdgsydney.com';
const isVolunteerOpen = process.env.VOLUNTEER_OPEN === 'true';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const speakers = await fetchPublicSpeakers();

  return [
    {
      url: siteUrl,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${siteUrl}/tickets`,
      changeFrequency: 'daily',
      priority: areTicketsOpen() ? 0.9 : 0.4,
    },
    {
      url: `${siteUrl}/speakers`,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    ...speakers.map((speaker) => ({
      url: `${siteUrl}/speakers/${speaker.slug}`,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
    {
      url: `${siteUrl}/partners`,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${siteUrl}/call-for-speakers`,
      changeFrequency: 'daily',
      priority: isCfsOpen() ? 0.9 : 0.4,
    },
    {
      url: `${siteUrl}/builder-showcase`,
      changeFrequency: 'daily',
      priority: isShowcaseOpen() ? 0.8 : 0.4,
    },
    {
      url: `${siteUrl}/volunteer`,
      changeFrequency: 'daily',
      priority: isVolunteerOpen ? 0.7 : 0.3,
    },
    {
      url: `${siteUrl}/conduct`,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${siteUrl}/privacy`,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${siteUrl}/faq`,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];
}
