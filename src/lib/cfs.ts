// Sydney is the event's timezone, and the deadline is only ever meaningful in it. Without
// this, a server running in UTC (which App Hosting does) formats the close date a day
// early: 2026-08-31T00:00:00+10:00 renders as "30 August" in UTC.
const EVENT_TIME_ZONE = 'Australia/Sydney';

// CFS_OPEN is the master switch and CFS_CLOSE_DATE the deadline: the form is open only
// while both agree. Evaluated per request rather than at module load so the deadline can
// pass without anyone touching the site. Pages calling this are all force-dynamic.
export function isCfsOpen(now: Date = new Date()): boolean {
  if (process.env.CFS_OPEN !== 'true') return false;

  const closeDate = process.env.CFS_CLOSE_DATE;
  if (!closeDate) return true;

  const closesAt = new Date(closeDate);
  // Unlike tickets, a misconfigured date here fails open. Closing the CfS early silently
  // loses submissions we would never know about; leaving it open past the deadline is
  // visible and recoverable.
  if (Number.isNaN(closesAt.getTime())) return true;

  return now.getTime() < closesAt.getTime();
}

// Includes the time because the deadline is midnight: rendering a bare "31 August" reads
// as "any time on the 31st" when submissions actually stop as that day begins.
export function formatCloseDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-AU', {
    day: 'numeric',
    month: 'long',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: EVENT_TIME_ZONE,
  });
}
