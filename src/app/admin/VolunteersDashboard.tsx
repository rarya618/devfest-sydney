'use client';

import { useState, useTransition, useEffect, useRef, useCallback, type FormEvent } from 'react';
import {
  acceptVolunteer,
  rejectVolunteer,
  restoreVolunteer,
  archiveVolunteer,
  addVolunteerReviewerNote,
  sendVolunteerAcceptanceEmail,
} from './volunteerActions';
import Alert from '@/components/Alert';
import { formatDate } from '@/lib/format';
import {
  VOLUNTEER_STATUS_DOT_STYLES,
  VOLUNTEER_STATUS_LABELS,
  VOLUNTEER_AREA_LABELS,
  VOLUNTEER_CONFIRMATION_CHIPS,
  GDG_ON_CAMPUS_CHAPTER_LABELS,
} from '@/lib/volunteerLabels';
import type { ReviewerNote, VolunteerArea, VolunteerStatus, VolunteerSubmission } from '@/lib/types';
import { useMobileBarHidden } from './MobileBarContext';
import { useRouter } from 'next/navigation';
import Select from '@/components/Select';
import ConfirmAction from './ConfirmAction';
import DecisionButtons from './DecisionButtons';
import { ExpandButton, MoreIcon, RAIL_CLASSES, RAIL_ICON_CLASSES, RAIL_PILL_CLASSES, RAIL_TEXT_BUTTON_CLASSES } from './RailButtons';
import AdminSearch from './AdminSearch';
import FilterChipRow from './FilterChipRow';

interface ReviewerNotesPanelProps {
  volunteerId: string;
  notes: ReviewerNote[];
  onError: (message: string) => void;
}

