import type { Metadata } from 'next';

export const SITE_NAME = 'DevFest Sydney 2026';
export const OG_LOCALE = 'en_AU';
// The site-wide share image is a static file (`src/app/opengraph-image.png`), so Next
// serves it at the .png path; the bare `/opengraph-image` route only existed while it
// was generated from a .tsx and now 404s.
export const SITE_OG_IMAGE = '/opengraph-image.png';

interface PageMetadataInput {
  title: string;
  description: string;
  path: string;
  ogType?: 'website' | 'profile';
  // Only needed where a route has no opengraph-image.tsx of its own: file-convention OG
  // images do not cascade to child routes, so those pages point at the site-wide one.
  images?: string[];
}

// Next does not merge a page's `openGraph` into the root layout's; it replaces it. So
// every page that sets its own title and description would otherwise drop siteName and
// locale from its share card. Building all page metadata here keeps the full set.
export function buildPageMetadata({ title, description, path, ogType = 'website', images }: PageMetadataInput): Metadata {
  const fullTitle = `${title} — ${SITE_NAME}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: fullTitle,
      description,
      url: path,
      type: ogType,
      siteName: SITE_NAME,
      locale: OG_LOCALE,
      ...(images ? { images } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      ...(images ? { images } : {}),
    },
  };
}
