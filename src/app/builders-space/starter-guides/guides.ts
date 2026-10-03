// The starter guides, in the order their cards appear on /builders-space/starter-guides.
// Add a guide by appending an entry: it gets a card there and its own page at
// /builders-space/starter-guides/<slug>. While the list is empty the index shows a
// "being written" message instead.

export interface StarterGuideStep {
  title: string;
  // Plain text. Separate paragraphs with a blank line. Links are written inline as
  // [label](https://...) and open in a new tab; only http(s) addresses become links.
  body: string;
  // Optional snippet, shown in a monospace block under the body (a command, a prompt, code).
  code?: string;
}

export interface StarterGuideLink {
  label: string;
  href: string;
}

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
  // The guide's URL, e.g. /builders-space/starter-guides/astro. Changing it breaks any
  // link or QR code already pointing at the old one.
  slug: string;
  title: string;
  logo?: StarterGuideLogo;
  // One or two sentences on what you will have at the end.
  summary: string;
  // Short metadata, shown in the mono line under the title, e.g. "About 20 minutes".
  timeNeeded?: string;
  // Who it suits, e.g. "No coding needed" or "Some JavaScript".
  audience?: string;
  // What to have ready before step one (an account, an install, a browser).
  prerequisites?: string[];
  steps: StarterGuideStep[];
  // Where to go once the guide is done. Opened in a new tab.
  nextSteps?: StarterGuideLink[];
}

export const STARTER_GUIDES: StarterGuide[] = [
  {
    slug: 'astro',
    title: 'Astro starter templates',
    // Astro's "gradient logo on dark" from astro.build/press. Their guidelines ask for the full
    // logo rather than the standalone mark.
    logo: {
      url: 'https://storage.googleapis.com/devfest-sydney-2026.firebasestorage.app/guide-logos/astro.png',
      alt: 'Astro',
      width: 1522,
      height: 400,
    },
    summary:
      'Spin up a website from one of the official Astro starter templates, either in the browser or on your own machine, and have it running in a few minutes.',
    timeNeeded: 'About 15 minutes',
    audience: 'Some HTML helps',
    prerequisites: [
      'A laptop with a modern browser',
      'Node.js installed, only if you want to run the project on your own machine',
    ],
    steps: [
      {
        title: 'Open astro.new',
        body: 'Go to [astro.new/latest](https://astro.new/latest/). It lists six starter templates: Just the Basics, Blog, Starlight (documentation sites), Starlog, Portfolio and Empty Project.\n\nIf you are new to Astro, start with Just the Basics.',
      },
      {
        title: 'Preview a template',
        body: 'Each template has a live preview and a link to its source on GitHub. Have a look at a couple before you pick one.',
      },
      {
        title: 'Open it in the browser',
        body: 'The quickest route: choose Open in StackBlitz or Open in CodeSandbox on the template you picked. The project opens in an online editor with nothing to install, and the preview updates as you edit.',
      },
      {
        title: 'Or run it on your laptop',
        body: 'If you would rather work locally, copy the template\'s command from the page and run it in a terminal. Swap basics for blog, starlight, starlog, portfolio or minimal to use another template. The installer asks where to put the project; then start the dev server from inside that folder.',
        code: 'npm create astro -- --template basics\ncd your-project-folder\nnpm run dev',
      },
      {
        title: 'Make it yours',
        body: 'Change some text on the home page and watch the preview update. From there, add a page, swap the styles, or build out the template into something you want to keep.',
      },
    ],
    nextSteps: [
      { label: 'Astro starter templates', href: 'https://astro.new/latest/' },
      { label: 'Astro docs: getting started', href: 'https://docs.astro.build/en/getting-started/' },
      { label: 'Astro themes', href: 'https://astro.build/themes/' },
      { label: 'Astro Discord', href: 'https://astro.build/chat' },
    ],
  },
];

export function findStarterGuide(slug: string): StarterGuide | undefined {
  return STARTER_GUIDES.find((guide) => guide.slug === slug);
}
