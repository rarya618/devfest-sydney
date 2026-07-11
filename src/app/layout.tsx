import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://devfest.gdgsydney.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'DevFest Sydney 2026',
    template: '%s — DevFest Sydney 2026',
  },
  description:
    'DevFest Sydney is an annual community conference organised by GDG Sydney, presented by Google. Join developers, designers, and founders in Sydney CBD for a full day of talks, workshops, and challenges.',
  openGraph: {
    title: 'DevFest Sydney 2026',
    description: 'Build, Secure, Scale: Developers and Builders in the Agentic Era. Sydney CBD.',
    url: siteUrl,
    siteName: 'DevFest Sydney 2026',
    locale: 'en_AU',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DevFest Sydney 2026',
    description: 'Build, Secure, Scale. Sydney CBD · GDG Sydney.',
  },
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto+Mono:ital,wght@0,400;0,700;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
