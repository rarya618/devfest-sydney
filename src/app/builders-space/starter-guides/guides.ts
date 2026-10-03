// The starter guides on /builders-space/starter-guides. Cards appear under their group, in
// list order within it.
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

// Whether finishing the guide means writing code. Shown as a tag on each card, beside the
// `needs` tag: together they decide whether someone can pick a guide up in the room. No
// difficulty level, since every guide here is a starter.
export type StarterGuideCoding = 'no-code' | 'coding';

export const STARTER_GUIDE_CODING_LABELS: Record<StarterGuideCoding, string> = {
  'no-code': 'No code',
  coding: 'Coding',
};

// The sections the page is split into, in the order they appear. Each takes a brand colour
// for its cards' top border: green and blue match the Builder and Developer tracks.
export type StarterGuideGroup = 'prototype' | 'ai' | 'web' | 'mobile';

export interface StarterGuideGroupInfo {
  id: StarterGuideGroup;
  label: string;
  // Full class names so Tailwind generates them: the card's top border, and the dot beside the
  // group in the sidebar.
  borderClass: string;
  dotClass: string;
}

export const STARTER_GUIDE_GROUPS: StarterGuideGroupInfo[] = [
  { id: 'prototype', label: 'Prototype and automate', borderClass: 'border-t-google-green', dotClass: 'bg-google-green' },
  { id: 'ai', label: 'Build with Gemini and agents', borderClass: 'border-t-google-blue', dotClass: 'bg-google-blue' },
  { id: 'web', label: 'Web and cloud', borderClass: 'border-t-google-yellow', dotClass: 'bg-google-yellow' },
  { id: 'mobile', label: 'Mobile', borderClass: 'border-t-google-red', dotClass: 'bg-google-red' },
];

// The setup tag: "Needs <needs>", else "<optional> optional", else "No install needed".
export function starterGuideSetupLabel(guide: StarterGuide): string {
  if (guide.needs) return `Needs ${guide.needs}`;
  if (guide.optional) return `${guide.optional} optional`;
  return 'No install needed';
}

export interface StarterGuide {
  title: string;
  // The vendor's guide. Opens in a new tab.
  href: string;
  // One sentence on what you will make or learn.
  summary: string;
  group: StarterGuideGroup;
  coding: StarterGuideCoding;
  // What has to be on the laptop before starting, named rather than a bare "install required",
  // since "npm or pip" and "Android Studio" are very different asks on venue Wi-Fi. Leave it
  // out when the guide can be done in a browser, and name the local route in `optional` instead.
  needs?: string;
  // A tool for an optional local route, when the guide also works in a browser with nothing
  // installed. Astro's templates open in StackBlitz, but can also be started with npm.
  optional?: string;
  logo?: StarterGuideLogo;
}

