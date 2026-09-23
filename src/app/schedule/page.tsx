import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/metadata';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Reveal from '@/components/Reveal';
import { areTicketsOpen } from '@/lib/tickets';
import { isCfsOpen } from '@/lib/cfs';
import { fetchPublicSchedule, formatScheduleTime, SCHEDULE_ROOMS, SCHEDULE_ROOM_LABELS, roomColumnIndex, spansAllRooms } from '@/lib/schedule';
import { FORMAT_LABELS, TRACK_DOT_COLORS, TRACK_LABELS } from '@/lib/submissionLabels';
import type { PublicScheduleSlot, Track } from '@/lib/types';

// Slots pick up speakers as they confirm, and the navbar ticket CTA follows the on-sale
// date, so this page is rendered per request rather than prerendered: see `src/app/page.tsx`.
export const dynamic = 'force-dynamic';

const title = 'Schedule';
const description =
  'The DevFest Sydney 2026 schedule: talks and workshops across four rooms on Saturday 10 October at Torrens University, Surry Hills.';

export const metadata: Metadata = buildPageMetadata({ title, description, path: '/schedule' });

const LEGEND_TRACKS: Track[] = ['spotlight', 'developer', 'builder', 'workshop'];

function TentativeChip() {
  return (
    <span className="inline-flex items-center rounded px-1.5 py-0.5 font-mono text-[11px] font-bold text-white/70 border border-white/25">
      TBC
    </span>
  );
}

function TimeRange({ slot }: { slot: PublicScheduleSlot }) {
  return (
    <p className="font-mono text-xs text-white/55">
      <time dateTime={slot.startTime}>{formatScheduleTime(slot.startTime)}</time>
      {' to '}
      <time dateTime={slot.endTime}>{formatScheduleTime(slot.endTime)}</time>
    </p>
  );
}

// A talk or workshop in one room. showRoom is for the mobile list, where there is no
// column heading to say which room it is in.
function SessionCard({ slot, showRoom }: { slot: PublicScheduleSlot; showRoom: boolean }) {
  const leadSpeaker = slot.speakers[0];
  const room = SCHEDULE_ROOM_LABELS[slot.room];

  return (
    <article className="h-full bg-surface rounded-xl p-4 flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        {slot.track && (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-white/70">
            <span className={`w-2 h-2 rounded-full ${TRACK_DOT_COLORS[slot.track]}`} aria-hidden="true" />
            {TRACK_LABELS[slot.track]}
            {slot.format && <span className="text-white/55 font-normal">· {FORMAT_LABELS[slot.format]}</span>}
          </span>
        )}
        {slot.isTentative && <TentativeChip />}
      </div>

      <h3 className="text-base font-bold text-white leading-snug">
        {leadSpeaker && slot.speakers.length === 1 ? (
          <Link
            href={`/speakers/${leadSpeaker.slug}`}
            aria-label={`${slot.title}, by ${leadSpeaker.name}`}
            className="hover:text-white/80 transition-colors"
          >
            {slot.title}
          </Link>
        ) : (
          slot.title
        )}
      </h3>

      <div className="mt-auto space-y-2">
        {slot.speakers.length > 0 ? (
          <ul className="space-y-2">
            {slot.speakers.map((speaker) => (
              <li key={speaker.slug} className="flex items-center gap-2">
                {/* 20px is too small for legible initials, so a speaker without a photo gets a plain
                    circle instead. */}
                <span className="w-5 h-5 rounded-full overflow-hidden bg-white/10 shrink-0" aria-hidden="true">
                  {speaker.photoUrl && (
                    <Image src={speaker.photoUrl} alt="" width={20} height={20} className="w-full h-full object-cover" />
                  )}
                </span>
                <span className="text-sm font-medium text-white/85 leading-snug">{speaker.name}</span>
              </li>
            ))}
          </ul>
        ) : (
          slot.hasUnannouncedSpeaker && <p className="text-sm text-white/55">Speaker to be announced</p>
        )}
        <TimeRange slot={slot} />
        {showRoom && (
          <p className="text-xs text-white/55">
            {room.name} · {room.detail}
          </p>
        )}
      </div>
    </article>
  );
}

// Registration, lunch, the keynotes: one row across every room. A plenary also says which
// room it is in, since the row itself no longer does.
function SharedBlock({ slot }: { slot: PublicScheduleSlot }) {
  const isPlenary = slot.kind === 'plenary';
  return (
    <article
      className={`h-full rounded-xl px-5 py-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-1 ${
        isPlenary ? 'bg-surface border border-white/15' : 'bg-white/[0.03]'
      }`}
    >
      <div className="flex items-center gap-3">
        <h3 className={`font-bold ${isPlenary ? 'text-lg text-white' : 'text-base text-white/75'}`}>{slot.title}</h3>
        {slot.isTentative && <TentativeChip />}
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        {slot.room !== 'all' && <p className="text-sm font-bold text-white/70">{SCHEDULE_ROOM_LABELS[slot.room].name}</p>}
        <TimeRange slot={slot} />
      </div>
    </article>
  );
}

