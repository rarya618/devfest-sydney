import type { NextConfig } from "next";
import { siteRedirects } from "./src/lib/siteRedirects";

// Pages of the admin's DevFest section, each now at /admin/devfest/<page>. Talk proposals,
// which was /admin itself, is /admin/devfest/proposals; /admin redirects there in the app.
// Analytics moved too, but /admin/analytics is now the GDG-wide page, so it isn't redirected.
const ADMIN_DEVFEST_PAGES = ['volunteers', 'showcase', 'feedback', 'credits', 'speaker-gifts', 'speakers', 'crew'];

// The Firebase project's default Hosting domain, where its Auth handler lives. The project ID
// is fixed (PM.md), so this is a constant rather than an env var.
const FIREBASE_HOSTING_ORIGIN = 'https://devfest-sydney-2026.firebaseapp.com';

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Speaker photo uploads in /admin/devfest/speakers go through a Server Action; the default
      // 1 MB limit would reject most phone photos. Matches PHOTO_MAX_BYTES in speakerActions.ts.
      bodySizeLimit: '6mb',
    },
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'storage.googleapis.com' },
      { protocol: 'https', hostname: '*.firebasestorage.app' },
      // The GDG Sydney logo, served by gdgsydney.com (the emails use the same file), for the
      // speaker portal's header. Only the logo files, not the whole site.
      { protocol: 'https', hostname: 'gdgsydney.com', pathname: '/gdg-logo-*' },
    ],
  },
  // Firebase Auth's sign-in handler, served from this app's own host so Google's account
  // chooser names app.gdgsydney.com rather than the project's default
  // devfest-sydney-2026.firebaseapp.com (issue #11). Production's
  // NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN points here, and the OAuth client lists
  // https://app.gdgsydney.com/__/auth/handler as a redirect URI. /__/firebase carries the
  // init.json the handler may read. Firebase's documented proxy option for sites that aren't
  // on Firebase Hosting; the project ID can't change, so its domain stays behind the proxy.
  async rewrites() {
    return [
      { source: '/__/auth/:path*', destination: `${FIREBASE_HOSTING_ORIGIN}/__/auth/:path*` },
      { source: '/__/firebase/:path*', destination: `${FIREBASE_HOSTING_ORIGIN}/__/firebase/:path*` },
    ];
  },
  async redirects() {
    return [
      // Content pages moving to gdgsydney.com, and this app moving to its own host.
      ...siteRedirects(),
      // The admin's DevFest pages moved under /admin/devfest on 2026-11-14; old bookmarks follow.
      ...ADMIN_DEVFEST_PAGES.map((page) => ({ source: `/admin/${page}`, destination: `/admin/devfest/${page}`, permanent: true })),
    ];
  },
};

export default nextConfig;
