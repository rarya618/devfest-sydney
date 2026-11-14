'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import Alert from '@/components/Alert';
import SpeakerCard from '@/components/SpeakerCard';
import EditSpeakerModal from './EditSpeakerModal';
import { getInitials } from '@/lib/format';
import type { PersonWithTalks } from '@/lib/people';
import { useMobileBarHidden } from './MobileBarContext';

// Every speaker GDG Sydney has, across DevFests and general events (stage 4c, PM.md): one
// profile per person, and the talks they have given. The profile edited here is the one
// every one of their talks shows; a talk itself is edited on DevFest > Speakers.

// The speaker's public card, exactly as the speaker portal shows it to them ("This is how you
// appear next to your talks"), with the full bio. Escape or the backdrop closes it.
function SpeakerPreviewDialog({ person, onClose }: { person: PersonWithTalks; onClose: () => void }) {
  const closeButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeButton.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Preview of ${person.name}'s speaker card`}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="fixed inset-0 z-40 flex justify-center bg-black/70 p-4 overflow-y-auto"
    >
      {/* my-auto rather than items-center: centred when it fits, and scrollable from its top
          when the card (a long bio) is taller than the screen, instead of cut off above. */}
      <div className="w-full max-w-sm my-auto py-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-sm text-white/70">How {person.name} appears next to their talks</p>
          <button
            ref={closeButton}
            type="button"
            onClick={onClose}
            aria-label="Close the preview"
            className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/[0.08] text-white/70 hover:bg-white/[0.14] hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-google-blue"
          >
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M4.47 4.47a.75.75 0 0 1 1.06 0L8 6.94l2.47-2.47a.75.75 0 1 1 1.06 1.06L9.06 8l2.47 2.47a.75.75 0 1 1-1.06 1.06L8 9.06l-2.47 2.47a.75.75 0 0 1-1.06-1.06L6.94 8 4.47 5.53a.75.75 0 0 1 0-1.06z" />
            </svg>
          </button>
        </div>
        <div className="rounded-3xl bg-black-02">
          <SpeakerCard profile={person} showFullBio viewer="organiser" />
        </div>
      </div>
    </div>,
    document.body
  );
}