// Desktop: a room-by-time grid. Row lines are every distinct start and end time, so a slot
// that runs across two of its neighbours (the 90-minute workshop, the 14:45 talks) spans
// exactly the rows it overlaps, the way the organisers' sheet lays it out.
function ScheduleGrid({ slots }: { slots: PublicScheduleSlot[] }) {
  const boundaries = [...new Set(slots.flatMap((slot) => [slot.startTime, slot.endTime]))].sort();
  const startTimes = new Set(slots.map((slot) => slot.startTime));
  // Row 1 is the room headings, so boundary n sits on grid line n + 2.
  const lineFor = (iso: string) => boundaries.indexOf(iso) + 2;

  return (
    <div className="hidden lg:grid grid-cols-[5.5rem_repeat(4,minmax(0,1fr))] gap-3">
      <div aria-hidden="true" />
      {SCHEDULE_ROOMS.map((room) => (
        <div key={room} className="pb-2 border-b border-white/15">
          <p className="font-bold text-white">{SCHEDULE_ROOM_LABELS[room].name}</p>
          <p className="text-sm text-white/55">{SCHEDULE_ROOM_LABELS[room].detail}</p>
        </div>
      ))}

      {boundaries
        .filter((boundary) => startTimes.has(boundary))
        .map((boundary) => (
          <p
            key={`time-${boundary}`}
            className="pt-4 font-mono text-sm text-white/70"
            // Grid lines are computed from the data, which a class cannot express.
            style={{ gridColumn: 1, gridRow: lineFor(boundary) }}
          >
            {formatScheduleTime(boundary)}
          </p>
        ))}

      {slots.map((slot) => (
        <div
          key={slot.id}
          style={{
            gridColumn: spansAllRooms(slot) ? '2 / -1' : roomColumnIndex(slot.room) + 2,
            gridRow: `${lineFor(slot.startTime)} / ${lineFor(slot.endTime)}`,
          }}
        >
          {spansAllRooms(slot) ? <SharedBlock slot={slot} /> : <SessionCard slot={slot} showRoom={false} />}
        </div>
      ))}
    </div>
  );
}

// Mobile and tablet: one column, grouped by start time, room order within a group.
function ScheduleList({ slots }: { slots: PublicScheduleSlot[] }) {
  const groups = new Map<string, PublicScheduleSlot[]>();
  for (const slot of slots) groups.set(slot.startTime, [...(groups.get(slot.startTime) ?? []), slot]);
  const roomOrder = (slot: PublicScheduleSlot) => (spansAllRooms(slot) ? -1 : roomColumnIndex(slot.room));

  return (
    <ol className="lg:hidden space-y-8">
      {[...groups.entries()].map(([startTime, groupSlots]) => (
        <li key={startTime}>
          <h2 className="mb-3 font-mono text-sm font-bold text-white/70">
            <time dateTime={startTime}>{formatScheduleTime(startTime)}</time>
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {[...groupSlots]
              .sort((first, second) => roomOrder(first) - roomOrder(second))
              .map((slot) =>
                spansAllRooms(slot) ? (
                  <div key={slot.id} className="sm:col-span-2">
                    <SharedBlock slot={slot} />
                  </div>
                ) : (
                  <SessionCard key={slot.id} slot={slot} showRoom />
                )
              )}
          </div>
        </li>
      ))}
    </ol>
  );
}

export default async function SchedulePage() {
  const cfsOpen = isCfsOpen();
  const cfsCloseDate = process.env.CFS_CLOSE_DATE;
  const ticketsOnSale = areTicketsOpen();
  const slots = await fetchPublicSchedule();

  return (
    <div className="bg-[#010103] text-white min-h-screen">
      <Navbar accent="blue" isCfsOpen={cfsOpen} cfsCloseDate={cfsCloseDate} areTicketsOpen={ticketsOnSale} />

      <section className={`relative pb-12 px-4 sm:px-6 lg:px-12 overflow-hidden ${ticketsOnSale ? 'pt-40' : 'pt-36'}`}>
        <div className="absolute inset-0 hero-atmosphere pointer-events-none" aria-hidden="true" />

        <div className="relative max-w-4xl mx-auto text-center">
          <p className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-center gap-1.5 sm:gap-2.5 text-base font-bold text-white/80 animate-fade-in">
            <span className="flex items-center gap-2.5">
              <span>Saturday, 10 October 2026</span>
              <span className="w-1.5 h-1.5 rounded-full bg-white/80 shrink-0" aria-hidden="true" />
            </span>
            <span>Torrens University, Surry Hills</span>
          </p>

          <h1
            className="text-[clamp(2.5rem,10vw,4rem)] md:text-[clamp(2.25rem,5.5vw,4rem)] font-bold leading-[0.95] tracking-tight text-white mb-6 animate-slide-up"
            style={{ animationDelay: '0.1s' }}
          >
            Schedule
          </h1>

          <p
            className="text-white/70 text-lg max-w-2xl mx-auto leading-relaxed animate-slide-up"
            style={{ animationDelay: '0.2s' }}
          >
            {slots.length > 0
              ? 'Four rooms, one day. Slots marked TBC are held but still being settled, so check back closer to the day.'
              : 'The schedule is being finalised. Check back soon, or meet the speakers in the meantime.'}
          </p>

          {slots.length > 0 && (
            <ul className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-white/70" aria-label="Track colours">
              {LEGEND_TRACKS.map((track) => (
                <li key={track} className="inline-flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${TRACK_DOT_COLORS[track]}`} aria-hidden="true" />
                  {TRACK_LABELS[track]} track
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {slots.length > 0 ? (
        <div className="pb-24 px-4 sm:px-6 lg:px-12">
          <Reveal className="max-w-7xl mx-auto">
            <h2 className="sr-only">Sessions by time and room</h2>
            <ScheduleGrid slots={slots} />
            <ScheduleList slots={slots} />
          </Reveal>
        </div>
      ) : (
        <section className="pb-24 px-4 sm:px-6 lg:px-12">
          <div className="max-w-2xl mx-auto text-center">
            <Reveal className="bg-surface rounded-2xl p-10">
              <Link
                href="/speakers"
                className="inline-flex items-center px-7 py-2 bg-transparent text-white text-base font-bold rounded border border-white/40 transition-colors hover:border-white"
              >
                Meet the speakers
              </Link>
            </Reveal>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
