import type { PublicScheduleSlot, ScheduleRoom } from '@/lib/types';

// Schedule constants and formatting with no server dependencies, shared by the public
// pages and the admin dashboard (a client component).

// Column order on the grid, left to right. 'all' is not a column: it spans them.
export const SCHEDULE_ROOMS: Exclude<ScheduleRoom, 'all'>[] = ['auditorium', 'developer', 'builder', 'workshops'];

export const SCHEDULE_ROOM_LABELS: Record<ScheduleRoom, { name: string; detail: string }> = {
  auditorium: { name: 'Auditorium', detail: 'Spotlight track' },
  developer: { name: 'Room 3.10', detail: 'Developer track' },
  builder: { name: 'Room 3.08', detail: 'Builder track' },
  workshops: { name: 'Room 3.03', detail: 'Workshops track' },
  all: { name: 'All rooms', detail: '' },
};

// Breaks held everywhere and plenaries (keynotes, the Builder Showcase) take a full-width
// row: nothing runs against them, so the other rooms have nothing to show.
export function spansAllRooms(slot: Pick<PublicScheduleSlot, 'kind' | 'room'>): boolean {
  return slot.room === 'all' || slot.kind === 'plenary';
}

// Left-to-right position of a room's column, or -1 for 'all', which has none.
export function roomColumnIndex(room: ScheduleRoom): number {
  return (SCHEDULE_ROOMS as ScheduleRoom[]).indexOf(room);
}

// "10:50 am", pinned to Sydney: App Hosting runs in UTC (see src/lib/format.ts).
export function formatScheduleTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-AU', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Australia/Sydney',
  });
}
