'use client';

import { useState } from 'react';
import Link from 'next/link';
import { TRACK_DOT_COLORS, TRACK_LABELS } from '@/lib/submissionLabels';
import type { AgendaItem, AgendaState } from './agendaItems';
import { useDashboardPanels } from './DashboardWorkspace';
import { primaryButton, secondaryButton } from './portalStyles';
import { withStageTransition } from './stageTransition';

// The agenda column's stage: the speaker's year as a rolling ruler (six months back, six
// ahead, today in the middle) with each talk placed where it falls, and under it one large card
// for the talk selected on it, opening on whatever is next. Choosing another talk, or opening a
// form, morphs the card (stageTransition.ts).

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const HALF_YEAR_MS = 182.5 * 24 * 60 * 60 * 1000;

const STATE_TEXT: Record<AgendaState, string> = {
  confirm: 'text-google-green',
  confirmed: 'text-google-green',
  upcoming: 'text-google-green',
  review: 'text-google-yellow',
  given: 'text-white/60',
  'not-selected': 'text-white/60',
  passed: 'text-white/60',
};

const STATE_DOT: Record<AgendaState, string> = {
  confirm: 'bg-google-green',
  confirmed: 'bg-google-green',
  upcoming: 'bg-google-green',
  review: 'bg-google-yellow',
  given: 'bg-white/40',
  'not-selected': 'bg-white/40',
  passed: 'bg-white/40',
};

const confirmButtonClass =
  'press inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-google-green-deep text-white text-base font-bold hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-google-blue focus-visible:ring-offset-2 focus-visible:ring-offset-surface';

interface MonthTick {
  key: string;
  month: string;
  // Two-digit year, on January's tick only.
  year: string | null;
  position: number; // 0 to 100
}