function ReviewerNotesPanel({ volunteerId, notes, onError }: ReviewerNotesPanelProps) {
  const [draft, setDraft] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleAdd(event: FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;

    startTransition(async () => {
      const result = await addVolunteerReviewerNote(volunteerId, text);
      if (result.error) {
        onError(result.error);
      } else {
        setDraft('');
      }
    });
  }

  return (
    <div className="mt-3 pt-3 border-t border-white/10 space-y-3">
      {notes.length > 0 && (
        <ul className="space-y-2">
          {notes.map((note, index) => (
            <li key={index} className="text-xs bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2">
              <p className="text-white/70 leading-relaxed whitespace-pre-wrap">{note.text}</p>
              <p className="mt-1 text-xs text-white/55">
                <span className="font-normal text-white/50">{note.authorName}</span> &middot; {formatDate(note.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={handleAdd} className="flex items-start gap-2">
        <label htmlFor={`vol-note-${volunteerId}`} className="sr-only">
          Add a reviewer note
        </label>
        <textarea
          id={`vol-note-${volunteerId}`}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Add a reviewer note (admin-only)…"
          rows={2}
          maxLength={2000}
          disabled={isPending}
          className="flex-1 rounded-lg border border-white/35 bg-white/[0.06] px-3 py-2 text-xs text-white placeholder:text-white/50 focus:outline-none focus:border-google-blue focus:ring-2 focus:ring-google-blue/40 resize-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isPending || !draft.trim()}
          aria-label="Save reviewer note"
          className="shrink-0 text-xs font-bold px-3 py-2 rounded-full bg-google-blue-deep text-white hover:opacity-90 transition-colors disabled:opacity-40"
        >
          {isPending ? 'Saving…' : 'Add'}
        </button>
      </form>
    </div>
  );
}

interface VolunteerRowProps {
  volunteer: VolunteerSubmission;
  onError: (message: string) => void;
}

function VolunteerRow({ volunteer, onError }: VolunteerRowProps) {
  const [isPending, startTransition] = useTransition();
  const [notesOpen, setNotesOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  function handleAction(action: (id: string) => Promise<{ error?: string }>) {
    startTransition(async () => {
      const result = await action(volunteer.id);
      if (result.error) onError(result.error);
    });
  }

  useEffect(() => {
    if (!moreOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setMoreOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setMoreOpen(false);
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [moreOpen]);

  function handleCardClick(event: React.MouseEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    if (target.closest('button, a, input, textarea, select, [role="menu"], [role="dialog"]')) return;
    if (window.getSelection()?.toString()) return;
    setIsOpen((open) => !open);
  }

  const hasTracking = Boolean(
    volunteer.tracking.utmSource || volunteer.tracking.utmMedium || volunteer.tracking.utmCampaign || volunteer.tracking.ref,
  );

  return (
    <div
      onClick={handleCardClick}
      className={`relative cursor-pointer bg-surface rounded-2xl p-4 sm:px-5 sm:pt-5 sm:pb-6 transition-colors hover:bg-white/[0.07] ${
        isPending ? 'opacity-50 pointer-events-none' : ''
      } ${moreOpen ? 'z-40' : ''}`}
      aria-label={`Volunteer signup from ${volunteer.name}`}
    >
      <div className="flex items-stretch gap-4">
      <div className="flex-1 min-w-0 flex flex-col">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-2">
        <h2 className="min-w-0 font-bold text-white text-xl leading-snug tracking-tight">{volunteer.name}</h2>
        {/* Only on accepted signups: "Not emailed" against a pending one would read as a
            task, when the thing to do first is decide. */}
        {volunteer.status === 'accepted' && (
          <span
            title={VOLUNTEER_CONFIRMATION_CHIPS[volunteer.confirmation].title}
            className={`text-xs font-bold px-1.5 py-0.5 rounded ${VOLUNTEER_CONFIRMATION_CHIPS[volunteer.confirmation].className}`}
          >
            {VOLUNTEER_CONFIRMATION_CHIPS[volunteer.confirmation].label}
          </span>
        )}
      </div>

      <div className="mb-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-sm text-white/55 truncate">
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
              <rect x="1.5" y="3.5" width="13" height="9" rx="1.5" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2 4.5l6 5 6-5" />
            </svg>
            <span className="truncate">{volunteer.email}</span>
          </p>
          {volunteer.phone && (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-white/55 truncate">
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 2h2l1 3-1.5 1a8 8 0 004.5 4.5l1-1.5 3 1v2a1.5 1.5 0 01-1.5 1.5A10.5 10.5 0 012 3.5 1.5 1.5 0 013.5 2z" />
              </svg>
              <span className="truncate">{volunteer.phone}</span>
            </p>
          )}
        </div>
        {(volunteer.googleTechExperience || volunteer.isTorrensStudentOrStaff || volunteer.hasBeenGdgOnCampusExec) && (
          <div className="flex flex-wrap items-center gap-1.5 gap-y-2 mt-3">
            {volunteer.googleTechExperience && (
              <span className="inline-flex items-center gap-1 text-xs leading-none px-2.5 py-1 rounded-full border font-bold bg-google-blue/15 text-google-blue-light border-google-blue/25">
                Possible facilitator
              </span>
            )}
            {volunteer.isTorrensStudentOrStaff && (
              <span className="inline-flex items-center gap-1 text-xs leading-none px-2.5 py-1 rounded-full border font-bold bg-google-yellow/15 text-google-yellow border-google-yellow/25">
                Torrens
              </span>
            )}
            {volunteer.hasBeenGdgOnCampusExec && (
              <span
                title="Has been on the exec team of a GDG on Campus chapter"
                className="inline-flex items-center gap-1 text-xs leading-none px-2.5 py-1 rounded-full border font-bold bg-google-green/15 text-google-green-light border-google-green/25"
              >
                GDG on Campus exec{volunteer.gdgOnCampusChapter ? ` · ${GDG_ON_CAMPUS_CHAPTER_LABELS[volunteer.gdgOnCampusChapter]}` : ''}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5 gap-y-2 mb-4">
        {volunteer.areasOfInterest.map((area) => (
          <span key={area} className="inline-flex items-center text-xs leading-none px-2.5 py-1 rounded-full border border-white/10 bg-white/[0.06] text-white/70 font-bold">
            {VOLUNTEER_AREA_LABELS[area]}
          </span>
        ))}
      </div>

      <div
        className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
      >
        <div className="overflow-hidden">

      <p className="text-sm text-white/65 leading-relaxed mb-5">{volunteer.motivation}</p>

      {(volunteer.priorExperience || volunteer.googleTechExperience || volunteer.dietaryRequirements || hasTracking) && (
        <div className="space-y-3 mb-5">
          {volunteer.priorExperience && (
            <p className="text-sm text-white/65 bg-white/[0.04] border border-white/10 rounded-lg px-4 py-3 leading-relaxed">
              <span className="font-bold text-white/85">Prior experience: </span>
              {volunteer.priorExperience}
            </p>
          )}
          {volunteer.googleTechExperience && (
            <p className="text-sm text-white/65 bg-google-blue/10 border border-google-blue/20 rounded-lg px-4 py-3 leading-relaxed">
              <span className="font-bold text-google-blue">Google tech experience: </span>
              {volunteer.googleTechExperience}
            </p>
          )}
          {volunteer.dietaryRequirements && (
            <p className="text-sm text-white/65 bg-white/[0.04] border border-white/10 rounded-lg px-4 py-3 leading-relaxed">
              <span className="font-bold text-white/85">Dietary: </span>
              {volunteer.dietaryRequirements}
            </p>
          )}
          {hasTracking && (
            <p className="text-sm text-white/55">
              <span className="font-bold text-white/70">Link tracking: </span>
              {[
                volunteer.tracking.ref && `ref=${volunteer.tracking.ref}`,
                volunteer.tracking.utmSource && `source=${volunteer.tracking.utmSource}`,
                volunteer.tracking.utmMedium && `medium=${volunteer.tracking.utmMedium}`,
                volunteer.tracking.utmCampaign && `campaign=${volunteer.tracking.utmCampaign}`,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          )}
        </div>
      )}
        </div>
      </div>

      <div className="flex items-center gap-3 mt-auto pt-2">
        <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${VOLUNTEER_STATUS_DOT_STYLES[volunteer.status].text}`}>
          <span className={`w-[5px] h-[5px] rounded-full ${VOLUNTEER_STATUS_DOT_STYLES[volunteer.status].dot}`} />
          {VOLUNTEER_STATUS_LABELS[volunteer.status]}
        </span>
        <span className="text-white/50 text-xs font-bold">&middot;</span>
        <span className="text-xs font-bold text-white/55">{formatDate(volunteer.submittedAt)}</span>
      </div>
      </div>

      <div className={RAIL_CLASSES}>
        <div className="flex justify-end gap-1.5">
            <div className="relative" ref={moreMenuRef}>
              <button
                onClick={() => setMoreOpen((open) => !open)}
                disabled={isPending}
                aria-haspopup="menu"
                aria-expanded={moreOpen}
                aria-label={`More actions for: ${volunteer.name}`}
                title="More actions"
                className={RAIL_ICON_CLASSES}
              >
                <MoreIcon />
                {volunteer.reviewerNotes.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-google-blue-deep text-white text-xs font-bold leading-none">
                    {volunteer.reviewerNotes.length}
                  </span>
                )}
              </button>

              {moreOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full mt-2 w-44 bg-surface-raised border border-white/10 rounded-2xl shadow-[0_12px_32px_rgba(0,0,0,0.45)] overflow-hidden py-1.5 z-30"
                >
                  <button
                    role="menuitem"
                    onClick={() => {
                      setNotesOpen((open) => !open);
                      setMoreOpen(false);
                    }}
                    className="w-full text-left text-sm px-4 py-2.5 text-white hover:bg-white/[0.08] transition-colors"
                  >
                    Notes{volunteer.reviewerNotes.length > 0 ? ` (${volunteer.reviewerNotes.length})` : ''}
                  </button>
                  {volunteer.status !== 'archived' && (
                    <button
                      role="menuitem"
                      onClick={() => {
                        handleAction(archiveVolunteer);
                        setMoreOpen(false);
                      }}
                      className="w-full text-left text-sm px-4 py-2.5 text-white hover:bg-white/[0.08] transition-colors"
                    >
                      Archive
                    </button>
                  )}
                </div>
              )}
            </div>
          <ExpandButton isOpen={isOpen} onToggle={() => setIsOpen((open) => !open)} subject={volunteer.name} />
        </div>
        {volunteer.status === 'pending' && (
          <DecisionButtons
            subject={`${volunteer.name}'s volunteer signup`}
            disabled={isPending}
            accept={{
              message: `Accept ${volunteer.name} onto the crew?`,
              detail: 'They move to the crew roster. No email is sent yet: send the acceptance email when you\'re ready.',
              onConfirm: () => handleAction(acceptVolunteer),
            }}
            reject={{
              message: `Turn down ${volunteer.name}'s signup?`,
              detail: 'No email is sent, and you can move it back to pending.',
              onConfirm: () => handleAction(rejectVolunteer),
            }}
          />
        )}
        {/* The same send this volunteer's card offers on /admin/devfest/crew, so an organiser
            working through the review queue doesn't have to change pages to tell someone. */}
        {volunteer.status === 'accepted' && (
          <ConfirmAction
            tone="send"
            message={`${volunteer.acceptanceEmailSentAt ? 'Resend' : 'Send'} the volunteer acceptance email to ${volunteer.name}?`}
            detail={volunteer.acceptanceEmailSentAt
              ? `Last sent ${formatDate(volunteer.acceptanceEmailSentAt)}. They get it again, with a new date to confirm by.`
              : 'It tells them they\'re on the crew and asks them to confirm.'}
            confirmLabel={volunteer.acceptanceEmailSentAt ? 'Resend email' : 'Send email'}
            onConfirm={() => handleAction(sendVolunteerAcceptanceEmail)}
            className="flex"
          >
            {(triggerProps) => (
              <button
                {...triggerProps}
                disabled={isPending}
                aria-label={`${volunteer.acceptanceEmailSentAt ? 'Resend' : 'Send'} the volunteer acceptance email to ${volunteer.name}`}
                title={volunteer.acceptanceEmailSentAt ? 'Resend the acceptance email' : 'Send the acceptance email'}
                className={RAIL_PILL_CLASSES}
              >
                {volunteer.acceptanceEmailSentAt ? 'Resend email' : 'Send email'}
              </button>
            )}
          </ConfirmAction>
        )}
        {(volunteer.status === 'rejected' || volunteer.status === 'archived' || volunteer.status === 'accepted') && (
          <ConfirmAction
            tone="danger"
            message={`Move ${volunteer.name} back to pending?`}
            detail={volunteer.status === 'accepted'
              ? 'They come off the crew and go back to the review queue. Nothing is emailed.'
              : 'Their signup goes back to the review queue. Nothing is emailed.'}
            confirmLabel="Move back"
            onConfirm={() => handleAction(restoreVolunteer)}
            className="flex"
          >
            {(triggerProps) => (
              <button
                {...triggerProps}
                disabled={isPending}
                aria-label={`Move ${volunteer.name}'s signup back to pending`}
                className={RAIL_TEXT_BUTTON_CLASSES}
              >
                Back to pending
              </button>
            )}
          </ConfirmAction>
        )}
      </div>
    </div>

      {notesOpen && (
        <ReviewerNotesPanel volunteerId={volunteer.id} notes={volunteer.reviewerNotes} onError={onError} />
      )}
    </div>
  );
}

interface Props {
  volunteers: VolunteerSubmission[];
  // Set on General events > Volunteers: the general events to pick between, and which one
  // is shown. Absent on the DevFest page, which follows the sidebar's DevFest picker.
  generalEvents?: { events: { id: string; name: string }[]; selectedId: string };
}

type FilterStatus = 'all' | VolunteerStatus;
type FilterArea = 'all' | VolunteerArea;

export default function VolunteersDashboard({ volunteers, generalEvents }: Props) {
  const router = useRouter();
  const mobileBarHidden = useMobileBarHidden();
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [areaFilter, setAreaFilter] = useState<FilterArea>('all');
  const [search, setSearch] = useState('');
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const statusMenuRef = useRef<HTMLDivElement>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!statusMenuOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (statusMenuOpen && statusMenuRef.current && !statusMenuRef.current.contains(event.target as Node)) {
        setStatusMenuOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setStatusMenuOpen(false);
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [statusMenuOpen]);

  const dismissAlert = useCallback(() => setAlertMessage(null), []);

  const counts: Record<FilterStatus, number> = {
    all: volunteers.length,
    pending: volunteers.filter((v) => v.status === 'pending').length,
    accepted: volunteers.filter((v) => v.status === 'accepted').length,
    rejected: volunteers.filter((v) => v.status === 'rejected').length,
    archived: volunteers.filter((v) => v.status === 'archived').length,
  };
  // Accepted but never told: the gap that leaves someone waiting to hear from us.
  const notEmailedCount = volunteers.filter(
    (volunteer) => volunteer.status === 'accepted' && volunteer.confirmation === 'not-emailed'
  ).length;

  const query = search.trim().toLowerCase();
  const withinStatus = volunteers.filter((v) => filter === 'all' || v.status === filter);
  const filtered = withinStatus
    .filter((v) => areaFilter === 'all' || v.areasOfInterest.includes(areaFilter))
    .filter((v) => !query || v.name.toLowerCase().includes(query) || v.email.toLowerCase().includes(query));

  // Areas of interest are multi-select, so a volunteer shows under every area they ticked
  // and the tab counts add up to more than the total. Counted within the chosen status, so
  // the number on a tab is what clicking it shows. Only areas someone actually asked for
  // get a tab: a full list with most reading zero is a row to scroll past, not a filter.
  const areaCounts = new Map<VolunteerArea, number>();
  for (const volunteer of withinStatus) {
    for (const area of volunteer.areasOfInterest) {
      areaCounts.set(area, (areaCounts.get(area) ?? 0) + 1);
    }
  }
  const areaTabs: { value: FilterArea; label: string; count: number }[] = [
    { value: 'all', label: 'All areas', count: withinStatus.length },
    ...(Object.keys(VOLUNTEER_AREA_LABELS) as VolunteerArea[])
      .filter((area) => (areaCounts.get(area) ?? 0) > 0 || area === areaFilter)
      .map((area) => ({ value: area, label: VOLUNTEER_AREA_LABELS[area], count: areaCounts.get(area) ?? 0 })),
  ];

  const filterTabs: { value: FilterStatus; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'archived', label: 'Archived' },
  ];

  return (
    <>
      <div className={`sticky ${mobileBarHidden ? 'top-0' : 'top-[4.25rem]'} md:top-0 transition-[top] duration-300 ease-in-out z-20 w-full px-4 md:px-5 pt-2 md:pt-[1.125rem] pb-3 bg-black-02/95 backdrop-blur-sm`}>
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-off-white tracking-[-0.01em]">Volunteers</h1>
            <p className="mt-0.5 text-sm text-white/55">
              {counts.all} total &middot; {counts.pending} pending review
              {notEmailedCount > 0 && <> &middot; {notEmailedCount} accepted, not emailed</>}
            </p>
          </div>

          {generalEvents && generalEvents.events.length > 0 && (
            <Select
              value={generalEvents.selectedId}
              onChange={(eventId) => router.push(`/admin/event-volunteers?event=${encodeURIComponent(eventId)}`)}
              options={generalEvents.events.map((event) => ({ value: event.id, label: event.name }))}
              aria-label="Choose which general event's volunteers to show"
              className="h-10 rounded-full border border-white/35 bg-white/[0.06] px-4 text-sm font-bold text-white focus:outline-none focus:border-google-blue focus:ring-2 focus:ring-google-blue/40"
            />
          )}

          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <AdminSearch value={search} onChange={setSearch} label="Search volunteers by name or email" placeholder="Search by name or email…" />

            <div className="relative shrink-0" ref={statusMenuRef}>
              <button
                onClick={() => setStatusMenuOpen((open) => !open)}
                aria-haspopup="menu"
                aria-expanded={statusMenuOpen}
                aria-label="Filter volunteers by status"
                className={`inline-flex items-center gap-2 h-10 text-sm px-4 rounded-full transition-colors font-bold ${
                  statusMenuOpen ? 'bg-white/[0.12] text-white' : 'bg-white/[0.06] text-white/70 hover:bg-white/[0.1] hover:text-white'
                }`}
              >
                {filterTabs.find((tab) => tab.value === filter)?.label}
                <span className="font-normal text-white/60">{counts[filter]}</span>
                <svg className={`w-3 h-3 text-white/55 transition-transform ${statusMenuOpen ? 'rotate-180' : ''}`} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 4.5l3.5 3.5 3.5-3.5" />
                </svg>
              </button>

              {statusMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full mt-2 w-48 bg-surface-raised border border-white/10 rounded-2xl shadow-[0_12px_32px_rgba(0,0,0,0.45)] overflow-hidden py-1.5 z-30"
                >
                  {filterTabs.map((tab) => (
                    <button
                      key={tab.value}
                      role="menuitemradio"
                      onClick={() => {
                        setFilter(tab.value);
                        setStatusMenuOpen(false);
                      }}
                      aria-checked={filter === tab.value}
                      className={`w-full flex items-center justify-between gap-3 text-left text-sm px-4 py-2.5 transition-colors ${
                        filter === tab.value ? 'bg-white/[0.08] text-white font-bold' : 'text-white/70 font-bold hover:bg-white/[0.08] hover:text-white'
                      }`}
                    >
                      {tab.label}
                      <span className="text-white/55">{counts[tab.value]}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Areas of interest as a tab row. Status is a menu because a signup is in exactly
            one state; an area is a lens on the queue, and the row shows how thin each one
            is without opening anything. */}
        <FilterChipRow label="Filter volunteers by area of interest" className="mt-3 -mx-4 md:-mx-5">
          {areaTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setAreaFilter(tab.value)}
              aria-pressed={areaFilter === tab.value}
              aria-label={
                tab.value === 'all'
                  ? 'Show volunteer signups from every area'
                  : `Show volunteer signups interested in ${tab.label.toLowerCase()}`
              }
              className={`shrink-0 inline-flex items-center gap-2 h-9 text-sm px-4 rounded-full transition-colors font-bold ${
                areaFilter === tab.value
                  ? 'bg-white/[0.12] text-white'
                  : 'bg-white/[0.06] text-white/70 hover:bg-white/[0.1] hover:text-white'
              }`}
            >
              {tab.label}
              <span className="font-normal text-white/60">{tab.count}</span>
            </button>
          ))}
        </FilterChipRow>
      </div>

      <div className="px-4 md:px-5 pb-8 sm:pb-10">
        {filtered.length === 0 ? (
          <div className="bg-surface border border-white/10 rounded-2xl p-12 text-center">
            <p className="text-sm text-white/50">No volunteer signups match this filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 items-start">
            {filtered.map((volunteer) => (
              <VolunteerRow key={volunteer.id} volunteer={volunteer} onError={setAlertMessage} />
            ))}
          </div>
        )}
      </div>

      {alertMessage && <Alert message={alertMessage} onDismiss={dismissAlert} />}
    </>
  );
}
