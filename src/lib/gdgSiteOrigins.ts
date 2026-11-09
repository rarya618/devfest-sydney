// The origins of gdgsydney.com (the static Astro site), which calls this app from the
// browser: the /speak form posts to /api/submit-meetup-proposal, and pages can ask
// /api/public/status whether something is open. Override with GDG_SITE_ORIGINS
// (comma-separated) when the site moves or a preview domain needs access.
const DEFAULT_GDG_SITE_ORIGINS = ['https://gdgsydney.com', 'https://www.gdgsydney.com', 'http://localhost:4321'];

export function gdgSiteOrigins(): string[] {
  const fromEnv = process.env.GDG_SITE_ORIGINS;
  return fromEnv
    ? fromEnv.split(',').map((origin) => origin.trim()).filter(Boolean)
    : DEFAULT_GDG_SITE_ORIGINS;
}

// CORS headers for a request from the GDG Sydney site, or none for any other origin.
export function gdgSiteCorsHeaders(origin: string | null, methods: string): Record<string, string> {
  if (!origin || !gdgSiteOrigins().includes(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': methods,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}
