import type { NextConfig } from "next";
import { siteRedirects } from "./src/lib/siteRedirects";

// Pages of the admin's DevFest section, each now at /admin/devfest/<page>. Talk proposals,
// which was /admin itself, is /admin/devfest/proposals; /admin redirects there in the app.
const ADMIN_DEVFEST_PAGES = ['volunteers', 'showcase', 'feedback', 'credits', 'speaker-gifts', 'speakers', 'crew', 'analytics'];

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
