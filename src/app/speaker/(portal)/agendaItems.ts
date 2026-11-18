import type { PortalProposal, PortalTalk } from '@/lib/portalData';
import type { Track } from '@/lib/types';

// The dashboard's agenda as one list of items, one per talk: a talk on a programme and the
// proposal behind it are the same item (a talk's id is its proposal's id), so a confirmed talk
// isn't shown twice. Built on the server; AgendaStage draws it as the year ruler and the card.

export type AgendaState = 'confirm' | 'confirmed' | 'upcoming' | 'review' | 'given' | 'not-selected' | 'passed';

export interface AgendaStep {
  label: string;
  date: string | null; // already formatted, mono on the card
  status: 'done' | 'current' | 'todo';
}

export interface AgendaItem {
  id: string;
  title: string;
  eventName: string;
  // The short label over the ruler marker: "DevFest" or "Meetup".
  shortLabel: string;
  isDevfest: boolean;
  track: Track | null;
  // Where it sits on the ruler: the event's start, or null when it has no date yet.
  dateIso: string | null;
  dateLabel: string | null;
  state: AgendaState;
  // The card's top line, in words: "You're in. Confirm by Fri 3 Sep".
  kicker: string;
  steps: AgendaStep[];
  coSpeakerNames: string[];
  confirmUrl: string | null;
  // The proposal to edit, when the speaker still can.
  editable: { proposalId: string; isAccepted: boolean } | null;
  // For a proposal that wasn't selected: where proposing it again starts.
  proposeAgainHref: string | null;
}

export interface AgendaTalk extends PortalTalk {
  speakerName: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

// Day, month and weekday in the event's time zone, with three-letter months to match the ruler
// (en-AU's own short months are "July" and "Sept").
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function dateParts(iso: string, timeZone: string): { day: string; month: string; weekday: string } {
  const parts = new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'numeric', weekday: 'short', timeZone }).formatToParts(new Date(iso));
  const part = (type: string) => parts.find((candidate) => candidate.type === type)?.value ?? '';
  return { day: part('day'), month: MONTHS[Number(part('month')) - 1] ?? '', weekday: part('weekday') };
}

function formatShort(iso: string, timeZone: string): string {
  const { day, month } = dateParts(iso, timeZone);
  return `${day} ${month}`;
}

// A deadline, with its weekday so it reads as a day to act by: "Fri 3 Oct".
export function formatDeadline(iso: string): string {
  const { day, month, weekday } = dateParts(iso, 'Australia/Sydney');
  return `${weekday} ${day} ${month}`;
}

function daysUntil(iso: string, now: Date): number {
  return Math.max(0, Math.ceil((Date.parse(iso) - now.getTime()) / DAY_MS));
}

function onStageKicker(dateIso: string | null, now: Date): string {
  if (!dateIso) return 'Confirmed. The date is still to come';
  const days = daysUntil(dateIso, now);
  if (days === 0) return 'On stage today';
  return days === 1 ? 'On stage tomorrow' : `On stage in ${days} days`;
}

