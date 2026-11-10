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
const APP_HOST = 'app\\.gdgsydney\\.com';

// A content page and where it lives now. Order matters: Next applies the first match, so
// the one renamed speaker comes before the general speaker rule.
const CONTENT_MOVES: { source: string; destination: string }[] = [
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
  // Ported to gdgsydney.com on 2026-11-10. The starter guides became a year-round page at
  // /guides (so the short link printed in the room still works), the room itself a section
  // of the archive, and /crew the archive's organisers and volunteers.
  { source: '/builders-space/starter-guides', destination: '/guides' },
  { source: '/builders-space', destination: '/devfest/2026#builders-space' },
  { source: '/guides', destination: '/guides' },
  { source: '/crew', destination: '/devfest/2026#crew' },
];

// Not moved, and so served by this app: /admin, /api, /privacy (covers the data this app
//   holds), /feedback, /credits, and the token pages from emails (/speaker/confirm,
//   /speaker/thanks, /volunteer/confirm, /builder-showcase/confirm).

// Which hostname a request was made to. Behind App Hosting's CDN the request reaches Next
// with Host set to the backend's own address and the visitor's hostname in
// X-Forwarded-Host (the 2026-11-10 deploy matched on Host alone, and production served
// every page as before). A `has` list is all-of, so each rule is emitted once per header
// to mean either: X-Forwarded-Host in production, Host when nothing is in front.
function forEachHostHeader(hostPattern: string, rule: Omit<Redirect, 'has'>): Redirect[] {
  return [
    { ...rule, has: [{ type: 'header', key: 'x-forwarded-host', value: hostPattern }] },
    { ...rule, has: [{ type: 'host', value: hostPattern }] },
  ] as Redirect[];
}

export function siteRedirects(): Redirect[] {
  const contentRedirects: Redirect[] = CONTENT_MOVES.flatMap(({ source, destination }) =>
    forEachHostHeader(PRODUCTION_HOSTS, {
      source,
      destination: `${GDG_SITE}${destination}`,
      permanent: true,
    })
  );

  // Everything still served here moves from devfest.gdgsydney.com to the app's own host,
  // query string included, so a confirm or thank-you link in an email already sent keeps
  // working. Off until APP_ORIGIN is set, which must wait until app.gdgsydney.com is
  // connected to the backend: turning it on early would send every one of those links to a
  // host that doesn't answer. /api is never redirected: the /speak form on gdgsydney.com
  // posts across origins, and a CORS preflight can't follow a redirect, so the endpoints
  // answer on both hosts. /_next is left alone for pages a browser already has open.
  const appOrigin = process.env.APP_ORIGIN?.replace(/\/+$/, '');
  const appRedirects: Redirect[] = appOrigin
    ? forEachHostHeader(OLD_HOST, {
        source: '/:path((?!api/|_next/).*)',
        destination: `${appOrigin}/:path`,
        permanent: true,
      })
    : [];

  // The root differs by host. The old DevFest site's home page is the 2026 archive. The
  // app's home is the admin (signed-out visitors land on its sign-in page), as a temporary
  // 307 so it can become a real landing page later: a permanent one would stay cached in
  // browsers. Before 2026-11-10 the app host sent / to the archive with a 308 too, so a
  // browser that visited it then may keep doing so until its cache is cleared.
  const rootRedirects: Redirect[] = [
    ...forEachHostHeader(OLD_HOST, { source: '/', destination: `${GDG_SITE}/devfest/2026`, permanent: true }),
    ...forEachHostHeader(APP_HOST, { source: '/', destination: '/admin', permanent: false }),
  ];

  return [...rootRedirects, ...contentRedirects, ...appRedirects];
}
