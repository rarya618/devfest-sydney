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
