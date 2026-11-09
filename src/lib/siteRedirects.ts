import type { NextConfig } from 'next';

// Imported by next.config.ts, so relative imports and types only: the @/ alias isn't
// resolved there.
type Redirect = Awaited<ReturnType<NonNullable<NextConfig['redirects']>>>[number];

// Stage 3 of the "One GDG Sydney Site" plan in PM.md. DevFest's content now lives on
// gdgsydney.com (the static Astro site: /devfest, and the 2026 archive at /devfest/2026),
// and this app is becoming the GDG Sydney back office at app.gdgsydney.com. Both hostnames
// point at this App Hosting backend, so the move is done here, by hostname.

const GDG_SITE = 'https://gdgsydney.com';

// The hosts this app is served on in production. Matching on them keeps localhost and the
// App Hosting preview URL out of it, so the old pages can still be opened in development.
const PRODUCTION_HOSTS = '(devfest|app)\\.gdgsydney\\.com';
const OLD_HOST = 'devfest\\.gdgsydney\\.com';

// A content page and where it lives now. Order matters: Next applies the first match, so
// the one renamed speaker comes before the general speaker rule.
const CONTENT_MOVES: { source: string; destination: string }[] = [
  { source: '/', destination: '/devfest/2026' },
  { source: '/speakers', destination: '/devfest/2026#speakers' },
  // Renamed in /admin/speakers before the event; the Astro snapshot has no previousSlugs.
  { source: '/speakers/saheb-yuvraj-singh', destination: '/devfest/2026/speakers/qasim-tariq' },
  // Slugs match one for one: the snapshot was exported from the same projection.
  { source: '/speakers/:slug', destination: '/devfest/2026/speakers/:slug' },
  { source: '/schedule', destination: '/devfest/2026#schedule' },
  { source: '/partners', destination: '/devfest/2026#partners' },
  { source: '/tickets', destination: '/devfest/2026' },
  { source: '/faq', destination: '/devfest#faq' },
  { source: '/conduct', destination: '/conduct' },
  // The 2026 forms are closed; /devfest has the "get involved" section for the next one.
  { source: '/call-for-speakers', destination: '/devfest' },
  { source: '/volunteer', destination: '/devfest' },
  { source: '/builder-showcase', destination: '/devfest' },
];

// Not moved, and so served by this app on either host until the app move below:
//   /admin, /api, /privacy (covers the data this app holds), /feedback, /credits, the token
//   pages from emails (/speaker/confirm, /speaker/thanks, /volunteer/confirm,
//   /builder-showcase/confirm), and, until they are ported to Astro, /builders-space,
//   /builders-space/starter-guides, /guides and /crew.

export function siteRedirects(): Redirect[] {
  const contentRedirects: Redirect[] = CONTENT_MOVES.map(({ source, destination }) => ({
    source,
    destination: `${GDG_SITE}${destination}`,
    has: [{ type: 'host', value: PRODUCTION_HOSTS }],
    permanent: true,
  }));

  // Everything still served here moves from devfest.gdgsydney.com to the app's own host,
  // query string included, so a confirm or thank-you link in an email already sent keeps
  // working. Off until APP_ORIGIN is set, which must wait until app.gdgsydney.com is
  // connected to the backend: turning it on early would send every one of those links to a
  // host that doesn't answer. /api is never redirected: the /speak form on gdgsydney.com
  // posts across origins, and a CORS preflight can't follow a redirect, so the endpoints
  // answer on both hosts. /_next is left alone for pages a browser already has open.
  const appOrigin = process.env.APP_ORIGIN?.replace(/\/+$/, '');
  const appRedirects: Redirect[] = appOrigin
    ? [
        {
          source: '/:path((?!api/|_next/).*)',
          destination: `${appOrigin}/:path`,
          has: [{ type: 'host', value: OLD_HOST }],
          permanent: true,
        },
      ]
    : [];

  return [...contentRedirects, ...appRedirects];
}
