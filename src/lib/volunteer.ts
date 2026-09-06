// Single source of truth for whether volunteer signups are open, shared by the page, the
// sitemap and /api/submit-volunteer. There is no close date for volunteering, so this is
// the master switch alone, but it is still a function (not a module-level constant) so it
// can grow a deadline the way isCfsOpen() and isShowcaseOpen() did without callers changing.
export function isVolunteerOpen(): boolean {
  return process.env.VOLUNTEER_OPEN === 'true';
}
