'use client';

import { useState, useTransition, useEffect, useRef, useCallback, type FormEvent } from 'react';
import { acceptVolunteer, rejectVolunteer, restoreVolunteer, archiveVolunteer, addVolunteerReviewerNote } from './volunteerActions';
import Alert from '@/components/Alert';
import { formatDate } from '@/lib/format';
import {
  VOLUNTEER_STATUS_DOT_STYLES,
  VOLUNTEER_STATUS_LABELS,
  VOLUNTEER_AREA_LABELS,
} from '@/lib/volunteerLabels';
import type { ReviewerNote, VolunteerStatus, VolunteerSubmission } from '@/lib/types';

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
              <p className="mt-1 text-xs text-white/40">
                <span className="font-medium text-white/50">{note.authorName}</span> &middot; {formatDate(note.createdAt)}
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
          className="flex-1 rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-google-green/50 focus:ring-1 focus:ring-google-green/30 resize-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isPending || !draft.trim()}
          aria-label="Save reviewer note"
          className="shrink-0 text-xs px-3 py-2 rounded-lg bg-google-green/15 border border-google-green/30 text-google-green hover:bg-google-green/20 transition-colors font-medium disabled:opacity-40"
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
    setIsOpen((open) => !open);
  }

  return (
    <div
      onClick={handleCardClick}
      className={`relative cursor-pointer bg-white/[0.06] border-l-4 border-l-google-green rounded-lg pt-4 pb-5 pl-4 pr-4 sm:pt-5 sm:pb-7 sm:pl-5 sm:pr-5 shadow-[0_1px_3px_rgba(0,0,0,0.2)] transition-all hover:shadow-[0_4px_16px_rgba(0,0,0,0.35)] hover:-translate-y-0.5 ${
        isPending ? 'opacity-50 pointer-events-none' : ''
      } ${moreOpen ? 'z-40' : ''}`}
      aria-label={`Volunteer signup from ${volunteer.name}`}
    >
      <div className="flex items-start gap-4">
      <div className="flex-1 min-w-0">
      <h3 className="font-bold text-white text-2xl leading-snug tracking-tight mb-2.5">{volunteer.name}</h3>

      <div className="flex flex-wrap items-start gap-1.5 gap-y-2.5 mb-5">
        <div className="min-w-0 mr-auto">
          <p className="text-base font-bold text-white/70 truncate">{volunteer.email}</p>
          {volunteer.phone && <p className="mt-1 text-sm text-white/40 truncate">{volunteer.phone}</p>}
        </div>
        {volunteer.googleTechExperience && (
          <span className="inline-flex items-center gap-1 text-sm leading-none pl-3 pr-3.5 py-1.5 rounded-full border font-medium bg-google-blue/15 text-google-blue border-google-blue/25">
            Possible facilitator
          </span>
        )}
        {volunteer.isTorrensStudentOrStaff && (
          <span className="inline-flex items-center gap-1 text-sm leading-none pl-3 pr-3.5 py-1.5 rounded-full border font-medium bg-google-yellow/15 text-google-yellow border-google-yellow/25">
            Torrens
          </span>
        )}
      </div>

      <div
        className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
      >
        <div className="overflow-hidden">
      <div className="flex flex-wrap gap-1.5 mb-5">
        {volunteer.areasOfInterest.map((area) => (
          <span key={area} className="text-sm px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-white/70">
            {VOLUNTEER_AREA_LABELS[area]}
          </span>
        ))}
      </div>

      <p className="text-base text-white/50 leading-relaxed mb-5">{volunteer.motivation}</p>

      {(volunteer.priorExperience || volunteer.googleTechExperience || volunteer.dietaryRequirements) && (
        <div className="space-y-3 mb-5">
          {volunteer.priorExperience && (
            <p className="text-base text-white/50 bg-white/[0.04] border border-white/10 rounded-lg px-5 py-3 leading-relaxed">
              <span className="font-bold text-white/70">Prior experience: </span>
              {volunteer.priorExperience}
            </p>
          )}
          {volunteer.googleTechExperience && (
            <p className="text-base text-white/50 bg-google-blue/10 border border-google-blue/20 rounded-lg px-5 py-3 leading-relaxed">
              <span className="font-bold text-google-blue">Google tech experience: </span>
              {volunteer.googleTechExperience}
            </p>
          )}
          {volunteer.dietaryRequirements && (
            <p className="text-base text-white/50 bg-white/[0.04] border border-white/10 rounded-lg px-5 py-3 leading-relaxed">
              <span className="font-bold text-white/70">Dietary: </span>
              {volunteer.dietaryRequirements}
            </p>
          )}
        </div>
      )}
        </div>
      </div>

      <div className="flex items-center gap-3 pt-5">
        <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${VOLUNTEER_STATUS_DOT_STYLES[volunteer.status].text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${VOLUNTEER_STATUS_DOT_STYLES[volunteer.status].dot}`} />
          {VOLUNTEER_STATUS_LABELS[volunteer.status]}
        </span>
        <span className="text-white/30 text-sm">&middot;</span>
        <span className="text-sm text-white/40">{formatDate(volunteer.submittedAt)}</span>
      </div>
      </div>

      <div className="flex flex-col items-center gap-2 shrink-0">
          <button
            onClick={() => setIsOpen((open) => !open)}
            aria-expanded={isOpen}
            aria-label={`${isOpen ? 'Collapse' : 'Expand'} details for: ${volunteer.name}`}
            className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-white/10 text-white/50 hover:border-white/20 hover:text-white transition-colors"
          >
            <svg
              className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6l4 4 4-4" />
            </svg>
          </button>
          {volunteer.status === 'pending' && (
            <>
              <button
                onClick={() => handleAction(rejectVolunteer)}
                disabled={isPending}
                aria-label={`Reject volunteer signup: ${volunteer.name}`}
                title="Reject"
                className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-google-red text-white hover:bg-google-red/90 transition-colors disabled:opacity-60"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
                  <path strokeLinecap="round" d="M2.5 2.5l7 7m0-7l-7 7" />
                </svg>
              </button>
              <button
                onClick={() => handleAction(acceptVolunteer)}
                disabled={isPending}
                aria-label={`Accept volunteer signup: ${volunteer.name}`}
                title="Accept"
                className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-google-green text-white hover:bg-google-green/90 transition-colors disabled:opacity-60"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.375l2.625 2.625L9.75 3.75" />
                </svg>
              </button>
            </>
          )}
          {(volunteer.status === 'rejected' || volunteer.status === 'archived' || volunteer.status === 'accepted') && (
            <button
              onClick={() => handleAction(restoreVolunteer)}
              disabled={isPending}
              aria-label={`Restore volunteer signup to pending: ${volunteer.name}`}
              title="Restore"
              className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-white/10 text-white/50 hover:border-white/20 hover:text-white transition-colors"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 4L2.5 7.5 6 11M2.5 7.5h6.5a4 4 0 010 8H7" />
              </svg>
            </button>
          )}
          <div className="relative" ref={moreMenuRef}>
            <button
              onClick={() => setMoreOpen((open) => !open)}
              disabled={isPending}
              aria-haspopup="menu"
              aria-expanded={moreOpen}
              aria-label={`More actions for: ${volunteer.name}`}
              title="More actions"
              className="relative inline-flex items-center justify-center w-8 h-8 rounded-full border border-white/10 text-white/50 hover:border-white/20 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <circle cx="3" cy="8" r="1.25" />
                <circle cx="8" cy="8" r="1.25" />
                <circle cx="13" cy="8" r="1.25" />
              </svg>
              {volunteer.reviewerNotes.length > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-google-blue text-white text-[10px] font-bold leading-none">
                  {volunteer.reviewerNotes.length}
                </span>
              )}
            </button>

            {moreOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full mt-2 w-44 bg-[#2d2e31] border border-white/10 rounded-2xl shadow-[0_12px_32px_rgba(0,0,0,0.45)] overflow-hidden py-1.5 z-30"
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
}

type FilterStatus = 'all' | VolunteerStatus;

export default function VolunteersDashboard({ volunteers }: Props) {
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!searchOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setSearch('');
        setSearchOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setSearch('');
        setSearchOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [searchOpen]);

  const dismissAlert = useCallback(() => setAlertMessage(null), []);

  const counts: Record<FilterStatus, number> = {
    all: volunteers.length,
    pending: volunteers.filter((v) => v.status === 'pending').length,
    accepted: volunteers.filter((v) => v.status === 'accepted').length,
    rejected: volunteers.filter((v) => v.status === 'rejected').length,
    archived: volunteers.filter((v) => v.status === 'archived').length,
  };

  const query = search.trim().toLowerCase();
  const filtered = volunteers
    .filter((v) => filter === 'all' || v.status === filter)
    .filter((v) => !query || v.name.toLowerCase().includes(query) || v.email.toLowerCase().includes(query));

  const filterTabs: { value: FilterStatus; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'archived', label: 'Archived' },
  ];

  return (
    <>
      <div className="sticky top-[52px] md:top-0 z-20 w-full px-6 pt-6 pb-4 bg-[#202124]/95 backdrop-blur-sm">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="shrink-0 text-xl font-bold text-white tracking-tight">Volunteers</h1>
          </div>

          <div
            className={`flex items-center justify-center gap-0 shrink-0 basis-full sm:basis-0 sm:flex-1 overflow-x-auto overflow-y-hidden whitespace-nowrap [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden transition-all duration-300 ease-in-out ${
              searchOpen || search ? 'max-w-0 max-h-0 opacity-0' : 'max-w-full max-h-10 opacity-100'
            }`}
            aria-hidden={!!(searchOpen || search)}
          >
            {filterTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                aria-pressed={filter === tab.value}
                tabIndex={searchOpen || search ? -1 : undefined}
                className={`shrink-0 inline-flex items-center gap-2.5 text-sm px-5 py-2.5 rounded-full transition-colors ${
                  filter === tab.value
                    ? 'bg-white/[0.12] text-white font-bold'
                    : 'text-white/50 font-medium hover:text-white'
                }`}
              >
                {tab.label}
                <span>{counts[tab.value]}</span>
              </button>
            ))}
          </div>

          <div
            ref={searchContainerRef}
            className={`relative basis-full sm:basis-auto overflow-hidden transition-all duration-300 ease-in-out ${
              searchOpen || search ? 'flex-1 mx-auto max-w-full sm:max-w-[24rem] max-h-12 opacity-100' : 'max-w-0 max-h-0 opacity-0'
            }`}
            aria-hidden={!(searchOpen || search)}
          >
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
              <circle cx="7" cy="7" r="5" />
              <path strokeLinecap="round" d="M11 11l3.5 3.5" />
            </svg>
            <input
              ref={searchInputRef}
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              tabIndex={searchOpen || search ? undefined : -1}
              placeholder="Search by name or email…"
              aria-label="Search by name or email"
              className="w-full min-w-[16rem] rounded-lg border border-white/10 bg-white/[0.06] pl-8 pr-9 py-1.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-google-green/50 focus:ring-1 focus:ring-google-green/30"
            />
            <button
              onClick={() => {
                setSearch('');
                setSearchOpen(false);
              }}
              tabIndex={searchOpen || search ? undefined : -1}
              aria-label="Close search"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
                <path strokeLinecap="round" d="M4 4l8 8M12 4l-8 8" />
              </svg>
            </button>
          </div>

          <div className="flex items-center justify-end gap-2 shrink-0 ml-auto">
            {!(searchOpen || search) && (
              <button
                onClick={() => {
                  setSearchOpen(true);
                  requestAnimationFrame(() => searchInputRef.current?.focus());
                }}
                aria-label="Search by name or email"
                title="Search"
                className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-lg border border-white/10 text-white/70 hover:border-white/20 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
                  <circle cx="7" cy="7" r="5" />
                  <path strokeLinecap="round" d="M11 11l3.5 3.5" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="px-6 pb-8 sm:pb-10">
        {filtered.length === 0 ? (
          <div className="bg-white/[0.06] border border-white/10 rounded-2xl p-12 text-center">
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