export const STARTER_GUIDES: StarterGuide[] = [
  {
    title: 'Astro starter templates',
    href: 'https://astro.new/latest/',
    summary:
      'Pick one of the official Astro starter templates, from a blog to a portfolio, and open it in your browser with nothing to install, or start it locally with npm.',
    group: 'web',
    coding: 'coding',
    optional: 'npm',
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
    group: 'ai',
    coding: 'coding',
    needs: 'npm or pip',
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
    group: 'prototype',
    coding: 'no-code',
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
    group: 'ai',
    coding: 'coding',
    needs: 'npm or pip',
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
    group: 'mobile',
    coding: 'coding',
    needs: 'Flutter SDK',
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
    group: 'web',
    coding: 'coding',
    // The firebase.google.com header lockup with its grey wordmark set to white, matching
    // Firebase's reversed lockup for dark backgrounds. Rendered and trimmed.
    logo: {
      url: 'https://storage.googleapis.com/devfest-sydney-2026.firebasestorage.app/guide-logos/firebase.png',
      alt: 'Firebase',
      width: 1600,
      height: 422,
    },
  },
  {
    title: 'Create your first Android app',
    href: 'https://developer.android.com/codelabs/basic-android-kotlin-compose-first-app',
    summary:
      'Make a personalised greeting app in Android Studio with Kotlin and Jetpack Compose, and preview it as you change it.',
    group: 'mobile',
    coding: 'coding',
    needs: 'Android Studio',
    // The Android head from developer.android.com (static/images/logos/android.svg), rendered
    // and trimmed. The site's own "Developers" lockup has dark text and is only 274px wide.
    logo: {
      url: 'https://storage.googleapis.com/devfest-sydney-2026.firebasestorage.app/guide-logos/android.png',
      alt: 'Android',
      width: 800,
      height: 475,
    },
  },
  {
    title: 'Deploy to Cloud Run',
    href: 'https://docs.cloud.google.com/run/docs/quickstarts/deploy-container',
    summary:
      'Put a sample container live on its own public URL with Cloud Run. Needs a Google Cloud project with billing turned on.',
    group: 'web',
    coding: 'no-code',
    // The Cloud Run product icon from the Cloud docs (clouddocs/images/icons/products/run-color.svg),
    // rendered and trimmed.
    logo: {
      url: 'https://storage.googleapis.com/devfest-sydney-2026.firebasestorage.app/guide-logos/cloud-run.png',
      alt: 'Cloud Run',
      width: 512,
      height: 512,
    },
  },
  {
    title: 'Send emails with Next.js',
    href: 'https://resend.com/docs/send-with-nextjs',
    summary:
      'Send your first email to yourself from a Next.js app with Resend. The test sender works straight after sign-up, so there is no domain to set up.',
    group: 'web',
    coding: 'coding',
    needs: 'npm',
    // The white wordmark from Resend's brand pack (cdn.resend.com/brand/resend-brand-assets.zip),
    // rendered and trimmed.
    logo: {
      url: 'https://storage.googleapis.com/devfest-sydney-2026.firebasestorage.app/guide-logos/resend.png',
      alt: 'Resend',
      width: 1600,
      height: 340,
    },
  },
  {
    title: 'React Email',
    href: 'https://react.email/docs/getting-started/automatic-setup',
    summary:
      'Design emails as React components with a live preview in your browser, starting from a project of ready-made templates.',
    group: 'web',
    coding: 'coding',
    needs: 'npm',
    // The app icon react.email uses (brand/logo.png), trimmed. Mark only, as the site shows it.
    logo: {
      url: 'https://storage.googleapis.com/devfest-sydney-2026.firebasestorage.app/guide-logos/react-email.png',
      alt: 'React Email',
      width: 359,
      height: 359,
    },
  },
  {
    title: 'Gemini CLI',
    href: 'https://geminicli.com/docs/get-started/',
    summary:
      "Install Google's open-source AI agent for the terminal, sign in with your Google account, and have it read, write and run code in a project of yours.",
    group: 'ai',
    coding: 'coding',
    needs: 'npm',
    // The app icon geminicli.com uses (icon.png), trimmed and downsized.
    logo: {
      url: 'https://storage.googleapis.com/devfest-sydney-2026.firebasestorage.app/guide-logos/gemini-cli.png',
      alt: 'Gemini CLI',
      width: 512,
      height: 512,
    },
  },
  {
    title: 'Get started with Gemini in Colab',
    href: 'https://colab.research.google.com/github/google-gemini/cookbook/blob/main/quickstarts/Get_started.ipynb',
    summary:
      "Run the Gemini API cookbook's starter notebook in Google Colab and try your first prompts in Python, all in the browser.",
    group: 'ai',
    coding: 'coding',
    // The Colab mark from colab.research.google.com (img/colab_favicon_256px.png), trimmed.
    logo: {
      url: 'https://storage.googleapis.com/devfest-sydney-2026.firebasestorage.app/guide-logos/colab.png',
      alt: 'Google Colab',
      width: 226,
      height: 132,
    },
  },
  {
    title: 'Design app screens with Stitch',
    href: 'https://stitch.withgoogle.com/',
    summary:
      'Describe an app or upload a sketch and Stitch, from Google Labs, designs the screens for you, ready to take into Figma or code.',
    group: 'prototype',
    coding: 'no-code',
    // Stitch's 512px app icon (gstatic.com/labs-code/stitch/favicon-512x512.png). Links to the
    // tool itself: Stitch has no separate starter guide.
    logo: {
      url: 'https://storage.googleapis.com/devfest-sydney-2026.firebasestorage.app/guide-logos/stitch.png',
      alt: 'Stitch',
      width: 512,
      height: 512,
    },
  },
  {
    title: 'Get started with Genkit',
    href: 'https://genkit.dev/docs/js/get-started/',
    summary:
      "Add AI features to a JavaScript app with Genkit, Google's open-source framework from the Firebase team. Pick the guide for your framework.",
    group: 'ai',
    coding: 'coding',
    needs: 'npm',
    // The horizontal knockout lockup genkit.dev uses on dark (genkit_logo_horizontal_knockout), trimmed.
    logo: {
      url: 'https://storage.googleapis.com/devfest-sydney-2026.firebasestorage.app/guide-logos/genkit.png',
      alt: 'Genkit',
      width: 2352,
      height: 712,
    },
  },
  {
    title: 'Build an AI mini app with Opal',
    href: 'https://developers.google.com/opal/quickstart',
    summary:
      'Remix a demo from the Opal gallery into your own AI mini app, built by describing each step in plain English.',
    group: 'prototype',
    coding: 'no-code',
    // Opal publishes no logo file, so this is the wordmark cut from its share card
    // (opal.google/images/share-card-prod.png) and set to white on transparent.
    logo: {
      url: 'https://storage.googleapis.com/devfest-sydney-2026.firebasestorage.app/guide-logos/opal.png',
      alt: 'Opal',
      width: 273,
      height: 121,
    },
  },
  {
    title: 'Automate Google Sheets with Apps Script',
    href: 'https://developers.google.com/apps-script/quickstart/custom-functions',
    group: 'prototype',
    summary:
      'Paste a short script into a Google Sheet to make your own spreadsheet function, then build from there to automate Sheets, Docs and Gmail.',
    coding: 'coding',
    // The Apps Script product logo from gstatic (productlogos/apps_script, 512dp), trimmed.
    logo: {
      url: 'https://storage.googleapis.com/devfest-sydney-2026.firebasestorage.app/guide-logos/apps-script.png',
      alt: 'Apps Script',
      width: 456,
      height: 360,
    },
  },
  {
    title: 'Hand a task to Jules',
    href: 'https://jules.google/docs',
    group: 'ai',
    summary:
      "Connect a GitHub repo and give Google's coding agent a task, like fixing a bug or writing docs. It works in the cloud and comes back with a change for you to review.",
    coding: 'coding',
    // The light purple octopus from the Jules docs (docs/_astro/logo), the one that reads on a
    // dark background. Rendered and trimmed.
    logo: {
      url: 'https://storage.googleapis.com/devfest-sydney-2026.firebasestorage.app/guide-logos/jules.png',
      alt: 'Jules',
      width: 486,
      height: 512,
    },
  },
  {
    title: 'Add Gemini to your app with Firebase AI Logic',
    href: 'https://firebase.google.com/docs/ai-logic/get-started',
    group: 'mobile',
    summary:
      'Call Gemini straight from an Android, iOS, Flutter or web app with the Firebase AI Logic SDKs, on the no-cost Gemini Developer API.',
    coding: 'coding',
    needs: 'Android Studio, Xcode or Flutter SDK',
    // Same Firebase lockup as the Firebase for web card.
    logo: {
      url: 'https://storage.googleapis.com/devfest-sydney-2026.firebasestorage.app/guide-logos/firebase.png',
      alt: 'Firebase',
      width: 1600,
      height: 422,
    },
  },
  {
    title: 'Take a payment with Stripe Checkout',
    href: 'https://docs.stripe.com/checkout/quickstart',
    group: 'web',
    summary:
      "Add a checkout button that sends people to a payment page Stripe hosts for you, then try it with Stripe's test card numbers so no real money moves.",
    coding: 'coding',
    needs: 'npm or pip',
    // The white wordmark from Stripe's logo kit (stripe.com/newsroom/brand-assets), rendered and trimmed.
    logo: {
      url: 'https://storage.googleapis.com/devfest-sydney-2026.firebasestorage.app/guide-logos/stripe.png',
      alt: 'Stripe',
      width: 1200,
      height: 499,
    },
  },
  {
    title: 'Sell something with a Stripe payment link',
    href: 'https://docs.stripe.com/payment-links/create',
    group: 'prototype',
    summary:
      'Make a shareable payment page for a product, a subscription or pay-what-you-want from the Stripe Dashboard, with no website or code needed.',
    coding: 'no-code',
    logo: {
      url: 'https://storage.googleapis.com/devfest-sydney-2026.firebasestorage.app/guide-logos/stripe.png',
      alt: 'Stripe',
      width: 1200,
      height: 499,
    },
  },
  {
    title: 'Make your first Asana API request',
    href: 'https://developers.asana.com/docs/quick-start',
    group: 'prototype',
    summary:
      "Create a personal access token and use curl to read, create and update tasks in your Asana workspace, the first step to automating your team's busywork.",
    coding: 'coding',
    // Asana is a sponsor, so this reuses their sponsor logo (sponsor-logos/asana.png): the wordmark set
    // to white with the coral dots unchanged, Asana's reversed lockup for dark backgrounds.
    logo: {
      url: 'https://storage.googleapis.com/devfest-sydney-2026.firebasestorage.app/sponsor-logos/asana.png',
      alt: 'Asana',
      width: 1600,
      height: 317,
    },
  },
];