function fromProposal(proposal: PortalProposal, talk: AgendaTalk | undefined, now: Date): AgendaItem {
  const timeZone = talk?.timeZone ?? proposal.eventTimeZone;
  const dateIso = talk?.startAt ?? proposal.eventStartAt;
  const dateLabel = dateIso ? formatShort(dateIso, timeZone) : null;
  const sent = proposal.submittedAt ? formatShort(proposal.submittedAt, 'Australia/Sydney') : null;
  const isPast = dateIso ? Date.parse(dateIso) < now.getTime() : false;
  const confirmBy = proposal.confirmBy && Date.parse(proposal.confirmBy) > now.getTime() ? formatDeadline(proposal.confirmBy) : null;

  let state: AgendaState;
  let kicker: string;
  if (proposal.status === 'not-selected') {
    state = 'not-selected';
    kicker = 'Not selected this time';
  } else if (proposal.status === 'closed') {
    state = 'passed';
    kicker = 'This event has passed';
  } else if (proposal.status === 'under-review') {
    state = 'review';
    kicker = sent ? `Under review since ${sent}` : 'Under review';
  } else if (proposal.status === 'accepted') {
    state = 'confirm';
    kicker = confirmBy ? `You’re in. Confirm by ${confirmBy}` : 'You’re in. Confirm your spot';
  } else if (isPast) {
    state = 'given';
    kicker = dateLabel ? `Given on ${dateLabel}` : 'Given';
  } else {
    state = 'confirmed';
    kicker = onStageKicker(dateIso, now);
  }

  const reached = { review: 0, confirm: 1, confirmed: 2, given: 3, 'not-selected': -1, passed: -1, upcoming: 2 }[state];
  const accepted = proposal.acceptedAt ? formatShort(proposal.acceptedAt, 'Australia/Sydney') : null;
  const confirmed = proposal.confirmedAt ? formatShort(proposal.confirmedAt, 'Australia/Sydney') : null;
  // The step's own date drops the weekday: a phone's step column is a quarter of the card.
  const confirmByShort = confirmBy && proposal.confirmBy ? formatShort(proposal.confirmBy, 'Australia/Sydney') : null;
  // Each step carries its date: when it happened, or for the step in hand, its deadline or
  // the date it was reached.
  const steps: AgendaStep[] =
    reached < 0
      ? []
      : [
          { label: 'Sent', date: sent, status: 'done' },
          reached === 0
            ? { label: 'In review', date: sent ? `since ${sent}` : null, status: 'current' }
            : { label: 'Accepted', date: accepted, status: 'done' },
          reached === 1
            ? { label: 'Confirm', date: confirmByShort ? `by ${confirmByShort}` : null, status: 'current' }
            : { label: 'Confirmed', date: reached > 1 ? confirmed : null, status: reached > 1 ? 'done' : 'todo' },
          { label: 'On stage', date: dateLabel, status: reached === 3 ? 'done' : reached === 2 ? 'current' : 'todo' },
        ];

  const isDevfest = proposal.kind === 'devfest';
  return {
    id: proposal.id,
    title: talk?.talkTitle ?? proposal.talkTitle,
    eventName: proposal.eventName ?? (isDevfest ? 'DevFest Sydney' : 'A GDG Sydney meetup'),
    shortLabel: isDevfest ? 'DevFest' : 'Meetup',
    isDevfest,
    track: proposal.track,
    dateIso,
    dateLabel,
    state,
    kicker,
    steps,
    coSpeakerNames: talk?.coSpeakerNames ?? [],
    confirmUrl: proposal.confirmUrl,
    editable: proposal.editable ? { proposalId: proposal.id, isAccepted: proposal.editable.isAccepted } : null,
    proposeAgainHref:
      state === 'not-selected' ? (proposal.savedTalkId ? `/speaker?propose=${proposal.savedTalkId}` : '/speaker?propose') : null,
  };
}

// A talk with no proposal of its own on this address: a co-speaker's, or one organisers added.
function fromTalk(talk: AgendaTalk, now: Date): AgendaItem {
  const dateLabel = talk.startAt ? formatShort(talk.startAt, talk.timeZone) : null;
  const isGiven = !talk.isUpcoming;
  const isDevfest = talk.eventType === 'devfest';
  return {
    id: `talk:${talk.talkId}:${talk.speakerName}`,
    title: talk.talkTitle,
    eventName: talk.eventName,
    shortLabel: isDevfest ? 'DevFest' : 'Meetup',
    isDevfest,
    track: talk.track,
    dateIso: talk.startAt,
    dateLabel,
    state: isGiven ? 'given' : 'upcoming',
    kicker: isGiven ? (dateLabel ? `Given on ${dateLabel}` : 'Given') : onStageKicker(talk.startAt, now),
    steps: [
      { label: 'On the programme', date: null, status: 'done' },
      { label: 'On stage', date: dateLabel, status: isGiven ? 'done' : 'current' },
    ],
    coSpeakerNames: talk.coSpeakerNames,
    confirmUrl: null,
    editable: null,
    proposeAgainHref: null,
  };
}

// What the card opens on: a spot to confirm first, then the soonest talk ahead, then the newest
// proposal under review, then the most recent thing that happened.
const PRIORITY: Record<AgendaState, number> = { confirm: 0, confirmed: 1, upcoming: 1, review: 2, given: 3, 'not-selected': 4, passed: 5 };

export function buildAgenda(proposals: PortalProposal[], talks: AgendaTalk[], now: Date): { items: AgendaItem[]; nextId: string | null } {
  const talksById = new Map(talks.map((talk) => [talk.talkId, talk]));
  const proposalIds = new Set(proposals.map((proposal) => proposal.id));
  const items = [
    ...proposals.map((proposal) => fromProposal(proposal, talksById.get(proposal.id), now)),
    ...talks.filter((talk) => !proposalIds.has(talk.talkId)).map((talk) => fromTalk(talk, now)),
  ];
  const ordered = [...items].sort((first, second) => {
    const byPriority = PRIORITY[first.state] - PRIORITY[second.state];
    if (byPriority !== 0) return byPriority;
    const firstTime = first.dateIso ? Date.parse(first.dateIso) : Infinity;
    const secondTime = second.dateIso ? Date.parse(second.dateIso) : Infinity;
    // Ahead: soonest first. Behind: most recent first.
    return first.state === 'given' || first.state === 'passed' ? secondTime - firstTime : firstTime - secondTime;
  });
  return { items: ordered, nextId: ordered[0]?.id ?? null };
}

