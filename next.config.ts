import type { NextConfig } from "next";
import { siteRedirects } from "./src/lib/siteRedirects";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Speaker photo uploads in /admin/speakers go through a Server Action; the default
      // 1 MB limit would reject most phone photos. Matches PHOTO_MAX_BYTES in speakerActions.ts.
      bodySizeLimit: '6mb',
    },
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'storage.googleapis.com' },
      { protocol: 'https', hostname: '*.firebasestorage.app' },
    ],
  },
  async redirects() {
    return [
      // Content pages moving to gdgsydney.com, and this app moving to its own host.
      ...siteRedirects(),
    ];
  },
};

export default nextConfig;
