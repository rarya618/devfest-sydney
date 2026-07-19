export const TRACKING_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'ref'] as const;

const STORAGE_KEY = 'dfs_tracking';
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

interface StoredTracking {
  capturedAt: number;
  values: Record<string, string>;
}

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

function readStoredTrackingParams(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const stored: StoredTracking = JSON.parse(raw);
    if (Date.now() - stored.capturedAt > MAX_AGE_MS) {
      window.localStorage.removeItem(STORAGE_KEY);
      return {};
    }
    return stored.values;
  } catch {
    return {};
  }
}

// First-touch attribution: only stores UTM params if nothing is already stored, so the
// earliest campaign a visitor arrived from gets credit across visits within MAX_AGE_MS.
export function captureTrackingParams(): void {
  if (typeof window === 'undefined') return;
  if (Object.keys(readStoredTrackingParams()).length > 0) return;
  const fromUrl = readTrackingParamsFromUrl();
  if (Object.keys(fromUrl).length === 0) return;
  try {
    const stored: StoredTracking = { capturedAt: Date.now(), values: fromUrl };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // localStorage unavailable (private browsing, quota) — attribution is best-effort.
  }
}

export function getTrackingParams(): Record<string, string> {
  const stored = readStoredTrackingParams();
  if (Object.keys(stored).length > 0) return stored;
  return readTrackingParamsFromUrl();
}
