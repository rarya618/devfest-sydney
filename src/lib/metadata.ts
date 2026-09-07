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
}

// Next does not merge a page's `openGraph` into the root layout's; it replaces it. So
// every page that sets its own title and description would otherwise drop siteName,
// locale and the share image from its card. Building all page metadata here keeps the
// full set. Every page shares the one site-wide image: file-convention OG images do not
// cascade to child routes, so it has to be referenced explicitly here.
export function buildPageMetadata({ title, description, path, ogType = 'website' }: PageMetadataInput): Metadata {
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
      images: [SITE_OG_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [SITE_OG_IMAGE],
    },
  };
}
