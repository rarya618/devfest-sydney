'use client';

import { useCallback, useEffect, useRef, useState, useTransition, type FormEvent, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Alert from '@/components/Alert';
import FormattingHelp from '@/components/FormattingHelp';
import { errorClass, hintClass, inputError, inputNormal, labelClass, optionButtonClass } from '@/lib/formStyles';
import { primaryButton, secondaryButton, subsectionHeading } from './portalStyles';
import { MEETUP_FORMAT_LABELS, MEETUP_FORMATS, MEETUP_PROPOSAL_LIMITS } from '@/lib/meetupProposalLabels';
import type { PortalEditableProposal, PortalProfile } from '@/lib/portalData';
import { findSavedTalkError, type SavedTalkFields } from '@/lib/portalLabels';
import type { MeetupFormat } from '@/lib/types';
import { saveTalkForLater, submitPortalProposal, updatePortalProposal } from './actions';
import Select from '@/components/Select';

type ProposalKind = 'meetup' | 'devfest';
type DevfestTrack = 'developer' | 'builder' | 'workshop';
type DevfestFormat = 'talk' | 'lightning-talk' | 'workshop';
type DevfestLevel = 'beginner' | 'intermediate' | 'advanced';

interface ProposalFormProps {
  profiles: Omit<PortalProfile, 'talks'>[];
  // The current DevFest, when its Call for Speakers is open.
  openDevfest: { name: string; closesAt: string | null } | null;
  savedTalks: (SavedTalkFields & { id: string })[];
  // The saved talk to start from (its Propose button), or null for a blank form.
  initialSavedTalkId: string | null;
  // Closes the panel the form sits in on the dashboard.
  onClose: () => void;
  // A pending proposal of the speaker's to change instead of filing a new one. The event, the
  // name and the saved talk it came from are fixed; everything else starts from what was sent.
  editing?: { proposalId: string; proposal: PortalEditableProposal } | null;
}

const DEVFEST_ABSTRACT_MAX = 2000;
// /admin/devfest/speakers' limit, which an accepted DevFest talk's title is held to (proposalFiling.ts).
const DEVFEST_TALK_TITLE_MAX = 150;

const DEVFEST_TRACKS: { value: DevfestTrack; label: string; description: string }[] = [
  { value: 'developer', label: 'Developer Track', description: 'Technical sessions for professional engineers.' },
  { value: 'builder', label: 'Builder Track', description: 'For product managers, designers and founders.' },
  { value: 'workshop', label: 'Workshops Track', description: 'Hands-on: attendees build alongside you.' },
];
const DEVFEST_FORMATS: { value: DevfestFormat; label: string }[] = [
  { value: 'talk', label: 'Talk (30 min)' },
  { value: 'lightning-talk', label: 'Lightning talk (10 min)' },
  { value: 'workshop', label: 'Workshop' },
];
const DEVFEST_LEVELS: { value: DevfestLevel; label: string }[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

const DEVFEST_CHECKBOXES: { key: string; label: string }[] = [
  { key: 'isFirstTimeSpeaker', label: 'This would be my first time speaking at a conference' },
  { key: 'wantsMentoring', label: 'I would like some speaker mentoring to help me prepare' },
  { key: 'hasSpokenAtGdgSydneyBefore', label: 'I have spoken at a GDG Sydney event before' },
  { key: 'isGoogleDeveloperExpert', label: 'I am a Google Developer Expert (GDE)' },
  { key: 'isOpenToAudienceQuestions', label: 'I am happy to take audience questions after my session' },
  { key: 'optOutOfRecording', label: 'I would prefer my session not be recorded' },
  { key: 'requiresTravelSupport', label: 'I would need travel support to attend' },
];

// A stored choice, if it is still one of the options; otherwise none, so the speaker picks again.
function knownChoice<Value extends string>(options: readonly { value: Value }[] | readonly Value[], stored: string | undefined): Value | '' {
  const values = options.map((option) => (typeof option === 'string' ? option : option.value));
  return values.find((value) => value === stored) ?? '';
}

// The fields under "About you", which open that section when one of them needs fixing.
const ABOUT_FIELD_IDS: ReadonlySet<string> = new Set(['proposal-name', 'proposal-bio']);

const required = <span className="text-google-red-light" aria-hidden="true"> *</span>;
const checkboxClass = 'mt-0.5 w-5 h-5 shrink-0 accent-google-blue focus:outline-none focus:ring-2 focus:ring-google-blue';

function Choice<Value extends string>({
  id,
  name,
  legend,
  options,
  selected,
  onSelect,
  error,
}: {
  id: string;
  name: string;
  legend: ReactNode;
  options: { value: Value; label: string; description?: string }[];
  selected: Value | '';
  onSelect: (value: Value) => void;
  error?: string;
}) {
  return (
    <fieldset id={id} aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-error` : undefined}>
      <legend className={labelClass}>{legend}</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((option) => (
          <label
            key={option.value}
            className={`block cursor-pointer rounded-2xl border px-4 py-3 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-google-blue ${optionButtonClass(selected === option.value, Boolean(error))}`}
          >
            <input type="radio" name={name} value={option.value} checked={selected === option.value} onChange={() => onSelect(option.value)} className="sr-only" />
            <span className="block text-sm font-bold">{option.label}</span>
            {option.description && <span className="block mt-1 text-xs text-white/60">{option.description}</span>}
          </label>
        ))}
      </div>
      {error && <p id={`${id}-error`} className={errorClass}>{error}</p>}
    </fieldset>
  );
}

function TextField({
  id,
  label,
  value,
  onChange,
  isRequired = false,
  maxLength,
  hint,
  rows,
  placeholder,
  formatLabel,
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  isRequired?: boolean;
  maxLength?: number;
  hint?: string;
  rows?: number;
  placeholder?: string;
  /** For a text box whose text is rendered with MarkdownText: what it holds, as the copied
      prompt names it ("talk abstract"). Adds the formatting line and the copy-prompt button. */
  formatLabel?: string;
  // A problem found when sending, shown under the field until it changes.
  error?: string;
}) {
  const formatId = rows && formatLabel ? `${id}-format` : undefined;
  const describedBy = [error ? `${id}-error` : '', hint ? `${id}-hint` : '', formatId ?? ''].filter(Boolean).join(' ') || undefined;
  const fieldClass = error ? inputError : inputNormal;
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
        {isRequired && required}
      </label>
      {rows ? (
        <textarea id={id} rows={rows} value={value} maxLength={maxLength} required={isRequired} placeholder={placeholder} aria-invalid={error ? true : undefined} aria-describedby={describedBy} onChange={(event) => onChange(event.target.value)} className={`${fieldClass} resize-y`} />
      ) : (
        <input id={id} value={value} maxLength={maxLength} required={isRequired} placeholder={placeholder} aria-invalid={error ? true : undefined} aria-describedby={describedBy} onChange={(event) => onChange(event.target.value)} className={fieldClass} />
      )}
      {error && <p id={`${id}-error`} className={errorClass}>{error}</p>}
      {hint && <p id={`${id}-hint`} className={hintClass}>{hint}</p>}
      {formatId && formatLabel && <FormattingHelp id={formatId} label={formatLabel} value={value} />}
    </div>
  );
}

// A form section: its own heading, so the long DevFest form reads as three short ones.
function FormSection({ id, title, note, children }: { id: string; title: string; note?: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="space-y-6">
      <div>
        <h3 id={id} className={subsectionHeading}>{title}</h3>
        {note && <p className="mt-1 text-sm text-white/60">{note}</p>}
      </div>
      {children}
    </section>
  );
}

type FieldErrors = Record<string, string>;

export default function ProposalForm({ profiles, openDevfest, savedTalks, initialSavedTalkId, onClose, editing = null }: ProposalFormProps) {
  const router = useRouter();
  const isEditing = editing !== null;
  const editingMeetup = editing?.proposal.kind === 'meetup' ? editing.proposal.fields : null;
  const editingDevfest = editing?.proposal.kind === 'devfest' ? editing.proposal.fields : null;
  // An accepted DevFest talk: only its title and abstract are the speaker's to change
  // (editAcceptedDevfestTalk); track, format and level are the organisers'.
  const isAcceptedDevfestTalk = editing?.proposal.kind === 'devfest' && editing.proposal.isAccepted;
  // An accepted meetup talk keeps its format: it's on the night's running order.
  const isAcceptedMeetupTalk = editing?.proposal.kind === 'meetup' && editing.proposal.isAccepted;
  const initialSavedTalk = isEditing ? null : savedTalks.find((savedTalk) => savedTalk.id === initialSavedTalkId) ?? null;
  const [savedTalkId, setSavedTalkId] = useState<string | null>(initialSavedTalk?.id ?? null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const firstProfile = profiles[0] ?? null;
  const [kind, setKind] = useState<ProposalKind>(editing?.proposal.kind ?? 'meetup');
  const [profileId, setProfileId] = useState<string>(firstProfile?.id ?? '');
  const [name, setName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  // The field to put the speaker in once the errors have rendered (it may be in a section that
  // has only just opened).
  const [focusFieldId, setFocusFieldId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<'send' | 'save'>('send');
  const [isPending, startTransition] = useTransition();
  const dismissAlert = useCallback(() => setAlertMessage(null), []);
  const successBox = useRef<HTMLDivElement>(null);

  const profile = profiles.find((candidate) => candidate.id === profileId) ?? null;
  // "About you" starts folded away when it would only repeat a profile that already has a bio.
  const [isAboutOpen, setIsAboutOpen] = useState(isEditing || !firstProfile?.bio.trim());

  // Shared between both kinds.
  const [talkTitle, setTalkTitle] = useState(editing?.proposal.fields.talkTitle ?? initialSavedTalk?.talkTitle ?? '');
  const [abstract, setAbstract] = useState(editing?.proposal.fields.abstract ?? initialSavedTalk?.abstract ?? '');
  const [bio, setBio] = useState(editingMeetup?.bio ?? editingDevfest?.speakerBio ?? firstProfile?.bio ?? '');

  // Meetup.
  const [meetupFormat, setMeetupFormat] = useState<MeetupFormat | ''>(knownChoice(MEETUP_FORMATS, editingMeetup?.format));
  const [audience, setAudience] = useState(editingMeetup?.audience ?? initialSavedTalk?.audience ?? '');
  const [profileUrl, setProfileUrl] = useState(editingMeetup ? editingMeetup.profileUrl : firstProfile?.linkedinUrl || firstProfile?.websiteUrl || '');
  const [speakingExperience, setSpeakingExperience] = useState(editingMeetup?.speakingExperience ?? '');
  const [notes, setNotes] = useState(editingMeetup?.notes ?? '');

  // DevFest.
  const [track, setTrack] = useState<DevfestTrack | ''>(knownChoice(DEVFEST_TRACKS, editingDevfest?.track));
  const [devfestFormat, setDevfestFormat] = useState<DevfestFormat | ''>(knownChoice(DEVFEST_FORMATS, editingDevfest?.format));
  const [level, setLevel] = useState<DevfestLevel | ''>(knownChoice(DEVFEST_LEVELS, editingDevfest?.experienceLevel));
  const [tagline, setTagline] = useState(editingDevfest ? editingDevfest.speakerTagline : firstProfile?.tagline ?? '');
  const [linkedinUrl, setLinkedinUrl] = useState(editingDevfest ? editingDevfest.linkedinUrl : firstProfile?.linkedinUrl ?? '');
  const [githubUrl, setGithubUrl] = useState(editingDevfest ? editingDevfest.githubUrl : firstProfile?.githubUrl ?? '');
  const [websiteUrl, setWebsiteUrl] = useState(editingDevfest ? editingDevfest.websiteUrl : firstProfile?.websiteUrl ?? '');
  const [previousTalkLink, setPreviousTalkLink] = useState(editingDevfest?.previousTalkLink ?? '');
  const [howDidYouHear, setHowDidYouHear] = useState(editingDevfest?.howDidYouHear ?? '');
  const [coSpeakerEmails, setCoSpeakerEmails] = useState(editingDevfest?.coSpeakerEmails ?? '');
  const [accessibilityNeeds, setAccessibilityNeeds] = useState(editingDevfest?.accessibilityNeeds ?? '');
  const [travelSupportLocation, setTravelSupportLocation] = useState(editingDevfest?.travelSupportLocation ?? '');
  const [checks, setChecks] = useState<Record<string, boolean>>(
    editingDevfest
      ? Object.fromEntries(DEVFEST_CHECKBOXES.map((box) => [box.key, editingDevfest[box.key as keyof typeof editingDevfest] === true]))
      : { isOpenToAudienceQuestions: true }
  );

  // Errors render first, then focus moves: to a text field itself, or to a choice's first option.
  useEffect(() => {
    if (!focusFieldId) return;
    const target = document.getElementById(focusFieldId);
    const focusable = target instanceof HTMLFieldSetElement ? target.querySelector('input') : target;
    focusable?.focus();
    setFocusFieldId(null);
  }, [focusFieldId]);

  // The submit button goes when the form is replaced by the confirmation, so focus follows it.
  useEffect(() => {
    if (submitted) successBox.current?.focus();
  }, [submitted]);

  // A field's setter that also clears the problem shown under it.
  function edited<Value>(fieldId: string, setter: (value: Value) => void) {
    return (value: Value) => {
      setter(value);
      setFieldErrors((previous) => {
        if (!(fieldId in previous)) return previous;
        const next = { ...previous };
        delete next[fieldId];
        return next;
      });
    };
  }

  function showFieldErrors(errors: [string, string][]) {
    setFieldErrors(Object.fromEntries(errors));
    if (errors.some(([fieldId]) => ABOUT_FIELD_IDS.has(fieldId))) setIsAboutOpen(true);
    setFocusFieldId(errors[0][0]);
  }

  function chooseProfile(nextId: string) {
    setProfileId(nextId);
    const next = profiles.find((candidate) => candidate.id === nextId);
    if (!next) return;
    setBio(next.bio);
    setTagline(next.tagline);
    setLinkedinUrl(next.linkedinUrl);
    setGithubUrl(next.githubUrl);
    setWebsiteUrl(next.websiteUrl);
    setProfileUrl(next.linkedinUrl || next.websiteUrl);
    if (!next.bio.trim()) setIsAboutOpen(true);
  }

  function startFromSavedTalk(nextId: string) {
    const savedTalk = savedTalks.find((candidate) => candidate.id === nextId) ?? null;
    setSavedTalkId(savedTalk?.id ?? null);
    setSavedMessage(null);
    if (!savedTalk) return;
    setTalkTitle(savedTalk.talkTitle);
    setAbstract(savedTalk.abstract);
    setAudience(savedTalk.audience);
  }

  // Keeps the title, abstract and audience under Saved talks without sending anything: a new
  // saved talk, or an update to the one the form started from.
  function handleSaveForLater() {
    setAlertMessage(null);
    const fields = { talkTitle, abstract, audience };
    if (!talkTitle.trim()) {
      showFieldErrors([['proposal-title', 'Give the talk a title to save it.']]);
      return;
    }
    const problem = findSavedTalkError(fields);
    if (problem) {
      setAlertMessage(problem);
      return;
    }
    setPendingAction('save');
    startTransition(async () => {
      const result = await saveTalkForLater(savedTalkId, fields);
      if ('error' in result) setAlertMessage(result.error);
      else {
        setSavedTalkId(result.savedTalkId);
        setSavedMessage('Saved under Saved talks. Nothing has been sent.');
        router.refresh();
      }
    });
  }

  // Every required field left empty, in the order they appear on the form.
  function findMissingFields(): [string, string][] {
    const missing: [string, string][] = [];
    if (!talkTitle.trim()) missing.push(['proposal-title', 'Give your talk a title.']);
    if (!abstract.trim()) missing.push(['proposal-abstract', 'Add an abstract: what the session is about.']);
    if (kind === 'meetup') {
      if (!meetupFormat && !isAcceptedMeetupTalk) missing.push(['meetup-format', 'Choose a format.']);
      if (!audience.trim()) missing.push(['proposal-audience', 'Say who the talk is for.']);
      if (!isEditing && !profile && !name.trim()) missing.push(['proposal-name', 'Enter your full name.']);
      if (!bio.trim()) missing.push(['proposal-bio', 'Add a short bio.']);
    } else if (!isAcceptedDevfestTalk) {
      if (!track) missing.push(['devfest-track', 'Choose a track.']);
      if (!devfestFormat) missing.push(['devfest-format', 'Choose a format.']);
      if (!level) missing.push(['devfest-level', 'Choose a level.']);
      if (!isEditing && !profile && !name.trim()) missing.push(['proposal-name', 'Enter your full name.']);
      if (checks.requiresTravelSupport && !travelSupportLocation.trim()) missing.push(['proposal-travel', "Say which city you'd travel from."]);
    }
    return missing;
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setAlertMessage(null);
    const missing = findMissingFields();
    if (missing.length > 0) {
      showFieldErrors(missing);
      return;
    }
    const fields: Record<string, unknown> =
      kind === 'meetup'
        ? { talkTitle, format: meetupFormat, abstract, audience, bio, profileUrl, speakingExperience, notes }
        : {
            talkTitle,
            abstract,
            track,
            format: devfestFormat,
            experienceLevel: level,
            linkedinUrl,
            githubUrl,
            websiteUrl,
            speakerTagline: tagline,
            speakerBio: bio,
            previousTalkLink,
            howDidYouHear,
            coSpeakerEmails,
            accessibilityNeeds,
            travelSupportLocation: checks.requiresTravelSupport ? travelSupportLocation : '',
            ...Object.fromEntries(DEVFEST_CHECKBOXES.map((box) => [box.key, checks[box.key] === true])),
          };
    setPendingAction('send');
    startTransition(async () => {
      const result = editing
        ? await updatePortalProposal(editing.proposal.kind, editing.proposalId, fields)
        : await submitPortalProposal({ kind, profileId: profile?.id ?? null, name, savedTalkId, fields });
      if (result.error) {
        setAlertMessage(result.error);
        // An edit can be refused because an organiser has just decided; the list underneath then
        // drops its Edit button.
        if (editing) router.refresh();
      }
      else {
        setSubmitted(true);
        // The new proposal appears in the list underneath straight away.
        router.refresh();
      }
    });
  }

  if (submitted) {
    return (
      <div ref={successBox} tabIndex={-1} role="status" className="rounded-3xl bg-google-green/10 px-6 py-6 sm:px-8 focus:outline-none">
        <p className="text-xl font-bold text-google-green mb-3">{isEditing ? 'Changes saved' : 'Proposal sent'}</p>
        <p className="text-white/70 leading-relaxed mb-6">
          {editing?.proposal.isAccepted
            ? 'The event page shows the updated version. You can keep changing it until the event.'
            : isEditing
            ? 'Our organisers will read the updated version. You can keep changing it until they make a decision.'
            : <>Thanks! We&rsquo;ve emailed you a copy, and it&rsquo;s under Proposals below. Once our organisers have decided, we&rsquo;ll email you and the steps there will move on.</>}
        </p>
        <button type="button" onClick={onClose} aria-label="Close the proposal form" className={secondaryButton}>
          Close
        </button>
      </div>
    );
  }

  const kindOptions: { value: ProposalKind; label: string; description: string }[] = [
    { value: 'meetup', label: 'A GDG Sydney meetup', description: 'Monthly evening events. We pick the meetup that fits.' },
    ...(openDevfest
      ? [{ value: 'devfest' as const, label: openDevfest.name, description: openDevfest.closesAt ? `Call for Speakers closes ${new Date(openDevfest.closesAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', timeZone: 'Australia/Sydney' })}.` : 'Call for Speakers open now.' }]
      : []),
  ];

  const bioHint = profile && !isEditing ? 'Filled in from your badge. Changing it here changes only this proposal.' : undefined;
  const aboutSummary = kind === 'meetup' ? 'your bio and link' : 'your tagline, bio and links';

  const aboutYou = (
    <FormSection id="proposal-about-heading" title="About you">
      {isEditing ? null : profiles.length > 1 ? (
        <div>
          <label htmlFor="proposal-profile" className={labelClass}>Proposing as</label>
          <Select
            id="proposal-profile"
            size="base"
            value={profileId}
            onChange={chooseProfile}
            options={profiles.map((candidate) => ({ value: candidate.id, label: candidate.name }))}
            className={inputNormal}
          />
        </div>
      ) : profile ? (
        <p className="text-white/70">Proposing as <span className="font-bold text-white">{profile.name}</span>.</p>
      ) : (
        <TextField id="proposal-name" label="Your full name" value={name} onChange={edited('proposal-name', setName)} isRequired maxLength={MEETUP_PROPOSAL_LIMITS.name} error={fieldErrors['proposal-name']} />
      )}

      {!isAboutOpen ? (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-white/15 px-5 py-4">
          <p className="text-sm text-white/70 leading-relaxed">We&rsquo;ll send {aboutSummary} from your badge with it.</p>
          <button type="button" onClick={() => setIsAboutOpen(true)} aria-label={`Change ${aboutSummary} for this proposal`} className={`${secondaryButton} self-start shrink-0`}>
            Change for this proposal
          </button>
        </div>
      ) : kind === 'meetup' ? (
        <>
          <TextField id="proposal-bio" label="Speaker bio" value={bio} onChange={edited('proposal-bio', setBio)} isRequired rows={5} maxLength={MEETUP_PROPOSAL_LIMITS.bio} hint={bioHint} formatLabel="speaker bio" error={fieldErrors['proposal-bio']} />
          <TextField id="proposal-profile-url" label="LinkedIn or website" value={profileUrl} onChange={setProfileUrl} maxLength={MEETUP_PROPOSAL_LIMITS.profileUrl} />
        </>
      ) : (
        <>
          <TextField id="proposal-tagline" label="Tagline" value={tagline} onChange={setTagline} maxLength={200} hint="Your role and company, or a one-line intro." />
          <TextField id="proposal-devfest-bio" label="Speaker bio" value={bio} onChange={setBio} rows={5} maxLength={1000} hint={bioHint} formatLabel="speaker bio" />
          <div className="grid gap-6 sm:grid-cols-3">
            <TextField id="proposal-linkedin" label="LinkedIn" value={linkedinUrl} onChange={setLinkedinUrl} maxLength={500} />
            <TextField id="proposal-github" label="GitHub" value={githubUrl} onChange={setGithubUrl} maxLength={500} />
            <TextField id="proposal-website" label="Website" value={websiteUrl} onChange={setWebsiteUrl} maxLength={500} />
          </div>
        </>
      )}
    </FormSection>
  );

  return (
    <>
      <form onSubmit={handleSubmit} noValidate className="space-y-12">
        {editing ? (
          <p className="text-white/70">Proposed as <span className="font-bold text-white">{editing.proposal.name}</span>.</p>
        ) : openDevfest ? (
          <Choice id="proposal-kind" name="kind" legend="Where would you like to speak?" options={kindOptions} selected={kind} onSelect={setKind} />
        ) : (
          <p className="text-white/70 leading-relaxed">
            <span className="font-bold text-white">To a GDG Sydney meetup.</span> We pick the one that fits your talk.
            <span className={`block ${hintClass}`}>DevFest&rsquo;s Call for Speakers isn&rsquo;t open right now. It will appear here when it is.</span>
          </p>
        )}

        <FormSection id="proposal-talk-heading" title="Your talk">
          {!isEditing && savedTalks.length > 0 && (
            <div>
              <label htmlFor="proposal-saved-talk" className={labelClass}>Start from a saved talk</label>
              <Select
                id="proposal-saved-talk"
                size="base"
                value={savedTalkId ?? ''}
                onChange={startFromSavedTalk}
                options={[
                  { value: '', label: 'A new talk' },
                  ...savedTalks.map((savedTalk) => ({ value: savedTalk.id, label: savedTalk.talkTitle })),
                ]}
                className={inputNormal}
              />
              <p className={hintClass}>Fills in the title, abstract and audience. Changes here are only for this proposal unless you save them.</p>
            </div>
          )}

          <TextField
            id="proposal-title"
            label="Talk title"
            value={talkTitle}
            onChange={edited('proposal-title', setTalkTitle)}
            isRequired
            maxLength={isAcceptedDevfestTalk ? DEVFEST_TALK_TITLE_MAX : MEETUP_PROPOSAL_LIMITS.talkTitle}
            error={fieldErrors['proposal-title']}
          />
          <TextField
            id="proposal-abstract"
            label="Abstract"
            value={abstract}
            onChange={edited('proposal-abstract', setAbstract)}
            isRequired
            rows={7}
            maxLength={kind === 'meetup' ? MEETUP_PROPOSAL_LIMITS.abstract : DEVFEST_ABSTRACT_MAX}
            hint="What is your session about, and what will people take away?"
            formatLabel="talk abstract"
            error={fieldErrors['proposal-abstract']}
          />

          {isAcceptedDevfestTalk ? (
            <p className={hintClass}>
              Your track, format and level are set by our organisers: reply to any of our emails to change them. Your bio, photo and links are on your badge, under Edit badge.
            </p>
          ) : kind === 'meetup' ? (
            <>
              {isAcceptedMeetupTalk ? (
                <div>
                  <p className={labelClass}>Format</p>
                  <p className="text-white/85">{meetupFormat ? MEETUP_FORMAT_LABELS[meetupFormat] : 'Not set'}</p>
                  <p className={hintClass}>Set by our organisers now that your talk is on the programme. Reply to any of our emails to change it.</p>
                </div>
              ) : (
                <Choice
                  id="meetup-format"
                  name="meetup-format"
                  legend={<>Format{required}</>}
                  options={MEETUP_FORMATS.map((format) => ({ value: format, label: MEETUP_FORMAT_LABELS[format] }))}
                  selected={meetupFormat}
                  onSelect={edited('meetup-format', setMeetupFormat)}
                  error={fieldErrors['meetup-format']}
                />
              )}
              <TextField id="proposal-audience" label="Who is it for?" value={audience} onChange={edited('proposal-audience', setAudience)} isRequired rows={3} maxLength={MEETUP_PROPOSAL_LIMITS.audience} hint="The level and background you have in mind." formatLabel="target audience" error={fieldErrors['proposal-audience']} />
            </>
          ) : (
            <>
              <Choice id="devfest-track" name="devfest-track" legend={<>Track{required}</>} options={DEVFEST_TRACKS} selected={track} onSelect={edited('devfest-track', setTrack)} error={fieldErrors['devfest-track']} />
              <Choice id="devfest-format" name="devfest-format" legend={<>Format{required}</>} options={DEVFEST_FORMATS} selected={devfestFormat} onSelect={edited('devfest-format', setDevfestFormat)} error={fieldErrors['devfest-format']} />
              <Choice id="devfest-level" name="devfest-level" legend={<>Level{required}</>} options={DEVFEST_LEVELS} selected={level} onSelect={edited('devfest-level', setLevel)} error={fieldErrors['devfest-level']} />
            </>
          )}
        </FormSection>

        {!isAcceptedDevfestTalk && aboutYou}

        {isAcceptedDevfestTalk ? null : kind === 'meetup' ? (
          <FormSection id="proposal-extra-heading" title="Anything else" note="Optional.">
            <TextField id="proposal-experience" label="Speaking experience" value={speakingExperience} onChange={setSpeakingExperience} rows={3} maxLength={MEETUP_PROPOSAL_LIMITS.speakingExperience} hint="Links to past talks are welcome. First-timers too." formatLabel="speaking experience" />
            <TextField id="proposal-notes" label="Notes for the organisers" value={notes} onChange={setNotes} rows={3} maxLength={MEETUP_PROPOSAL_LIMITS.notes} hint="Dates that suit you, equipment you need, anything we should know." formatLabel="notes" />
          </FormSection>
        ) : (
          <FormSection id="proposal-extra-heading" title="Anything else" note="Optional, but it helps us plan.">
            <TextField id="proposal-previous-talk" label="A previous talk" value={previousTalkLink} onChange={setPreviousTalkLink} maxLength={500} hint="A recording or slides, if you have one." />
            <TextField id="proposal-co-speakers" label="Co-speakers' emails" value={coSpeakerEmails} onChange={setCoSpeakerEmails} maxLength={500} hint="Separate them with commas." />
            <TextField id="proposal-accessibility" label="Accessibility needs" value={accessibilityNeeds} onChange={setAccessibilityNeeds} rows={3} maxLength={1000} hint="Anything you need to present comfortably." />
            <TextField id="proposal-how-heard" label="How did you hear about us?" value={howDidYouHear} onChange={setHowDidYouHear} maxLength={300} />
            <fieldset className="space-y-4">
              <legend className={labelClass}>Tick any that apply</legend>
              {DEVFEST_CHECKBOXES.map((box) => (
                <label key={box.key} htmlFor={`proposal-${box.key}`} className="flex items-start gap-3 cursor-pointer">
                  <input
                    id={`proposal-${box.key}`}
                    type="checkbox"
                    checked={checks[box.key] === true}
                    onChange={(event) => setChecks((previous) => ({ ...previous, [box.key]: event.target.checked }))}
                    className={checkboxClass}
                  />
                  <span className="text-white/85">{box.label}</span>
                </label>
              ))}
            </fieldset>
            {checks.requiresTravelSupport && (
              <TextField id="proposal-travel" label="Which city would you travel from?" value={travelSupportLocation} onChange={edited('proposal-travel', setTravelSupportLocation)} isRequired maxLength={200} error={fieldErrors['proposal-travel']} />
            )}
          </FormSection>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={isPending} aria-label={editing?.proposal.isAccepted ? 'Save the changes to your talk' : isEditing ? 'Save the changes to your proposal' : 'Send your proposal'} className={primaryButton}>
            {isPending && pendingAction === 'send' ? (isEditing ? 'Saving…' : 'Sending…') : isEditing ? 'Save changes' : 'Send proposal'}
          </button>
          {!isEditing && (
            <button
              type="button"
              disabled={isPending}
              onClick={handleSaveForLater}
              aria-label={savedTalkId ? 'Save changes to this saved talk without sending it' : 'Save this talk for later without sending it'}
              className={`${secondaryButton} text-base px-6 py-2.5`}
            >
              {isPending && pendingAction === 'save' ? 'Saving…' : savedTalkId ? 'Update saved talk' : 'Save for later'}
            </button>
          )}
          <button
            type="button"
            disabled={isPending}
            onClick={onClose}
            aria-label={isEditing ? 'Close the form without saving your changes' : 'Close the proposal form without sending'}
            className={`${secondaryButton} text-base px-6 py-2.5`}
          >
            Cancel
          </button>
          {savedMessage && <p role="status" className="text-sm text-google-green">{savedMessage}</p>}
        </div>
      </form>
      {alertMessage && <Alert message={alertMessage} onDismiss={dismissAlert} />}
    </>
  );
}