// A tick at the start of every month inside the ruler's span.
function monthTicks(start: number, end: number): MonthTick[] {
  const ticks: MonthTick[] = [];
  const cursor = new Date(start);
  cursor.setUTCDate(1);
  cursor.setUTCHours(0, 0, 0, 0);
  cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  while (cursor.getTime() < end) {
    // Fixed names rather than toLocaleDateString: Node and browsers abbreviate differently
    // ("Sept" and "Sep"), which would make the server and client renders disagree.
    ticks.push({
      key: cursor.toISOString(),
      month: MONTHS[cursor.getUTCMonth()],
      year: cursor.getUTCMonth() === 0 ? String(cursor.getUTCFullYear()).slice(2) : null,
      position: ((cursor.getTime() - start) / (end - start)) * 100,
    });
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return ticks;
}

interface AgendaStageProps {
  items: AgendaItem[];
  nextId: string | null;
  todayIso: string;
  // An open form (propose, edit a proposal, edit the badge) takes the card's place.
  panel: React.ReactNode | null;
}

export default function AgendaStage({ items, nextId, todayIso, panel }: AgendaStageProps) {
  const panels = useDashboardPanels();
  const [chosenId, setChosenId] = useState<string | null>(null);
  const selected = items.find((item) => item.id === chosenId) ?? items.find((item) => item.id === nextId) ?? items[0] ?? null;

  const today = Date.parse(todayIso);
  const start = today - HALF_YEAR_MS;
  const end = today + HALF_YEAR_MS;
  const ticks = monthTicks(start, end);
  const placed = items
    .filter((item) => item.dateIso && Date.parse(item.dateIso) >= start && Date.parse(item.dateIso) <= end)
    .map((item) => ({ item, position: ((Date.parse(item.dateIso!) - start) / (end - start)) * 100 }))
    .sort((first, second) => first.position - second.position);

  // A month label under a talk's marker would sit inside its ring, so it is dropped. The year
  // goes on the first month still shown from January on, so the ruler always says where next
  // year starts. A phone shows every other month, so it works that out over its own months:
  // there "Jan ’27" can land between two shown neighbours and run into them.
  function withYears(isShown: (index: number) => boolean) {
    let pendingYear: string | null = null;
    return ticks.map((tick, index) => {
      const year = tick.year ?? pendingYear;
      const isUnderMarker = placed.some((entry) => Math.abs(entry.position - tick.position) < 4.5);
      if (!isShown(index)) {
        pendingYear = year;
        return null;
      }
      pendingYear = isUnderMarker ? year : null;
      if (isUnderMarker) return null;
      return year ? `${tick.month} ’${year}` : tick.month;
    });
  }
  const wideLabels = withYears(() => true);
  const phoneLabels = withYears((index) => index % 2 === 0);

  const selectedPosition = placed.find((entry) => entry.item.id === selected?.id)?.position ?? null;

  function choose(id: string) {
    if (id === selected?.id) return;
    withStageTransition(() => setChosenId(id));
  }

  return (
    <div>
      {/* The ruler. Markers are buttons; the same choices repeat as pills under the card,
          which is where a phone reads them. */}
      <div className="relative mt-10 sm:mt-12 pt-12 sm:pt-14">
        {/* The year line itself: the column's spine. */}
        <div aria-hidden="true" className="h-0.5 rounded-full bg-off-white/85" />
        {ticks.map((tick, index) => (
          <span
            key={tick.key}
            aria-hidden="true"
            style={{ left: `${tick.position}%` }}
            className={`absolute top-12 sm:top-14 h-2 w-px bg-white/30 ${index % 2 === 1 ? 'max-sm:hidden' : ''}`}
          >
            {wideLabels[index] && (
              <span className="absolute top-3.5 left-0 -translate-x-1/2 whitespace-nowrap font-mono text-xs text-white/55 max-sm:hidden">{wideLabels[index]}</span>
            )}
            {phoneLabels[index] && (
              <span className="absolute top-3.5 left-0 -translate-x-1/2 whitespace-nowrap font-mono text-xs text-white/55 sm:hidden">{phoneLabels[index]}</span>
            )}
          </span>
        ))}
        <span aria-hidden="true" style={{ left: '50%' }} className="ruler-today absolute top-6 sm:top-7 bottom-[-0.5rem] w-0.5 -translate-x-1/2 rounded-full bg-off-white">
          <span className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-bold text-off-white">Today</span>
        </span>
        <ul aria-label="Your talks on your year" className="contents">
          {placed.map(({ item, position }, index) => {
            const isSelected = item.id === selected?.id && !panel;
            return (
              <li key={item.id} style={{ left: `${position}%`, '--marker-index': index } as React.CSSProperties} className="ruler-marker absolute top-12 sm:top-14 -translate-x-1/2 -translate-y-1/2">
                <button
                  type="button"
                  onClick={() => choose(item.id)}
                  aria-pressed={isSelected}
                  aria-label={`${item.eventName}${item.dateLabel ? `, ${item.dateLabel}` : ''}: ${item.title}. ${item.kicker}`}
                  className="group relative flex h-8 w-8 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-google-blue"
                >
                  <span
                    className={`block h-3.5 w-3.5 rounded-full ring-[5px] ring-black-02 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-125 ${STATE_DOT[item.state]} ${isSelected ? 'scale-125 outline outline-2 outline-offset-[5px] outline-off-white/70' : ''}`}
                  />
                  <span className={`absolute bottom-full mb-1 whitespace-nowrap text-xs font-bold max-sm:hidden ${STATE_TEXT[item.state]}`}>
                    {item.shortLabel}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* The stage: the selected talk, or the open form, morphing between them. A thin line drops
          from the selected marker to the card, so the year and the card read as one. */}
      <div className="relative mt-14">
        {!panel && selectedPosition !== null && (
          <span
            aria-hidden="true"
            style={{ left: `${selectedPosition}%` }}
            className="absolute bottom-full mb-px h-9 w-px -translate-x-1/2 bg-gradient-to-b from-off-white/0 to-off-white/45"
          />
        )}
        <div className="[view-transition-name:agenda-stage]">
        {panel ?? (selected ? <AgendaCard item={selected} /> : <EmptyYearCard onPropose={() => panels.openPropose(null, 'propose-from-stage')} />)}
        </div>
      </div>

      {items.length > 1 && !panel && (
        <nav aria-label="Your other talks" className="mt-6">
          <ul className="flex flex-wrap gap-2">
            {items
              .filter((item) => item.id !== selected?.id)
              .map((item) => (
                <li key={item.id} className="min-w-0 max-w-full">
                  <button
                    type="button"
                    onClick={() => choose(item.id)}
                    aria-label={`Show ${item.title}: ${item.kicker}`}
                    className="press flex max-w-full items-center gap-2.5 rounded-full border border-white/35 py-2 pl-3 pr-4 text-sm transition-colors hover:border-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-google-blue"
                  >
                    <span aria-hidden="true" className={`h-2.5 w-2.5 shrink-0 rounded-full ${STATE_DOT[item.state]}`} />
                    <span className={`shrink-0 font-mono text-xs ${STATE_TEXT[item.state]}`}>{item.dateLabel ?? 'No date'}</span>
                    <span className="truncate font-bold text-off-white">{item.title}</span>
                  </button>
                </li>
              ))}
          </ul>
        </nav>
      )}
    </div>
  );
}

function AgendaCard({ item }: { item: AgendaItem }) {
  const panels = useDashboardPanels();
  const needsAction = item.state === 'confirm';
  const isDone = item.state === 'given' || item.state === 'passed' || item.state === 'not-selected';
  return (
    <article
      aria-labelledby={`agenda-card-${item.id}`}
      className={`rounded-[28px] bg-surface px-6 py-7 sm:px-9 sm:py-9 ring-1 ${needsAction ? 'ring-google-green/45' : 'ring-white/[0.06]'}`}
    >
      <h2 id={`agenda-card-${item.id}`} className={`text-[clamp(1.5rem,3vw,2.25rem)] font-bold leading-[1.12] tracking-[-0.01em] text-balance ${isDone ? 'text-white/80' : 'text-off-white'}`}>
        {item.title}
      </h2>
      <p className="mt-3 text-white/70">
        {item.eventName}
        {item.dateLabel && <>, {item.dateLabel}</>}
        {item.coSpeakerNames.length > 0 && <span className="text-white/60">, with {item.coSpeakerNames.join(', ')}</span>}
      </p>
      {item.track && (
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-2.5 py-1 font-mono text-xs text-white/70">
          <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${TRACK_DOT_COLORS[item.track]}`} />
          {TRACK_LABELS[item.track]}
        </p>
      )}

      {/* Where it stands, in words, for the states the steps don't already say: a countdown,
          the review, the outcome. A confirm reads straight off its current step. */}
      {item.state !== 'confirm' && <p className={`mt-5 font-bold ${STATE_TEXT[item.state]}`}>{item.kicker}</p>}

      {item.steps.length > 0 && (
        <ol aria-label="Where it’s up to" className="mt-8 grid gap-y-5" style={{ gridTemplateColumns: `repeat(${item.steps.length}, minmax(0, 1fr))` }}>
          {item.steps.map((step, index) => (
            <li key={step.label} aria-current={step.status === 'current' ? 'step' : undefined} className="min-w-0">
              <div className="flex items-center">
                <span
                  aria-hidden="true"
                  className={`h-3 w-3 shrink-0 rounded-full ${
                    step.status === 'done' ? 'bg-google-green' : step.status === 'current' ? `${STATE_DOT[item.state]} ring-4 ring-white/10` : 'border border-white/35'
                  }`}
                />
                {index < item.steps.length - 1 && (
                  <span aria-hidden="true" className={`h-0.5 flex-1 ${step.status === 'done' ? 'bg-google-green' : 'bg-white/15'}`} />
                )}
              </div>
              <p className={`mt-2.5 pr-3 text-sm leading-tight ${step.status === 'current' ? 'font-bold text-off-white' : step.status === 'done' ? 'text-white/70' : 'text-white/55'}`}>
                {step.label}
              </p>
              {step.date && <p className={`mt-1 font-mono text-xs ${step.status === 'current' ? STATE_TEXT[item.state] : 'text-white/55'}`}>{step.date}</p>}
            </li>
          ))}
        </ol>
      )}

      {(item.confirmUrl || item.editable || item.proposeAgainHref) && (
        <div className="mt-9 flex flex-wrap items-center gap-3">
          {item.confirmUrl && (
            <a href={item.confirmUrl} aria-label={`Confirm you will give ${item.title}`} className={confirmButtonClass}>
              Confirm your spot
            </a>
          )}
          {item.editable && (
            <button
              id={`edit-proposal-${item.editable.proposalId}`}
              type="button"
              onClick={() => panels.openEditProposal(item.editable!.proposalId, `edit-proposal-${item.editable!.proposalId}`)}
              aria-label={`Edit ${item.title}`}
              className={`${secondaryButton} text-base px-6 py-2.5`}
            >
              {item.editable.isAccepted ? 'Edit your talk' : 'Edit proposal'}
            </button>
          )}
          {item.proposeAgainHref && (
            <Link href={item.proposeAgainHref} aria-label={`Propose ${item.title} to a meetup`} className={primaryButton}>
              {item.isDevfest ? 'Propose it to a meetup' : 'Propose another talk'}
            </Link>
          )}
        </div>
      )}
    </article>
  );
}

function EmptyYearCard({ onPropose }: { onPropose: () => void }) {
  return (
    <article aria-labelledby="agenda-empty-heading" className="rounded-[28px] border border-dashed border-white/30 px-6 py-8 sm:px-9 sm:py-10">
      <h2 id="agenda-empty-heading" className="text-[clamp(1.5rem,3vw,2.25rem)] font-bold leading-[1.12] tracking-[-0.01em] text-balance">
        Propose a talk and it lands here.
      </h2>
      <p className="mt-3 max-w-prose text-white/70 leading-relaxed">
        Meetups take talks all year. DevFest opens its Call for Speakers once a year, and it shows up here when it does.
      </p>
      <button id="propose-from-stage" type="button" onClick={onPropose} aria-label="Propose a talk" className={`${primaryButton} mt-8`}>
        Propose a talk
      </button>
    </article>
  );
}
