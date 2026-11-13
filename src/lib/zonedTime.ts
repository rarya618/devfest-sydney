// Converting between an instant and the wall-clock time an organiser types into a
// <input type="datetime-local"> ("2026-10-10T09:00"), in the event's own time zone rather
// than the browser's or the server's. App Hosting runs in UTC, which is how the CfS close date
// once rendered a day early (2026-08-30), so nothing here leans on the process's zone.
// Browser-safe: the admin form shows existing dates with it, and the server converts with it.

const WALL_TIME_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

function wallTimeParts(instant: Date, timeZone: string): Record<string, number> {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const parts: Record<string, number> = {};
  for (const part of formatter.formatToParts(instant)) {
    if (part.type !== 'literal') parts[part.type] = Number(part.value);
  }
  return parts;
}

// How far the zone is ahead of UTC at that instant, in milliseconds.
function zoneOffsetMs(instant: Date, timeZone: string): number {
  const parts = wallTimeParts(instant, timeZone);
  const asIfUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return asIfUtc - Math.floor(instant.getTime() / 1000) * 1000;
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return true;
  } catch {
    return false;
  }
}

// "2026-10-10T09:00" in Australia/Sydney to "2026-10-09T22:00:00.000Z". Null for anything
// that isn't a real wall time there, including the hour skipped when daylight saving starts.
export function wallTimeToIso(wallTime: string, timeZone: string): string | null {
  const match = WALL_TIME_PATTERN.exec(wallTime.trim());
  if (!match) return null;
  const [, year, month, day, hour, minute] = match.map(Number);
  const asIfUtc = Date.UTC(year, month - 1, day, hour, minute);

  // The offset depends on the instant, which is what we are solving for, so guess with the
  // offset at the naive instant and correct once. Two passes settle every real wall time.
  let instant = asIfUtc - zoneOffsetMs(new Date(asIfUtc), timeZone);
  instant = asIfUtc - zoneOffsetMs(new Date(instant), timeZone);

  if (isoToWallTime(new Date(instant).toISOString(), timeZone) !== wallTime.trim()) return null;
  return new Date(instant).toISOString();
}

// The reverse, for filling the form: "2026-10-09T22:00:00.000Z" to "2026-10-10T09:00".
export function isoToWallTime(iso: string | null, timeZone: string): string {
  if (!iso) return '';
  const instant = new Date(iso);
  if (Number.isNaN(instant.getTime())) return '';
  const parts = wallTimeParts(instant, timeZone);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}`;
}

// "Sat 10 Oct 2026, 9:00 am", in the event's zone, for the admin cards.
export function formatEventDateTime(iso: string | null, timeZone: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone,
  });
}
