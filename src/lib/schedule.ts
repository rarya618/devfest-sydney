import { loadEventDocs } from '@/lib/eventScope';
import { fetchSpeakers, sessionLeadId, toPublicLineup } from '@/lib/speakers';
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
async function fetchScheduleItems(eventId: string): Promise<ScheduleItem[]> {
  const docs = await loadEventDocs('schedule', eventId);
  const items = docs.flatMap((doc): ScheduleItem[] => {
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
        talkIds: Array.isArray(data.talkIds) ? (data.talkIds as string[]) : [],
        startTime: startTime.toDate().toISOString(),
        durationMinutes,
        room,
        isTentative: Boolean(data.isTentative),
      } satisfies ScheduleItem,
    ];
  });
  return items.sort((first, second) => first.startTime.localeCompare(second.startTime));
}

function toPublicSlot(item: ScheduleItem, lineup: { talkId: string; speaker: PublicSpeaker }[]): PublicScheduleSlot {
  const endTime = new Date(new Date(item.startTime).getTime() + item.durationMinutes * 60_000).toISOString();
  // A talk that hasn't been confirmed simply drops out, the same rule /speakers applies. A
  // session left with nobody keeps its placeholder title and shows no speaker. Each talk
  // brings all its presenters, lead first, so adding a co-speaker never needs the schedule
  // reseeding.
  const speakersByTalk = item.talkIds.map((talkId) =>
    lineup
      .filter((entry) => entry.talkId === talkId)
      .map((entry) => entry.speaker)
      .sort((first, second) => Number(Boolean(first.coSpeakerOf)) - Number(Boolean(second.coSpeakerOf)))
  );
  const announcedTalks = speakersByTalk.filter((talkSpeakers) => talkSpeakers.length > 0);
  const speakers = announcedTalks.flat();
  const leadSpeaker = announcedTalks[0]?.[0];
  // One session (a single speaker, or a lead with their co-speakers) is titled by the
  // talk. A block shared by several sessions (lightning talks) keeps its own title, since
  // no one talk names it.
  const isOneSession = speakers.length > 0 && speakers.every((speaker) => sessionLeadId(speaker) === sessionLeadId(leadSpeaker));
  const takesSpeakerTitle = item.kind === 'session' && isOneSession;

  return {
    id: item.id,
    kind: item.kind,
    title: takesSpeakerTitle ? leadSpeaker.talkTitle : item.title,
    talkTitle: item.kind === 'plenary' && isOneSession ? leadSpeaker.talkTitle : null,
    speakers: speakers.map((speaker) => ({ name: speaker.name, slug: speaker.slug, photoUrl: speaker.photoUrl })),
    sessionSlug: isOneSession ? leadSpeaker.slug : null,
    hasUnannouncedSpeaker: announcedTalks.length < item.talkIds.length,
    track: takesSpeakerTitle ? leadSpeaker.track : null,
    format: takesSpeakerTitle ? leadSpeaker.format : null,
    startTime: item.startTime,
    endTime,
    room: item.room,
    isTentative: item.isTentative,
  };
}

// The public schedule, in start order. Throws on a failed read (of the schedule or of the
// speakers it names), for /api/public/schedule, where an empty answer would be published.
export async function loadPublicSchedule(eventId: string): Promise<PublicScheduleSlot[]> {
  const [items, rows] = await Promise.all([fetchScheduleItems(eventId), fetchSpeakers(eventId)]);
  const lineup = toPublicLineup(rows);
  return items.map((item) => toPublicSlot(item, lineup));
}

// The same schedule for /schedule, which shows its "being finalised" state on a failed read.
export async function fetchPublicSchedule(eventId: string): Promise<PublicScheduleSlot[]> {
  try {
    return await loadPublicSchedule(eventId);
  } catch {
    return [];
  }
}

function toSessionTime(item: ScheduleItem): SpeakerSessionTime {
  const endTime = new Date(new Date(item.startTime).getTime() + item.durationMinutes * 60_000).toISOString();
  return { startTime: item.startTime, endTime, room: item.room };
}

// Every scheduled talk's slot, keyed by talk id (stage 4c; by speaker id before), which all
// of a talk's presenters share. Throws on a failed read: callers that act on the answer
// (sending an invite or a cancellation) must not mistake "could not read the schedule" for
// "not on the schedule".
export async function fetchSessionTimesByTalkId(eventId: string): Promise<Record<string, SpeakerSessionTime>> {
  const items = await fetchScheduleItems(eventId);
  const sessionTimes: Record<string, SpeakerSessionTime> = {};
  for (const item of items) {
    for (const talkId of item.talkIds) sessionTimes[talkId] = toSessionTime(item);
  }
  return sessionTimes;
}