function PersonCard({ person, onEdit, onPreview }: { person: PersonWithTalks; onEdit: () => void; onPreview: () => void }) {
  return (
    <div className="bg-surface border-l-4 border-l-google-blue rounded-lg p-5 sm:p-6" aria-label={`Speaker: ${person.name}`}>
      <div className="flex items-start gap-4">
        {person.photoUrl ? (
          <Image
            src={person.photoUrl}
            alt={person.name}
            width={48}
            height={48}
            className="w-12 h-12 rounded-full object-cover shrink-0"
          />
        ) : (
          <span className="flex items-center justify-center w-12 h-12 rounded-full bg-white/[0.08] text-white/70 text-sm font-bold shrink-0">
            {getInitials(person.name)}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-white text-lg leading-snug">{person.name}</h3>
          <p className="text-sm text-white/55 truncate">{person.email}</p>
          {person.tagline && <p className="mt-1 text-sm text-white/65">{person.tagline}</p>}
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-2">
          <button
            id={`preview-${person.id}`}
            type="button"
            onClick={onPreview}
            aria-label={`Preview ${person.name}'s public speaker card`}
            className="text-xs font-semibold px-3 py-2 rounded-lg border border-white/40 text-white/70 hover:border-white/60 hover:text-white transition-colors"
          >
            Preview
          </button>
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Edit ${person.name}'s profile`}
            className="text-xs font-semibold px-3 py-2 rounded-lg border border-white/40 text-white/70 hover:border-white/60 hover:text-white transition-colors"
          >
            Edit profile
          </button>
        </div>
      </div>

      {person.talks.length > 0 ? (
        <ul className="mt-4 space-y-1.5">
          {person.talks.map((talk) => (
            <li key={talk.talkId} className="text-sm text-white/65">
              <span className="font-mono text-xs text-white/55">{talk.eventName}</span>
              <span className="text-white/50"> &middot; </span>
              {talk.talkTitle}
              {!talk.isLead && <span className="text-white/50"> (co-speaker)</span>}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-white/50">No talks.</p>
      )}
    </div>
  );
}

export default function PeopleDashboard({ people }: { people: PersonWithTalks[] }) {
  const mobileBarHidden = useMobileBarHidden();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<PersonWithTalks | null>(null);
  const [previewing, setPreviewing] = useState<PersonWithTalks | null>(null);
  // Focus goes back to the Preview button that opened it.
  const closePreview = useCallback(() => {
    setPreviewing((current) => {
      if (current) requestAnimationFrame(() => document.getElementById(`preview-${current.id}`)?.focus());
      return null;
    });
  }, []);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const dismissAlert = useCallback(() => setAlertMessage(null), []);

  const query = search.trim().toLowerCase();
  const visiblePeople = people.filter(
    (person) =>
      !query ||
      person.name.toLowerCase().includes(query) ||
      person.email.toLowerCase().includes(query) ||
      person.talks.some((talk) => talk.talkTitle.toLowerCase().includes(query))
  );
  const repeatSpeakers = people.filter((person) => new Set(person.talks.map((talk) => talk.eventId)).size > 1).length;

  return (
    <>
      <div
        className={`sticky ${mobileBarHidden ? 'top-0' : 'top-[4.25rem]'} md:top-0 transition-[top] duration-300 ease-in-out z-20 w-full px-4 md:px-5 pt-2 md:pt-[1.125rem] pb-3 bg-black-02/95 backdrop-blur-sm`}
      >
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-off-white tracking-[-0.01em]">All speakers</h1>
            <p className="mt-0.5 text-sm text-white/55">
              {people.length} {people.length === 1 ? 'person' : 'people'} across every event
              {repeatSpeakers > 0 && <> &middot; {repeatSpeakers} at more than one</>}
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/55 pointer-events-none" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
              <circle cx="7" cy="7" r="5" />
              <path strokeLinecap="round" d="M11 11l3.5 3.5" />
            </svg>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, email or talk…"
              aria-label="Search speakers by name, email or talk title"
              className="w-full h-10 rounded-full bg-white/[0.06] border border-white/35 pl-9 pr-4 text-sm text-white placeholder:text-white/50 focus:outline-none focus:border-google-blue focus:ring-2 focus:ring-google-blue/40"
            />
          </div>
        </div>
      </div>

      <div className="px-4 md:px-5 pb-8 sm:pb-10">
        {visiblePeople.length === 0 ? (
          <div className="bg-surface border border-white/10 rounded-2xl p-12 text-center">
            <p className="text-sm text-white/50">{people.length === 0 ? 'No speakers yet.' : 'No speakers match this search.'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 items-start">
            {visiblePeople.map((person) => (
              <PersonCard key={person.id} person={person} onEdit={() => setEditing(person)} onPreview={() => setPreviewing(person)} />
            ))}
          </div>
        )}
      </div>

      {editing && (
        <EditSpeakerModal
          profileOnly
          speaker={{
            id: editing.id,
            talkId: '',
            coSpeakerOf: null,
            name: editing.name,
            email: editing.email,
            linkedinUrl: editing.linkedinUrl,
            githubUrl: editing.githubUrl,
            websiteUrl: editing.websiteUrl,
            bio: editing.bio,
            tagline: editing.tagline,
            photoUrl: editing.photoUrl,
            // Not shown or saved in profileOnly mode.
            talkTitle: '',
            abstract: '',
            format: 'talk',
            track: 'developer',
            experienceLevel: 'beginner',
          }}
          onClose={() => setEditing(null)}
          onError={(message) => {
            setEditing(null);
            setAlertMessage(message);
          }}
        />
      )}

      {previewing && <SpeakerPreviewDialog person={previewing} onClose={closePreview} />}

      {alertMessage && <Alert message={alertMessage} onDismiss={dismissAlert} />}
    </>
  );
}
