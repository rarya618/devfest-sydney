import type { Metadata } from "next";
import "./globals.css";
import TrackingCapture from "@/components/TrackingCapture";
import GoogleAnalytics from "@/components/GoogleAnalytics";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://devfest.gdgsydney.com';

// The app is GDG Sydney's back office and form handler (app.gdgsydney.com) since stage 3 of the
// plan in PM.md. The few public pages left (privacy, the token pages, feedback, credits) are
// GDG Sydney's; DevFest's own pages live on gdgsydney.com.
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'GDG Sydney',
    template: '%s — GDG Sydney',
  },
  description: 'GDG Sydney organises DevFest Sydney and regular meetups for developers and builders. Find our events at gdgsydney.com.',
  openGraph: {
    title: 'GDG Sydney',
    description: 'DevFest Sydney and regular meetups for developers and builders.',
    url: siteUrl,
    siteName: 'GDG Sydney',
    locale: 'en_AU',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GDG Sydney',
    description: 'DevFest Sydney and regular meetups for developers and builders.',
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
