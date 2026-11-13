// The speaker portal's own button and section styles. It matches gdgsydney.com, where speakers
// come from (Black 02 page, pill buttons), rather than the DevFest pages: the portal is for
// every GDG Sydney event.

export const primaryButton =
  'inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-google-blue-deep text-white text-base font-bold transition-opacity hover:opacity-85 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-google-blue focus-visible:ring-offset-2 focus-visible:ring-offset-black-02';

// The same, sized to sit beside a secondaryButton in a list row.
export const primaryButtonSmall =
  'inline-flex items-center justify-center gap-2 px-5 py-2 rounded-full bg-google-blue-deep text-white text-sm font-bold transition-opacity hover:opacity-85 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-google-blue focus-visible:ring-offset-2 focus-visible:ring-offset-black-02';

export const secondaryButton =
  'inline-flex items-center justify-center gap-2 px-5 py-2 rounded-full border border-white/35 text-off-white text-sm font-bold transition-colors hover:border-white disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-google-blue';

export const dangerOutlineButton =
  'inline-flex items-center justify-center gap-2 px-5 py-2 rounded-full border border-white/35 text-google-red-light text-sm font-bold transition-colors hover:border-white disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-google-blue';

export const dangerButton =
  'inline-flex items-center justify-center gap-2 px-5 py-2 rounded-full bg-google-red-deep text-white text-sm font-bold transition-opacity hover:opacity-85 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-google-red-light';

export const pageHeading = 'text-[clamp(2.25rem,6vw,3.5rem)] font-bold leading-[1.02] tracking-[-0.02em] text-off-white';

export const sectionHeading = 'text-xl font-bold text-off-white';

export const backLink =
  'inline-flex items-center gap-1.5 text-sm text-white/65 hover:text-off-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-google-blue rounded';
