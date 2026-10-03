// The starter guides on /builders-space/starter-guides, in the order they appear. Add a guide
// by appending an entry; the page builds its section nav, anchors and layout from this list.
// While the list is empty the page shows a "being written" message instead.

export interface StarterGuideStep {
  title: string;
  // Plain text. Separate paragraphs with a blank line.
  body: string;
  // Optional snippet, shown in a monospace block under the body (a command, a prompt, code).
  code?: string;
}

export interface StarterGuideLink {
  label: string;
  href: string;
}

export interface StarterGuide {
  // Becomes the section's anchor, e.g. /builders-space/starter-guides#gemini-api.
  slug: string;
  title: string;
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

export const STARTER_GUIDES: StarterGuide[] = [];
