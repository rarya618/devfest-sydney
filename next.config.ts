import type { NextConfig } from "next";

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
      // Short address printed under the QR code in the Builder's Space, easy to type on a
      // laptop. Temporary (307), so browsers don't cache it if the target ever moves.
      { source: '/guides', destination: '/builders-space/starter-guides', permanent: false },
    ];
  },
};

export default nextConfig;
