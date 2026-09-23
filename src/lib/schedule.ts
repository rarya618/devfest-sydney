import { adminDb } from '@/lib/firebase-admin';
import { fetchPublicSpeakers } from '@/lib/speakers';
import type { PublicScheduleSlot, PublicSpeaker, ScheduleItem, ScheduleKind, ScheduleRoom, SpeakerSessionTime } from '@/lib/types';
import { SCHEDULE_ROOMS } from '@/lib/scheduleLabels';

// The browser-safe half (room labels, time formatting, grid helpers) lives in
// scheduleLabels.ts so client components can use it without pulling in the Admin SDK.
export { SCHEDULE_ROOMS, SCHEDULE_ROOM_LABELS, spansAllRooms, roomColumnIndex, formatScheduleTime } from '@/lib/scheduleLabels';
import type { Timestamp } from 'firebase-admin/firestore';

const SCHEDULE_KINDS: ScheduleKind[] = ['session', 'break', 'plenary'];
const SCHEDULE_ROOM_VALUES: ScheduleRoom[] = [...SCHEDULE_ROOMS, 'all'];

// Documents are written by scripts/seed-schedule.mjs through the Admin SDK, so the rules'
// validation never ran on them; anything malformed is skipped rather than rendered.
async function fetchScheduleItems(): Promise<ScheduleItem[]> {
  const snapshot = await adminDb.collection('schedule').orderBy('startTime').get();
  return snapshot.docs.flatMap((doc) => {
    const data = doc.data();
    const startTime = data.startTime as Timestamp | undefined;
    const kind = data.kind as ScheduleKind;
    const room = data.room as ScheduleRoom;
    const durationMinutes = Number(data.durationMinutes);
    if (!startTime || !SCHEDULE_KINDS.includes(kind) || !SCHEDULE_ROOM_VALUES.includes(room) || !(durationMinutes > 0)) {
      return [];
    }
    return [
      {
        id: doc.id,
        kind,
        title: data.title ?? '',
        speakerIds: Array.isArray(data.speakerIds) ? (data.speakerIds as string[]) : [],
        startTime: startTime.toDate().toISOString(),
        durationMinutes,
        room,
        isTentative: Boolean(data.isTentative),
      } satisfies ScheduleItem,
    ];
  });
}

function toPublicSlot(item: ScheduleItem, confirmedSpeakersById: Map<string, PublicSpeaker>): PublicScheduleSlot {
  const endTime = new Date(new Date(item.startTime).getTime() + item.durationMinutes * 60_000).toISOString();
  // An unconfirmed speaker simply drops out, the same rule /speakers applies. A session
  // left with nobody keeps its placeholder title and shows no speaker.
  const speakers = item.speakerIds
    .map((speakerId) => confirmedSpeakersById.get(speakerId))
    .filter((speaker): speaker is PublicSpeaker => Boolean(speaker));
  const leadSpeaker = speakers[0];
  // A single speaker's talk is titled by the talk. A block shared by several (lightning
  // talks) keeps its own title, since no one talk names it.
  const takesSpeakerTitle = item.kind === 'session' && speakers.length === 1;

  return {
    id: item.id,
    kind: item.kind,
    title: takesSpeakerTitle ? leadSpeaker.talkTitle : item.title,
    speakers: speakers.map((speaker) => ({ name: speaker.name, slug: speaker.slug, photoUrl: speaker.photoUrl })),
    hasUnannouncedSpeaker: speakers.length < item.speakerIds.length,
    track: takesSpeakerTitle ? leadSpeaker.track : null,
    format: takesSpeakerTitle ? leadSpeaker.format : null,
    startTime: item.startTime,
    endTime,
    room: item.room,
    isTentative: item.isTentative,
  };
}

// The public schedule, in start order. Returns an empty list rather than throwing so the
// page can show its "being finalised" state.
export async function fetchPublicSchedule(): Promise<PublicScheduleSlot[]> {
  try {
    const [items, speakers] = await Promise.all([fetchScheduleItems(), fetchPublicSpeakers()]);
    const confirmedSpeakersById = new Map(speakers.map((speaker) => [speaker.id, speaker]));
    return items.map((item) => toPublicSlot(item, confirmedSpeakersById));
  } catch {
    return [];
  }
}

function toSessionTime(item: ScheduleItem): SpeakerSessionTime {
  const endTime = new Date(new Date(item.startTime).getTime() + item.durationMinutes * 60_000).toISOString();
  return { startTime: item.startTime, endTime, room: item.room };
}

// Every scheduled speaker's slot, keyed by speaker id. Throws on a failed read: callers
// that act on the answer (sending an invite or a cancellation) must not mistake "could
// not read the schedule" for "not on the schedule".
export async function fetchSessionTimesBySpeakerId(): Promise<Record<string, SpeakerSessionTime>> {
  const items = await fetchScheduleItems();
  const sessionTimes: Record<string, SpeakerSessionTime> = {};
  for (const item of items) {
    for (const speakerId of item.speakerIds) sessionTimes[speakerId] = toSessionTime(item);
  }
  return sessionTimes;
}

// A speaker's slot, or null when they are not on the schedule yet (or the read fails, so
// the page falls back to "times are announced with the schedule" rather than erroring).
// Only called for a confirmed speaker, since their page does not exist otherwise.
export async function fetchSpeakerSessionTime(speakerId: string): Promise<SpeakerSessionTime | null> {
  try {
    return (await fetchSessionTimesBySpeakerId())[speakerId] ?? null;
  } catch {
    return null;
  }
}
