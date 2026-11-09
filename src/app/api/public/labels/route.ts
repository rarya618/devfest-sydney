import type { NextRequest } from 'next/server';
import { publicJson } from '@/lib/publicApi';
import { EXPERIENCE_LABELS, FORMAT_LABELS, TRACK_HEX_COLORS, TRACK_LABELS, TRACK_ORDER } from '@/lib/submissionLabels';
import { SCHEDULE_ROOM_LABELS, SCHEDULE_ROOMS } from '@/lib/scheduleLabels';
import { TIER_LABELS, TIER_ORDER } from '@/lib/sponsors';

export const dynamic = 'force-dynamic';

// The names and colours the other routes refer to by key ('developer', 'lightning-talk',
// 'auditorium'), so they live in this codebase only and gdgsydney.com never keeps its own
// copy. Lists rather than maps where order matters to the page.
export async function GET(request: NextRequest) {
  return publicJson(request, {
    tracks: TRACK_ORDER.map((track) => ({ key: track, label: TRACK_LABELS[track], colors: TRACK_HEX_COLORS[track] })),
    formats: Object.entries(FORMAT_LABELS).map(([key, label]) => ({ key, label })),
    experienceLevels: Object.entries(EXPERIENCE_LABELS).map(([key, label]) => ({ key, label })),
    // Grid columns left to right; 'all' (registration, lunch) spans them and is listed last.
    rooms: [...SCHEDULE_ROOMS, 'all' as const].map((room) => ({ key: room, ...SCHEDULE_ROOM_LABELS[room] })),
    sponsorTiers: TIER_ORDER.map((tier) => ({ key: tier, label: TIER_LABELS[tier] })),
  });
}
