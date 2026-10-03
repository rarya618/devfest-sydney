// The starter guides on /builders-space/starter-guides, in the order their cards appear.
// These are official guides that already exist elsewhere: each card links out to the
// vendor's own page, so we write no steps and the vendor keeps them current. Add one by
// appending an entry. While the list is empty the page shows an "on their way" message.

export interface StarterGuideLogo {
  // A public Firebase Storage URL (storage.googleapis.com), never a file in the repo. Use
  // the vendor's logo for dark backgrounds, trimmed of transparent padding.
  url: string;
  alt: string;
  // The file's pixel size, which next/image needs to reserve the space.
  width: number;
  height: number;
}

export interface StarterGuide {
  title: string;
  // The vendor's guide. Opens in a new tab.
  href: string;
  // One sentence on what you will make or learn.
  summary: string;
  logo?: StarterGuideLogo;
}

export const STARTER_GUIDES: StarterGuide[] = [
  {
    title: 'Astro starter templates',
    href: 'https://astro.new/latest/',
    summary:
      'Pick one of the official Astro starter templates, from a blog to a portfolio, and open it in your browser with nothing to install.',
    // Astro's "gradient logo on dark" from astro.build/press. Their guidelines ask for the full
    // logo rather than the standalone mark.
    logo: {
      url: 'https://storage.googleapis.com/devfest-sydney-2026.firebasestorage.app/guide-logos/astro.png',
      alt: 'Astro',
      width: 1522,
      height: 400,
    },
  },
  {
    title: 'Gemini API quickstart',
    href: 'https://ai.google.dev/gemini-api/docs/get-started',
    summary:
      'Get an API key from Google AI Studio and make your first Gemini API call in minutes, in Python, JavaScript, Java, Go or REST.',
    // The dark-theme "Gemini API" lockup ai.google.dev itself uses
    // (_static/googledevai/images/gemini-api-logo-dark-theme.svg), rendered and trimmed.
    logo: {
      url: 'https://storage.googleapis.com/devfest-sydney-2026.firebasestorage.app/guide-logos/gemini-api.png',
      alt: 'Gemini API',
      width: 1600,
      height: 259,
    },
  },
];
