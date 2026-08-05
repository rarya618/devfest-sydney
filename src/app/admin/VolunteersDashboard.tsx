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
    <div className="mt-3 pt-3 border-t border-black-02/6 space-y-3">
      {notes.length > 0 && (
        <ul className="space-y-2">
          {notes.map((note, index) => (
            <li key={index} className="text-xs bg-off-white border border-black-02/8 rounded-lg px-3 py-2">
              <p className="text-black-02/70 leading-relaxed whitespace-pre-wrap">{note.text}</p>
              <p className="mt-1 text-xs text-black-02/35">
                <span className="font-medium text-black-02/45">{note.authorName}</span> &middot; {formatDate(note.createdAt)}
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
          className="flex-1 rounded-lg border border-black-02/15 bg-white px-3 py-2 text-xs text-black-02 placeholder:text-black-02/35 focus:outline-none focus:border-google-green/50 focus:ring-1 focus:ring-google-green/30 resize-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isPending || !draft.trim()}
          aria-label="Save reviewer note"
          className="shrink-0 text-xs px-3 py-2 rounded-lg bg-google-green/10 border border-google-green/25 text-google-green hover:bg-google-green/15 transition-colors font-medium disabled:opacity-40"
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

  function handleAction(action: (id: string) => Promise<{ error?: string }>) {
    startTransition(async () => {
      const result = await action(volunteer.id);
      if (result.error) onError(result.error);
    });
  }

  return (
    <div
      className={`bg-white border border-l-4 border-l-google-green rounded-2xl p-4 sm:p-6 shadow-[0_1px_3px_rgba(30,30,30,0.04)] transition-all hover:shadow-[0_4px_16px_rgba(30,30,30,0.07)] hover:-translate-y-0.5 ${
        isPending ? 'opacity-50 pointer-events-none' : 'border-black-02/8'
      }`}
      aria-label={`Volunteer signup from ${volunteer.name}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
        <div className="min-w-0">
          <h3 className="font-bold text-black-02 text-lg leading-snug tracking-tight">{volunteer.name}</h3>
          <p className="mt-0.5 truncate">
            <span className="text-sm text-black-02/60">{volunteer.email}</span>
            {volunteer.phone && <span className="text-xs text-black-02/40"> &middot; {volunteer.phone}</span>}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          {volunteer.googleTechExperience && (
            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-medium bg-google-blue/10 text-google-blue border-google-blue/20">
              Possible facilitator
            </span>
          )}
          {volunteer.isTorrensStudentOrStaff && (
            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-medium bg-google-yellow/10 text-google-yellow border-google-yellow/20">
              Torrens
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {volunteer.areasOfInterest.map((area) => (
          <span key={area} className="text-xs px-2.5 py-1 rounded-full bg-off-white border border-black-02/8 text-black-02/60">
            {VOLUNTEER_AREA_LABELS[area]}
          </span>
        ))}
      </div>

      <p className="text-sm text-black-02/50 leading-relaxed mb-4">{volunteer.motivation}</p>

      {(volunteer.priorExperience || volunteer.googleTechExperience || volunteer.dietaryRequirements) && (
        <div className="space-y-2 mb-4">
          {volunteer.priorExperience && (
            <p className="text-xs text-black-02/50 bg-off-white border border-black-02/8 rounded-lg px-3 py-2 leading-relaxed">
              <span className="font-bold text-black-02/60">Prior experience: </span>
              {volunteer.priorExperience}
            </p>
          )}
          {volunteer.googleTechExperience && (
            <p className="text-xs text-black-02/50 bg-google-blue/5 border border-google-blue/15 rounded-lg px-3 py-2 leading-relaxed">
              <span className="font-bold text-google-blue">Google tech experience: </span>
              {volunteer.googleTechExperience}
            </p>
          )}
          {volunteer.dietaryRequirements && (
            <p className="text-xs text-black-02/50 bg-off-white border border-black-02/8 rounded-lg px-3 py-2 leading-relaxed">
              <span className="font-bold text-black-02/60">Dietary: </span>
              {volunteer.dietaryRequirements}
            </p>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-black-02/6">
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${VOLUNTEER_STATUS_DOT_STYLES[volunteer.status].text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${VOLUNTEER_STATUS_DOT_STYLES[volunteer.status].dot}`} />
            {VOLUNTEER_STATUS_LABELS[volunteer.status]}
          </span>
          <span className="text-black-02/15 text-xs">&middot;</span>
          <span className="text-xs text-black-02/30">{formatDate(volunteer.submittedAt)}</span>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setNotesOpen((open) => !open)}
            disabled={isPending}
            aria-expanded={notesOpen}
            aria-label={`${notesOpen ? 'Hide' : 'Show'} reviewer notes for ${volunteer.name}`}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-black-02/15 text-black-02/50 hover:border-black-02/30 hover:text-black-02/75 transition-colors"
          >
            <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 3.5h11M2.5 7h11M2.5 10.5h7" />
            </svg>
            Notes{volunteer.reviewerNotes.length > 0 ? ` (${volunteer.reviewerNotes.length})` : ''}
          </button>
          {volunteer.status === 'pending' && (
            <>
              <button
                onClick={() => handleAction(rejectVolunteer)}
                disabled={isPending}
                aria-label={`Reject volunteer signup: ${volunteer.name}`}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-google-red/10 border border-google-red/25 text-google-red hover:bg-google-red/15 transition-colors font-medium"
              >
                <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
                  <path strokeLinecap="round" d="M2.5 2.5l7 7m0-7l-7 7" />
                </svg>
                Reject
              </button>
              <button
                onClick={() => handleAction(acceptVolunteer)}
                disabled={isPending}
                aria-label={`Accept volunteer signup: ${volunteer.name}`}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-google-green/10 border border-google-green/25 text-google-green hover:bg-google-green/15 transition-colors font-medium"
              >
                <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.375l2.625 2.625L9.75 3.75" />
                </svg>
                Accept
              </button>
            </>
          )}
          {(volunteer.status === 'rejected' || volunteer.status === 'archived' || volunteer.status === 'accepted') && (
            <button
              onClick={() => handleAction(restoreVolunteer)}
              disabled={isPending}
              aria-label={`Restore volunteer signup to pending: ${volunteer.name}`}
              className="text-xs px-3 py-1.5 rounded-lg border border-black-02/15 text-black-02/50 hover:border-black-02/30 hover:text-black-02/75 transition-colors"
            >
              Restore
            </button>
          )}
          {volunteer.status !== 'archived' && (
            <button
              onClick={() => handleAction(archiveVolunteer)}
              disabled={isPending}
              aria-label={`Archive volunteer signup: ${volunteer.name}`}
              className="text-xs px-3 py-1.5 rounded-lg text-black-02/35 hover:text-black-02/60 transition-colors"
            >
              Archive
            </button>
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
      <div className="sticky top-[52px] md:top-0 z-20 w-full px-4 pt-4 pb-2 bg-off-white/95 backdrop-blur-sm">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="shrink-0 text-xl font-bold text-black-02 tracking-tight">Volunteers</h1>
          </div>

          <div
            className={`flex items-center justify-center gap-1 shrink-0 basis-full sm:basis-0 sm:flex-1 overflow-x-auto overflow-y-hidden whitespace-nowrap [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden transition-all duration-300 ease-in-out ${
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
                className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                  filter === tab.value
                    ? 'bg-google-green/10 border-google-green/30 text-google-green'
                    : 'border-black-02/12 text-black-02/50 hover:border-black-02/25 hover:text-black-02/75'
                }`}
              >
                {tab.label} ({counts[tab.value]})
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
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black-02/30" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
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
              className="w-full min-w-[16rem] rounded-lg border border-black-02/15 bg-white pl-8 pr-9 py-1.5 text-sm text-black-02 placeholder:text-black-02/35 focus:outline-none focus:border-google-green/50 focus:ring-1 focus:ring-google-green/30"
            />
            <button
              onClick={() => {
                setSearch('');
                setSearchOpen(false);
              }}
              tabIndex={searchOpen || search ? undefined : -1}
              aria-label="Close search"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-black-02/30 hover:text-black-02/60 transition-colors"
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
                className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-lg border border-black-02/15 text-black-02/60 hover:border-black-02/30 hover:text-black-02/85 transition-colors"
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

      <div className="max-w-4xl mx-auto px-4 pb-8 sm:pb-10">
        {filtered.length === 0 ? (
          <div className="bg-white border border-black-02/8 rounded-2xl p-12 text-center">
            <p className="text-sm text-black-02/45">No volunteer signups match this filter.</p>
          </div>
        ) : (
          <div className="space-y-4">
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
