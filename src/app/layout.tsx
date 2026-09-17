import type { Metadata } from "next";
import "./globals.css";
import TrackingCapture from "@/components/TrackingCapture";
import GoogleAnalytics from "@/components/GoogleAnalytics";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://devfest.gdgsydney.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'DevFest Sydney 2026',
    template: '%s — DevFest Sydney 2026',
  },
  description:
    'GDG Sydney\'s annual community conference, presented by Google. A full day of talks and workshops on Saturday 10 October 2026 at Torrens University, Surry Hills.',
  openGraph: {
    title: 'DevFest Sydney 2026',
    description: 'Build, Secure, Scale: Developers and Builders in the Agentic Era. Sat, 10 October 2026 · Torrens University, Surry Hills.',
    url: siteUrl,
    siteName: 'DevFest Sydney 2026',
    locale: 'en_AU',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DevFest Sydney 2026',
    description: 'Build, Secure, Scale. 10 Oct 2026 · Surry Hills · GDG Sydney.',
  },
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'GDG Sydney',
  url: siteUrl,
  logo: `${siteUrl}/logo.png`,
  sameAs: ['https://gdgsydney.com'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* display=block on purpose: swap would flash the icon ligature names as text. The
            no-page-custom-font rule is written for pages/_document.js and does not apply to
            the App Router root layout, which loads this on every page. */}
        {/* eslint-disable-next-line @next/next/google-font-display, @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:FILL@0..1&display=block"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body>
        <GoogleAnalytics />
        <TrackingCapture />
        {children}
      </body>
    </html>
  );
}
