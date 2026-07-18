export const TRACKING_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'ref'] as const;

export function readTrackingParamsFromUrl(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  const tracking: Record<string, string> = {};
  for (const key of TRACKING_PARAMS) {
    const value = params.get(key);
    if (value) tracking[key] = value.slice(0, 200);
  }
  return tracking;
}
