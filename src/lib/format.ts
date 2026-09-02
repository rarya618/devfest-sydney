// Sydney is the event's timezone, and a deadline is only ever meaningful in it. Without
// this, a server running in UTC (which App Hosting does) formats a close date a day early:
// 2026-08-31T00:00:00+10:00 renders as "30 August" in UTC.
const EVENT_TIME_ZONE = 'Australia/Sydney';

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Includes the time because a deadline is midnight: rendering a bare "31 August" reads as
// "any time on the 31st" when submissions actually stop as that day begins.
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
