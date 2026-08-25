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
import { useMobileBarHidden } from './MobileBarContext';

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
      className={`relative cursor-pointer bg-white/[0.06] border-l-4 border-l-google-green rounded-lg pt-4 pb-5 pl-4 pr-4 sm:pt-5 sm:pb-7 sm:pl-5 sm:pr-5 transition-colors hover:bg-white/[0.08] ${
        isPending ? 'opacity-50 pointer-events-none' : ''
      } ${moreOpen ? 'z-40' : ''}`}
      aria-label={`Volunteer signup from ${volunteer.name}`}
    >
      <div className="flex items-start gap-4">
      <div className="flex-1 min-w-0">
      <h3 className="font-bold text-white text-xl leading-snug tracking-tight mb-2.5">{volunteer.name}</h3>

      <div className="flex flex-wrap items-start gap-1.5 gap-y-2.5 mb-5">
        <div className="min-w-0 mr-auto">
          <p className="flex items-center gap-1.5 text-base font-bold text-white/70 truncate">
            <svg className="w-3.5 h-3.5 shrink-0 text-white/40" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
              <rect x="1.5" y="3.5" width="13" height="9" rx="1.5" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2 4.5l6 5 6-5" />
            </svg>
            <span className="truncate">{volunteer.email}</span>
          </p>
          {volunteer.phone && (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-white/40 truncate">
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 2h2l1 3-1.5 1a8 8 0 004.5 4.5l1-1.5 3 1v2a1.5 1.5 0 01-1.5 1.5A10.5 10.5 0 012 3.5 1.5 1.5 0 013.5 2z" />
              </svg>
              <span className="truncate">{volunteer.phone}</span>
            </p>
          )}
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

      <div className="flex flex-wrap gap-1.5 mb-5">
        {volunteer.areasOfInterest.map((area) => (
          <span key={area} className="text-xs px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-white/70">
            {VOLUNTEER_AREA_LABELS[area]}
          </span>
        ))}
      </div>

      <div
        className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
      >
        <div className="overflow-hidden">

      <p className="text-sm text-white/50 leading-relaxed mb-5">{volunteer.motivation}</p>

      {(volunteer.priorExperience || volunteer.googleTechExperience || volunteer.dietaryRequirements) && (
        <div className="space-y-3 mb-5">
          {volunteer.priorExperience && (
            <p className="text-sm text-white/50 bg-white/[0.04] border border-white/10 rounded-lg px-5 py-3 leading-relaxed">
              <span className="font-bold text-white/70">Prior experience: </span>
              {volunteer.priorExperience}
            </p>
          )}
          {volunteer.googleTechExperience && (
            <p className="text-sm text-white/50 bg-google-blue/10 border border-google-blue/20 rounded-lg px-5 py-3 leading-relaxed">
              <span className="font-bold text-google-blue">Google tech experience: </span>
              {volunteer.googleTechExperience}
            </p>
          )}
          {volunteer.dietaryRequirements && (
            <p className="text-sm text-white/50 bg-white/[0.04] border border-white/10 rounded-lg px-5 py-3 leading-relaxed">
              <span className="font-bold text-white/70">Dietary: </span>
              {volunteer.dietaryRequirements}
            </p>
          )}
        </div>
      )}
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${VOLUNTEER_STATUS_DOT_STYLES[volunteer.status].text}`}>
          <span className={`w-[5px] h-[5px] rounded-full ${VOLUNTEER_STATUS_DOT_STYLES[volunteer.status].dot}`} />
          {VOLUNTEER_STATUS_LABELS[volunteer.status]}
        </span>
        <span className="text-white/30 text-xs">&middot;</span>
        <span className="text-xs text-white/40">{formatDate(volunteer.submittedAt)}</span>
      </div>
      </div>

      <div className="flex flex-col items-center gap-2 shrink-0 self-start">
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
            <div className="inline-flex flex-col rounded-full border border-white/15 overflow-hidden">
              <button
                onClick={() => handleAction(rejectVolunteer)}
                disabled={isPending}
                aria-label={`Reject volunteer signup: ${volunteer.name}`}
                title="Reject"
                className="inline-flex items-center justify-center w-8 py-3 text-white/70 hover:bg-google-red hover:text-white transition-colors disabled:opacity-60"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
                  <path strokeLinecap="round" d="M2.5 2.5l7 7m0-7l-7 7" />
                </svg>
              </button>
              <span className="h-px bg-white/15" />
              <button
                onClick={() => handleAction(acceptVolunteer)}
                disabled={isPending}
                aria-label={`Accept volunteer signup: ${volunteer.name}`}
                title="Accept"
                className="inline-flex items-center justify-center w-8 py-3 text-white/70 hover:bg-google-green hover:text-white transition-colors disabled:opacity-60"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.375l2.625 2.625L9.75 3.75" />
                </svg>
              </button>
            </div>
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
  const mobileBarHidden = useMobileBarHidden();
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchWidthOpen, setSearchWidthOpen] = useState(false);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const statusMenuRef = useRef<HTMLDivElement>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  useEffect(() => {
    if (searchOpen || search) {
      const timeout = setTimeout(() => setSearchWidthOpen(true), 20);
      return () => clearTimeout(timeout);
    }
    setSearchWidthOpen(false);
  }, [searchOpen, search]);

  useEffect(() => {
    if (searchWidthOpen) {
      searchInputRef.current?.focus();
    }
  }, [searchWidthOpen]);

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
      <div className={`sticky ${mobileBarHidden ? 'top-0' : 'top-[4.25rem]'} md:top-0 transition-[top] duration-300 ease-in-out z-20 w-full px-4 md:px-5 pt-2 md:pt-[1.125rem] pb-3 bg-[#17181a]/95 backdrop-blur-sm`}>
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-white tracking-tight">Volunteers</h1>
            <p className="mt-0.5 text-sm text-white/40">
              {counts.all} total &middot; {counts.pending} pending review
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <div
              ref={searchContainerRef}
              className={`relative shrink-0 h-10 rounded-full transition-all duration-300 ease-in-out ${
                searchWidthOpen ? 'w-full sm:w-80 bg-white/[0.06]' : 'w-10 bg-white/[0.06] hover:bg-white/[0.1]'
              }`}
            >
              <button
                onClick={() => setSearchOpen(true)}
                tabIndex={searchOpen || search ? -1 : undefined}
                aria-label="Search by name or email"
                title="Search"
                className={`absolute left-0 top-0 inline-flex items-center justify-center w-10 h-10 rounded-full text-white/70 hover:text-white transition-opacity duration-200 ${
                  searchWidthOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
                }`}
              >
                <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
                  <circle cx="7" cy="7" r="5" />
                  <path strokeLinecap="round" d="M11 11l3.5 3.5" />
                </svg>
              </button>

              <input
                ref={searchInputRef}
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                tabIndex={searchOpen || search ? undefined : -1}
                placeholder="Search by name or email…"
                aria-label="Search by name or email"
                className={`w-full h-10 rounded-full bg-transparent pl-9 pr-9 py-0 text-sm text-white placeholder:text-white/30 focus:outline-none transition-opacity duration-200 ${
                  searchWidthOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              />
              <svg
                className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40 pointer-events-none transition-opacity duration-200 ${
                  searchWidthOpen ? 'opacity-100' : 'opacity-0'
                }`}
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.75}
                aria-hidden="true"
              >
                <circle cx="7" cy="7" r="5" />
                <path strokeLinecap="round" d="M11 11l3.5 3.5" />
              </svg>
              <button
                onClick={() => {
                  setSearch('');
                  setSearchOpen(false);
                }}
                tabIndex={searchOpen || search ? undefined : -1}
                aria-label="Close search"
                className={`absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-opacity duration-200 ${
                  searchWidthOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
                  <path strokeLinecap="round" d="M4 4l8 8M12 4l-8 8" />
                </svg>
              </button>
            </div>

            {(searchOpen || search) && <div className="basis-full h-0 sm:hidden" aria-hidden="true" />}

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
                <span className="font-medium text-white/60">{counts[filter]}</span>
                <svg className={`w-3 h-3 text-white/40 transition-transform ${statusMenuOpen ? 'rotate-180' : ''}`} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 4.5l3.5 3.5 3.5-3.5" />
                </svg>
              </button>

              {statusMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full mt-2 w-48 bg-[#2d2e31] border border-white/10 rounded-2xl shadow-[0_12px_32px_rgba(0,0,0,0.45)] overflow-hidden py-1.5 z-30"
                >
                  {filterTabs.map((tab) => (
                    <button
                      key={tab.value}
                      role="menuitem"
                      onClick={() => {
                        setFilter(tab.value);
                        setStatusMenuOpen(false);
                      }}
                      aria-pressed={filter === tab.value}
                      className={`w-full flex items-center justify-between gap-3 text-left text-sm px-4 py-2.5 transition-colors ${
                        filter === tab.value ? 'bg-white/[0.08] text-white font-bold' : 'text-white/70 font-medium hover:bg-white/[0.08] hover:text-white'
                      }`}
                    >
                      {tab.label}
                      <span className="text-white/40">{counts[tab.value]}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-5 pb-8 sm:pb-10">
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
