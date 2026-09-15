'use client';

import { useState, useTransition, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { removeFromCrew } from './crewActions';
import { sendVolunteerAcceptanceEmail } from './volunteerActions';
import EditCrewMemberModal from './EditCrewMemberModal';
import AddOrganiserModal from './AddOrganiserModal';
import Alert from '@/components/Alert';
import { formatDate, getInitials } from '@/lib/format';
import {
  VOLUNTEER_AREA_LABELS,
  VOLUNTEER_SHIFT_LABELS,
  VOLUNTEER_CONFIRMATION_CHIPS,
  GDG_ON_CAMPUS_CHAPTER_LABELS,
} from '@/lib/volunteerLabels';
import type { VolunteerArea, VolunteerConfirmation, VolunteerSubmission } from '@/lib/types';
import { useMobileBarHidden } from './MobileBarContext';

// Neither 'unassigned' nor 'organisers' is a VolunteerArea. 'unassigned' is the absence
// of one, and the filter reached for most while the roster is still being built;
// 'organisers' is the group that has a role instead of an area.
type FilterArea = 'all' | 'unassigned' | 'organisers' | VolunteerArea;
type FilterConfirmation = 'all' | VolunteerConfirmation;

function CrewAvatar({ member }: { member: VolunteerSubmission }) {
  return (
    <div className="w-14 h-14 rounded-full overflow-hidden bg-white/[0.06] shrink-0">
      {member.photoUrl ? (
        <Image src={member.photoUrl} alt={member.name} width={56} height={56} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-white/55 text-base font-bold" aria-hidden="true">
          {getInitials(member.name)}
        </div>
      )}
    </div>
  );
}

interface CrewCardProps {
  member: VolunteerSubmission;
  onError: (message: string) => void;
}

function CrewCard({ member, onError }: CrewCardProps) {
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const confirmation = VOLUNTEER_CONFIRMATION_CHIPS[member.confirmation];
  const isOrganiser = member.isOrganiser;

  useEffect(() => {
    if (!confirmingRemove) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setConfirmingRemove(false);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [confirmingRemove]);

  function handleRemove() {
    setConfirmingRemove(false);
    startTransition(async () => {
      const result = await removeFromCrew(member.id);
      if (result.error) onError(result.error);
    });
  }

  function handleSendAcceptanceEmail() {
    startTransition(async () => {
      const result = await sendVolunteerAcceptanceEmail(member.id);
      if (result.error) onError(result.error);
    });
  }

  const alreadyEmailed = Boolean(member.acceptanceEmailSentAt);
  // Someone who could be on the public page but isn't is the state an admin wants to see:
  // it is the only step left before they appear on /crew. An organiser has no
  // confirmation to wait on, so for them it is simply the unticked box.
  const awaitingPublish = !member.showOnCrewPage && (isOrganiser || member.confirmation === 'confirmed');

  function handleCardClick(event: React.MouseEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    if (target.closest('button, a, input, textarea, select, [role="menu"], [role="dialog"]')) return;
    if (window.getSelection()?.toString()) return;
    setIsOpen((open) => !open);
  }

  return (
    <div
      onClick={handleCardClick}
      className={`relative cursor-pointer bg-surface border-l-4 ${isOrganiser ? 'border-l-google-blue' : 'border-l-google-green'} rounded-lg p-4 sm:p-5 transition-colors hover:bg-white/[0.07] ${
        isPending ? 'opacity-50 pointer-events-none' : ''
      }`}
      aria-label={`${isOrganiser ? 'Organiser' : 'Crew member'} ${member.name}`}
    >
      <div className="flex items-start gap-4">
        <CrewAvatar member={member} />

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="font-bold text-white text-xl leading-snug tracking-tight">{member.name}</h3>
            {isOrganiser ? (
              <span
                title="Added to the crew by an admin rather than through the volunteer signup form."
                className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-google-blue/15 text-google-blue-light"
              >
                Organiser
              </span>
            ) : (
              <span title={confirmation.title} className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${confirmation.className}`}>
                {confirmation.label}
              </span>
            )}
          </div>

          <p className="mt-1.5 flex items-center gap-1.5 text-sm text-white/55 truncate">
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
              <rect x="1.5" y="3.5" width="13" height="9" rx="1.5" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2 4.5l6 5 6-5" />
            </svg>
            <span className="truncate">{member.email}</span>
          </p>
          {member.phone && (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-white/55 truncate">
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 2h2l1 3-1.5 1a8 8 0 004.5 4.5l1-1.5 3 1v2a1.5 1.5 0 01-1.5 1.5A10.5 10.5 0 012 3.5 1.5 1.5 0 013.5 2z" />
              </svg>
              <span className="truncate">{member.phone}</span>
            </p>
          )}

          <div className="flex flex-wrap items-center gap-1.5 gap-y-2 mt-3">
            {isOrganiser ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] leading-none px-2.5 py-1 rounded-full border border-white/10 bg-white/[0.06] font-bold text-google-blue-light">
                <span className="w-1.5 h-1.5 rounded-full bg-google-blue" aria-hidden="true" />
                {member.organiserRole || 'No role set'}
              </span>
            ) : member.assignedArea ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] leading-none px-2.5 py-1 rounded-full border border-white/10 bg-white/[0.06] font-bold text-google-green">
                <span className="w-1.5 h-1.5 rounded-full bg-google-green" aria-hidden="true" />
                {VOLUNTEER_AREA_LABELS[member.assignedArea]}
              </span>
            ) : (
              <span
                title="This volunteer has no area yet. Assign one from Edit so they know what they're doing on the day."
                className="inline-flex items-center text-[11px] leading-none px-2.5 py-1 rounded-full border font-bold bg-google-yellow/15 text-google-yellow border-google-yellow/25"
              >
                No area assigned
              </span>
            )}
            <span className="inline-flex items-center text-[11px] leading-none px-2.5 py-1 rounded-full border border-white/10 bg-white/[0.06] text-white/70 font-medium">
              {VOLUNTEER_SHIFT_LABELS[member.assignedShift]}
            </span>
            {member.isTorrensStudentOrStaff && (
              <span className="inline-flex items-center text-[11px] leading-none px-2.5 py-1 rounded-full border border-white/10 bg-white/[0.06] text-white/70 font-medium">
                Torrens
              </span>
            )}
            {member.hasBeenGdgOnCampusExec && (
              <span
                title="Has been on the exec team of a GDG on Campus chapter"
                className="inline-flex items-center text-[11px] leading-none px-2.5 py-1 rounded-full border border-white/10 bg-white/[0.06] text-white/70 font-medium"
              >
                GDG on Campus exec{member.gdgOnCampusChapter ? ` · ${GDG_ON_CAMPUS_CHAPTER_LABELS[member.gdgOnCampusChapter]}` : ''}
              </span>
            )}
            {member.showOnCrewPage ? (
              <span
                title={isOrganiser ? 'Listed on the public crew page and on the landing page.' : 'Listed on the public crew page, once they have confirmed.'}
                className="inline-flex items-center text-[11px] leading-none px-2.5 py-1 rounded-full border font-bold bg-google-blue/15 text-google-blue-light border-google-blue/25"
              >
                On the crew page
              </span>
            ) : (
              awaitingPublish && (
                <span
                  title={isOrganiser ? "Not listed publicly. Tick 'Show on the crew and landing pages' in Edit to name them on the site." : "Confirmed, but not listed publicly. Tick 'Show on the public crew page' in Edit once they've said they're happy to be named."}
                  className="inline-flex items-center text-[11px] leading-none px-2.5 py-1 rounded-full border font-bold bg-white/[0.06] text-white/60 border-white/10"
                >
                  Not on the crew page
                </span>
              )
            )}
            {member.dietaryRequirements && (
              <span
                title={member.dietaryRequirements}
                className="inline-flex items-center text-[11px] leading-none px-2.5 py-1 rounded-full border font-bold bg-google-yellow/15 text-google-yellow border-google-yellow/25"
              >
                Dietary needs
              </span>
            )}
          </div>

          <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
            <div className="overflow-hidden">
              {isOrganiser ? (
                member.linkedinUrl && (
                  <p className="mt-4 text-sm text-white/65 leading-relaxed truncate">
                    <span className="font-bold text-white/85">LinkedIn: </span>
                    <a
                      href={member.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${member.name} on LinkedIn`}
                      className="text-google-blue hover:underline"
                    >
                      {member.linkedinUrl}
                    </a>
                  </p>
                )
              ) : (
                <>
                  {member.areasOfInterest.length > 0 && (
                    <p className="mt-4 text-sm text-white/65 leading-relaxed">
                      <span className="font-bold text-white/85">Asked for: </span>
                      {member.areasOfInterest.map((area) => VOLUNTEER_AREA_LABELS[area]).join(', ')}
                    </p>
                  )}

                  <div className="mt-3 text-sm text-white/65 bg-white/[0.04] border border-white/10 rounded-lg px-4 py-3 leading-relaxed">
                    <span className="font-bold text-white/85">Why they signed up: </span>
                    <span className="whitespace-pre-wrap">{member.motivation}</span>
                  </div>
                </>
              )}

              {member.dietaryRequirements && (
                <p className="mt-3 text-sm text-white/65 leading-relaxed">
                  <span className="font-bold text-white/85">Dietary requirements: </span>
                  {member.dietaryRequirements}
                </p>
              )}

              <p className="mt-4 text-xs text-white/50">
                {isOrganiser ? 'Added' : 'Signed up'} {formatDate(member.submittedAt)}
                {member.acceptanceEmailSentAt && (
                  <>
                    {' '}&middot; Acceptance email sent {formatDate(member.acceptanceEmailSentAt)}
                    {member.acceptanceEmailSentBy && <> by {member.acceptanceEmailSentBy}</>}
                  </>
                )}
                {member.volunteerConfirmedAt ? (
                  <> &middot; Confirmed {formatDate(member.volunteerConfirmedAt)}</>
                ) : member.confirmByDate ? (
                  <> &middot; Confirmation due {formatDate(member.confirmByDate)}</>
                ) : null}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <button
            onClick={() => setEditing(true)}
            aria-label={`Edit ${member.name}`}
            title="Edit crew member"
            className="inline-flex items-center justify-center w-9 h-9 rounded-full text-white/70 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.5 2.5l2 2L5 13H3v-2l8.5-8.5z" />
            </svg>
          </button>

          {!isOrganiser && (
          <button
            onClick={handleSendAcceptanceEmail}
            disabled={isPending}
            aria-label={`${alreadyEmailed ? 'Resend' : 'Send'} the volunteer acceptance email to ${member.name}`}
            title={alreadyEmailed ? 'Resend acceptance email' : 'Send acceptance email'}
            className={`inline-flex items-center justify-center w-9 h-9 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              alreadyEmailed
                ? 'text-white/55 hover:text-white hover:bg-white/[0.08]'
                : 'bg-google-green/15 text-google-green hover:bg-google-green-deep hover:text-white'
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
              <rect x="1.5" y="3.5" width="13" height="9" rx="1.5" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2 4.5l6 4 6-4" />
            </svg>
          </button>
          )}

          {confirmingRemove ? (
            <div role="group" aria-label={`Confirm removing ${member.name}`} className="flex flex-col items-end gap-1.5 bg-[#2d2e31] border border-white/10 rounded-xl px-3 py-2.5 shadow-[0_12px_32px_rgba(0,0,0,0.45)] w-52">
              <p className="text-xs text-white/70 leading-snug text-left w-full">
                {isOrganiser
                  ? 'Remove this organiser? Their record is deleted, not returned to the signup queue.'
                  : 'Remove from the crew and put the signup back to pending?'}
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setConfirmingRemove(false)}
                  aria-label={`Keep ${isOrganiser ? 'this organiser' : 'this crew member'}`}
                  className="text-xs px-2.5 py-1 rounded-lg border border-white/40 text-white/50 hover:border-white/60 hover:text-white transition-colors"
                >
                  Keep
                </button>
                <button
                  onClick={handleRemove}
                  aria-label={`Remove ${member.name} from the crew`}
                  className="text-xs px-2.5 py-1 rounded-lg bg-google-red-deep text-white font-medium hover:opacity-90 transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmingRemove(true)}
              aria-label={`Remove ${member.name} from the crew`}
              title="Remove from crew"
              className="inline-flex items-center justify-center w-9 h-9 rounded-full text-white/55 hover:text-google-red-light hover:bg-google-red/[0.08] transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 4h11M6 4V2.5h4V4M4 4l.7 9h6.6l.7-9" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {editing && (
        <EditCrewMemberModal
          member={member}
          onClose={() => setEditing(false)}
          onError={(message) => {
            setEditing(false);
            onError(message);
          }}
        />
      )}
    </div>
  );
}

interface Props {
  crew: VolunteerSubmission[];
}

export default function CrewDashboard({ crew }: Props) {
  const mobileBarHidden = useMobileBarHidden();
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [addingOrganiser, setAddingOrganiser] = useState(false);
  const [areaFilter, setAreaFilter] = useState<FilterArea>('all');
  const [confirmationFilter, setConfirmationFilter] = useState<FilterConfirmation>('all');
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [confirmationMenuOpen, setConfirmationMenuOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const confirmationMenuRef = useRef<HTMLDivElement>(null);
  const searchWidthOpen = searchOpen || Boolean(search);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    if (!confirmationMenuOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (confirmationMenuRef.current && !confirmationMenuRef.current.contains(event.target as Node)) {
        setConfirmationMenuOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setConfirmationMenuOpen(false);
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [confirmationMenuOpen]);

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

  // Organisers have a role rather than an area, so they sit in their own bucket: they are
  // not "unassigned", and they belong to none of the nine areas.
  const matchesArea = (member: VolunteerSubmission, filter: FilterArea) => {
    if (filter === 'all') return true;
    if (filter === 'organisers') return member.isOrganiser;
    if (member.isOrganiser) return false;
    if (filter === 'unassigned') return member.assignedArea === '';
    return member.assignedArea === filter;
  };

  // Only areas somebody is actually rostered to are offered: a menu of nine areas with
  // eight zeroes in it is a list of things that haven't happened.
  const areaTabs: { value: FilterArea; label: string }[] = [
    { value: 'all', label: 'All areas' },
    ...(crew.some((member) => member.isOrganiser) ? [{ value: 'organisers' as const, label: 'Organisers' }] : []),
    ...(crew.some((member) => !member.isOrganiser && member.assignedArea === '')
      ? [{ value: 'unassigned' as const, label: 'No area assigned' }]
      : []),
    ...(Object.keys(VOLUNTEER_AREA_LABELS) as VolunteerArea[])
      .filter((area) => crew.some((member) => !member.isOrganiser && member.assignedArea === area))
      .map((area) => ({ value: area as FilterArea, label: VOLUNTEER_AREA_LABELS[area] })),
  ];

  const confirmationTabs: { value: FilterConfirmation; label: string }[] = [
    { value: 'all', label: 'Any status' },
    { value: 'not-emailed', label: VOLUNTEER_CONFIRMATION_CHIPS['not-emailed'].label },
    { value: 'awaiting', label: VOLUNTEER_CONFIRMATION_CHIPS.awaiting.label },
    { value: 'confirmed', label: VOLUNTEER_CONFIRMATION_CHIPS.confirmed.label },
  ];

  // Counted within the chosen confirmation, so the number on a tab is what clicking it
  // shows. Which tabs exist still comes from the whole crew, so the row doesn't reshuffle
  // under the cursor when the confirmation filter changes.
  const withinConfirmation = crew.filter(
    (member) => confirmationFilter === 'all' || (!member.isOrganiser && member.confirmation === confirmationFilter)
  );
  const areaCounts = new Map<FilterArea, number>(
    areaTabs.map((tab) => [tab.value, withinConfirmation.filter((member) => matchesArea(member, tab.value)).length])
  );
  // Confirmation is a volunteer's journey: an organiser was never emailed and has nothing
  // to confirm, so they count only under "Any status" and never as "Not emailed".
  const volunteers = crew.filter((member) => !member.isOrganiser);
  const confirmationCounts: Record<FilterConfirmation, number> = {
    all: crew.length,
    'not-emailed': volunteers.filter((member) => member.confirmation === 'not-emailed').length,
    awaiting: volunteers.filter((member) => member.confirmation === 'awaiting').length,
    confirmed: volunteers.filter((member) => member.confirmation === 'confirmed').length,
  };

  const notEmailedCount = confirmationCounts['not-emailed'];
  const confirmedCount = confirmationCounts.confirmed;
  const unassignedCount = volunteers.filter((member) => member.assignedArea === '').length;
  const organiserCount = crew.length - volunteers.length;

  const query = search.trim().toLowerCase();
  const filtered = crew
    .filter((member) => matchesArea(member, areaFilter))
    .filter((member) => confirmationFilter === 'all' || (!member.isOrganiser && member.confirmation === confirmationFilter))
    .filter(
      (member) =>
        !query ||
        member.name.toLowerCase().includes(query) ||
        member.email.toLowerCase().includes(query) ||
        member.phone.toLowerCase().includes(query)
    );

  return (
    <>
      <div className={`sticky ${mobileBarHidden ? 'top-0' : 'top-[4.25rem]'} md:top-0 transition-[top] duration-300 ease-in-out z-20 w-full px-4 md:px-5 pt-2 md:pt-[1.125rem] pb-3 bg-[#010103]/95 backdrop-blur-sm`}>
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-white tracking-tight">Crew</h1>
            <p className="mt-0.5 text-sm text-white/55">
              {crew.length} on the crew
              {organiserCount > 0 && <> &middot; {organiserCount} organiser{organiserCount === 1 ? '' : 's'}</>} &middot; {confirmedCount} confirmed
              {notEmailedCount > 0 && <> &middot; {notEmailedCount} not emailed</>}
              {unassignedCount > 0 && <> &middot; {unassignedCount} without an area</>}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <button
              onClick={() => setAddingOrganiser(true)}
              aria-label="Add an organiser to the crew"
              className="inline-flex items-center gap-1.5 h-10 text-sm px-4 rounded-full bg-google-blue-deep text-white font-bold transition-opacity hover:opacity-90 shrink-0"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
                <path strokeLinecap="round" d="M8 3.5v9M3.5 8h9" />
              </svg>
              Add organiser
            </button>

            <div
              ref={searchContainerRef}
              className={`relative shrink-0 h-10 rounded-full transition-all duration-300 ease-in-out ${
                searchWidthOpen ? 'w-full sm:w-80 bg-white/[0.06]' : 'w-10 bg-white/[0.06] hover:bg-white/[0.1]'
              }`}
            >
              <button
                onClick={() => setSearchOpen(true)}
                tabIndex={searchOpen || search ? -1 : undefined}
                aria-label="Search crew by name, email, or phone"
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
                onChange={(event) => setSearch(event.target.value)}
                tabIndex={searchOpen || search ? undefined : -1}
                placeholder="Search by name, email, or phone…"
                aria-label="Search crew by name, email, or phone"
                className={`w-full h-10 rounded-full bg-transparent pl-9 pr-9 py-0 text-sm text-white placeholder:text-white/50 focus:outline-none transition-opacity duration-200 ${
                  searchWidthOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              />
              <svg
                className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/55 pointer-events-none transition-opacity duration-200 ${
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
                className={`absolute right-2 top-1/2 -translate-y-1/2 text-white/55 hover:text-white/70 transition-opacity duration-200 ${
                  searchWidthOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
                  <path strokeLinecap="round" d="M4 4l8 8M12 4l-8 8" />
                </svg>
              </button>
            </div>

            {(searchOpen || search) && <div className="basis-full h-0 sm:hidden" aria-hidden="true" />}

            <div className="relative shrink-0" ref={confirmationMenuRef}>
              <button
                onClick={() => setConfirmationMenuOpen((open) => !open)}
                aria-haspopup="menu"
                aria-expanded={confirmationMenuOpen}
                aria-label="Filter crew by confirmation status"
                className={`inline-flex items-center gap-2 h-10 text-sm px-4 rounded-full transition-colors font-bold ${
                  confirmationMenuOpen ? 'bg-white/[0.12] text-white' : 'bg-white/[0.06] text-white/70 hover:bg-white/[0.1] hover:text-white'
                }`}
              >
                {confirmationTabs.find((tab) => tab.value === confirmationFilter)?.label}
                <span className="font-medium text-white/60">{confirmationCounts[confirmationFilter]}</span>
                <svg className={`w-3 h-3 text-white/55 transition-transform ${confirmationMenuOpen ? 'rotate-180' : ''}`} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 4.5l3.5 3.5 3.5-3.5" />
                </svg>
              </button>

              {confirmationMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full mt-2 w-56 bg-[#2d2e31] border border-white/10 rounded-2xl shadow-[0_12px_32px_rgba(0,0,0,0.45)] overflow-hidden py-1.5 z-30"
                >
                  {confirmationTabs.map((tab) => (
                    <button
                      key={tab.value}
                      role="menuitem"
                      onClick={() => {
                        setConfirmationFilter(tab.value);
                        setConfirmationMenuOpen(false);
                      }}
                      aria-pressed={confirmationFilter === tab.value}
                      className={`w-full flex items-center justify-between gap-3 text-left text-sm px-4 py-2.5 transition-colors ${
                        confirmationFilter === tab.value ? 'bg-white/[0.08] text-white font-bold' : 'text-white/70 font-medium hover:bg-white/[0.08] hover:text-white'
                      }`}
                    >
                      {tab.label}
                      <span className="text-white/55">{confirmationCounts[tab.value]}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Assigned area as a tab row, matching /admin/volunteers and /admin/showcase:
            confirmation is a menu because a crew member is in exactly one state, while the
            area row doubles as the roster at a glance. */}
        <div
          role="group"
          aria-label="Filter crew by assigned area"
          className="mt-3 -mx-4 md:-mx-5 px-4 md:px-5 flex items-center gap-2 overflow-x-auto"
        >
          {areaTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setAreaFilter(tab.value)}
              aria-pressed={areaFilter === tab.value}
              aria-label={tab.value === 'all' ? 'Show the whole crew' : `Show crew in: ${tab.label}`}
              className={`shrink-0 inline-flex items-center gap-2 h-9 text-sm px-4 rounded-full transition-colors font-bold ${
                areaFilter === tab.value
                  ? 'bg-white/[0.12] text-white'
                  : 'bg-white/[0.06] text-white/70 hover:bg-white/[0.1] hover:text-white'
              }`}
            >
              {tab.label}
              <span className="font-medium text-white/60">{areaCounts.get(tab.value) ?? 0}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 md:px-5 pb-8 sm:pb-10">
        {crew.length === 0 ? (
          <div className="bg-surface border border-white/10 rounded-2xl p-12 text-center">
            <p className="text-sm text-white/50">
              No crew yet. Accept a signup on the Volunteers page, or add an organiser with the button above.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-surface border border-white/10 rounded-2xl p-12 text-center">
            <p className="text-sm text-white/50">No crew members match this filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 items-start">
            {filtered.map((member) => (
              <CrewCard key={member.id} member={member} onError={setAlertMessage} />
            ))}
          </div>
        )}
      </div>

      {addingOrganiser && (
        <AddOrganiserModal
          onClose={() => setAddingOrganiser(false)}
          onError={(message) => {
            setAddingOrganiser(false);
            setAlertMessage(message);
          }}
        />
      )}

      {alertMessage && <Alert message={alertMessage} onDismiss={dismissAlert} />}
    </>
  );
}
