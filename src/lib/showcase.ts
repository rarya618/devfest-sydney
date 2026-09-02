// The Builder Showcase is a mid-afternoon session of five-minute attendee demos, so its
// call for demos runs on its own timetable rather than the CfS one: demos can still be
// taken after talks are locked in. Same shape as isCfsOpen() so the two behave alike.
export function isShowcaseOpen(now: Date = new Date()): boolean {
  if (process.env.SHOWCASE_OPEN !== 'true') return false;

  const closeDate = process.env.SHOWCASE_CLOSE_DATE;
  if (!closeDate) return true;

  const closesAt = new Date(closeDate);
  // Fails open, for the same reason the CfS does: closing early silently loses demos we
  // would never know about, while staying open past the deadline is visible and fixable.
  if (Number.isNaN(closesAt.getTime())) return true;

  return now.getTime() < closesAt.getTime();
}
