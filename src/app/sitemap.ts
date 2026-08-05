import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://devfest.gdgsydney.com';
const isCfsOpen = process.env.CFS_OPEN === 'true';
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
      url: `${siteUrl}/call-for-speakers`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: isCfsOpen ? 0.9 : 0.4,
    },
    {
      url: `${siteUrl}/volunteer`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: isVolunteerOpen ? 0.7 : 0.3,
    },
    {
      url: `${siteUrl}/code-of-conduct`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];
}
