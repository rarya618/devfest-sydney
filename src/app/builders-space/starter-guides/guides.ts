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
  {
    title: 'Build apps in Google AI Studio',
    href: 'https://ai.google.dev/gemini-api/docs/aistudio-build-mode',
    summary:
      'Describe the app you want in plain English and let Build mode write and run it for you, with no code and nothing to install.',
    // The AI Studio product mark from gstatic (productlogos/ai_studio, 512dp), trimmed. Mark
    // only: no wordmark lockup is published, and the card title names it.
    logo: {
      url: 'https://storage.googleapis.com/devfest-sydney-2026.firebasestorage.app/guide-logos/ai-studio.png',
      alt: 'Google AI Studio',
      width: 400,
      height: 398,
    },
  },
  {
    title: 'Agent Development Kit',
    href: 'https://adk.dev/get-started/',
    summary:
      "Install Google's Agent Development Kit and build your first AI agent that can use tools, in Python, TypeScript, Go, Java or Kotlin.",
    // The ADK mark adk.dev uses (assets/agent-development-kit.png), trimmed. Mark only, as
    // the site itself shows it.
    logo: {
      url: 'https://storage.googleapis.com/devfest-sydney-2026.firebasestorage.app/guide-logos/adk.png',
      alt: 'Agent Development Kit',
      width: 342,
      height: 382,
    },
  },
  {
    title: 'Your first Flutter app',
    href: 'https://codelabs.developers.google.com/codelabs/flutter-codelab-first',
    summary:
      'Build a small app that generates names and keeps a list of favourites, and learn how Flutter layouts, state and responsive design fit together.',
    // The white horizontal lockup docs.flutter.dev uses
    // (branding/flutter/logo+text/horizontal/white.svg), rendered and trimmed.
    logo: {
      url: 'https://storage.googleapis.com/devfest-sydney-2026.firebasestorage.app/guide-logos/flutter.png',
      alt: 'Flutter',
      width: 1600,
      height: 449,
    },
  },
  {
    title: 'Get to know Firebase for web',
    href: 'https://firebase.google.com/codelabs/firebase-get-to-know-web',
    summary:
      'Build an event RSVP and chat app with Firebase Authentication for sign-in and Cloud Firestore for live data.',
    // The firebase.google.com header lockup with its grey wordmark set to white, matching
    // Firebase's reversed lockup for dark backgrounds. Rendered and trimmed.
    logo: {
      url: 'https://storage.googleapis.com/devfest-sydney-2026.firebasestorage.app/guide-logos/firebase.png',
      alt: 'Firebase',
      width: 1600,
      height: 422,
    },
  },
];
