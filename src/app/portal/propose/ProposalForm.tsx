'use client';

import { useCallback, useState, useTransition, type FormEvent, type ReactNode } from 'react';
import Link from 'next/link';
import Alert from '@/components/Alert';
import { hintClass, inputNormal, labelClass, optionButtonClass, submitClass } from '@/lib/formStyles';
import { MEETUP_FORMAT_LABELS, MEETUP_FORMATS, MEETUP_PROPOSAL_LIMITS } from '@/lib/meetupProposalLabels';
import type { PortalProfile } from '@/lib/portalData';
import type { MeetupFormat } from '@/lib/types';
import { submitPortalProposal } from '../actions';

type ProposalKind = 'meetup' | 'devfest';
type DevfestTrack = 'developer' | 'builder' | 'workshop';
type DevfestFormat = 'talk' | 'lightning-talk' | 'workshop';
type DevfestLevel = 'beginner' | 'intermediate' | 'advanced';

interface ProposalFormProps {
  profiles: Omit<PortalProfile, 'talks'>[];
  // The current DevFest, when its Call for Speakers is open.
  openDevfest: { name: string; closesAt: string | null } | null;
}

const DEVFEST_ABSTRACT_MAX = 2000;

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

const required = <span className="text-google-red-light" aria-hidden="true"> *</span>;
const checkboxClass = 'mt-0.5 w-5 h-5 shrink-0 accent-google-blue focus:outline-none focus:ring-2 focus:ring-google-blue';

function Choice<Value extends string>({
  name,
  legend,
  options,
  selected,
  onSelect,
}: {
  name: string;
  legend: ReactNode;
  options: { value: Value; label: string; description?: string }[];
  selected: Value | '';
  onSelect: (value: Value) => void;
}) {
  return (
    <fieldset>
      <legend className={labelClass}>{legend}</legend>
      <div className="grid gap-3 sm:grid-cols-3">
        {options.map((option) => (
          <label
            key={option.value}
            className={`block cursor-pointer rounded-lg border px-4 py-3 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-google-blue ${optionButtonClass(selected === option.value, false)}`}
          >
            <input type="radio" name={name} value={option.value} checked={selected === option.value} onChange={() => onSelect(option.value)} className="sr-only" />
            <span className="block text-sm font-bold">{option.label}</span>
            {option.description && <span className="block mt-1 text-xs text-white/60">{option.description}</span>}
          </label>
        ))}
      </div>
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
}) {
  const hintId = hint ? `${id}-hint` : undefined;
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
        {isRequired && required}
      </label>
      {rows ? (
        <textarea id={id} rows={rows} value={value} maxLength={maxLength} required={isRequired} placeholder={placeholder} aria-describedby={hintId} onChange={(event) => onChange(event.target.value)} className={`${inputNormal} resize-y`} />
      ) : (
        <input id={id} value={value} maxLength={maxLength} required={isRequired} placeholder={placeholder} aria-describedby={hintId} onChange={(event) => onChange(event.target.value)} className={inputNormal} />
      )}
      {hint && <p id={hintId} className={hintClass}>{hint}</p>}
    </div>
  );
}

export default function ProposalForm({ profiles, openDevfest }: ProposalFormProps) {
  const firstProfile = profiles[0] ?? null;
  const [kind, setKind] = useState<ProposalKind>('meetup');
  const [profileId, setProfileId] = useState<string>(firstProfile?.id ?? '');
  const [name, setName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const dismissAlert = useCallback(() => setAlertMessage(null), []);

  const profile = profiles.find((candidate) => candidate.id === profileId) ?? null;

  // Shared between both kinds.
  const [talkTitle, setTalkTitle] = useState('');
  const [abstract, setAbstract] = useState('');
  const [bio, setBio] = useState(firstProfile?.bio ?? '');

  // Meetup.
  const [meetupFormat, setMeetupFormat] = useState<MeetupFormat | ''>('');
  const [audience, setAudience] = useState('');
  const [profileUrl, setProfileUrl] = useState(firstProfile?.linkedinUrl || firstProfile?.websiteUrl || '');
  const [speakingExperience, setSpeakingExperience] = useState('');
  const [notes, setNotes] = useState('');

  // DevFest.
  const [track, setTrack] = useState<DevfestTrack | ''>('');
  const [devfestFormat, setDevfestFormat] = useState<DevfestFormat | ''>('');
  const [level, setLevel] = useState<DevfestLevel | ''>('');
  const [tagline, setTagline] = useState(firstProfile?.tagline ?? '');
  const [linkedinUrl, setLinkedinUrl] = useState(firstProfile?.linkedinUrl ?? '');
  const [githubUrl, setGithubUrl] = useState(firstProfile?.githubUrl ?? '');
  const [websiteUrl, setWebsiteUrl] = useState(firstProfile?.websiteUrl ?? '');
  const [previousTalkLink, setPreviousTalkLink] = useState('');
  const [howDidYouHear, setHowDidYouHear] = useState('');
  const [coSpeakerEmails, setCoSpeakerEmails] = useState('');
  const [accessibilityNeeds, setAccessibilityNeeds] = useState('');
  const [travelSupportLocation, setTravelSupportLocation] = useState('');
  const [checks, setChecks] = useState<Record<string, boolean>>({ isOpenToAudienceQuestions: true });

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
  }

  function missingRequired(): string | null {
    if (!profile && !name.trim()) return 'Please enter your name.';
    if (!talkTitle.trim()) return 'Please give your talk a title.';
    if (!abstract.trim()) return 'Please add an abstract.';
    if (kind === 'meetup') {
      if (!meetupFormat) return 'Please choose a talk format.';
      if (!audience.trim()) return 'Please tell us who the talk is for.';
      if (!bio.trim()) return 'Please add a short bio.';
    } else {
      if (!track) return 'Please choose a track.';
      if (!devfestFormat) return 'Please choose a format.';
      if (!level) return 'Please choose a level.';
      if (checks.requiresTravelSupport && !travelSupportLocation.trim()) return "Please tell us which city you'd be travelling from.";
    }
    return null;
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const problem = missingRequired();
    if (problem) {
      setAlertMessage(problem);
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
    startTransition(async () => {
      const result = await submitPortalProposal({ kind, profileId: profile?.id ?? null, name, fields });
      if (result.error) setAlertMessage(result.error);
      else {
        setSubmitted(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  if (submitted) {
    return (
      <div role="status" className="rounded-2xl border border-google-green/30 bg-google-green/10 px-6 py-8">
        <p className="text-xl font-bold text-google-green mb-3">Proposal sent</p>
        <p className="text-white/70 leading-relaxed mb-6">
          Thanks! We&rsquo;ve emailed you a copy. Our organisers will read it and get back to you by email.
        </p>
        <Link href="/portal" aria-label="Back to your talks" className="inline-flex px-6 py-2 text-sm font-bold text-white rounded border border-white/35 hover:border-white">
          Back to your talks
        </Link>
      </div>
    );
  }

  const kindOptions: { value: ProposalKind; label: string; description: string }[] = [
    { value: 'meetup', label: 'A GDG Sydney meetup', description: 'Monthly evening events. We pick the meetup that fits.' },
    ...(openDevfest
      ? [{ value: 'devfest' as const, label: openDevfest.name, description: openDevfest.closesAt ? `Call for Speakers closes ${new Date(openDevfest.closesAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', timeZone: 'Australia/Sydney' })}.` : 'Call for Speakers open now.' }]
      : []),
  ];

  return (
    <>
      <form onSubmit={handleSubmit} noValidate className="space-y-8">
        <Choice name="kind" legend="Where would you like to speak?" options={kindOptions} selected={kind} onSelect={setKind} />
        {!openDevfest && <p className={`${hintClass} -mt-5`}>DevFest&rsquo;s Call for Speakers isn&rsquo;t open right now. It will appear here when it is.</p>}

        {profiles.length > 1 ? (
          <div>
            <label htmlFor="proposal-profile" className={labelClass}>Proposing as</label>
            <select id="proposal-profile" value={profileId} onChange={(event) => chooseProfile(event.target.value)} className={inputNormal}>
              {profiles.map((candidate) => <option key={candidate.id} value={candidate.id} className="bg-[#1e1e1e]">{candidate.name}</option>)}
            </select>
          </div>
        ) : profile ? (
          <p className="text-white/70">Proposing as <span className="font-bold text-white">{profile.name}</span>.</p>
        ) : (
          <TextField id="proposal-name" label="Your full name" value={name} onChange={setName} isRequired maxLength={MEETUP_PROPOSAL_LIMITS.name} />
        )}

        <TextField id="proposal-title" label="Talk title" value={talkTitle} onChange={setTalkTitle} isRequired maxLength={MEETUP_PROPOSAL_LIMITS.talkTitle} />
        <TextField
          id="proposal-abstract"
          label="Abstract"
          value={abstract}
          onChange={setAbstract}
          isRequired
          rows={7}
          maxLength={kind === 'meetup' ? MEETUP_PROPOSAL_LIMITS.abstract : DEVFEST_ABSTRACT_MAX}
          hint="What is your session about, and what will people take away?"
        />

        {kind === 'meetup' ? (
          <>
            <Choice
              name="meetup-format"
              legend={<>Format{required}</>}
              options={MEETUP_FORMATS.map((format) => ({ value: format, label: MEETUP_FORMAT_LABELS[format] }))}
              selected={meetupFormat}
              onSelect={setMeetupFormat}
            />
            <TextField id="proposal-audience" label="Who is it for?" value={audience} onChange={setAudience} isRequired rows={3} maxLength={MEETUP_PROPOSAL_LIMITS.audience} hint="The level and background you have in mind." />
            <TextField id="proposal-bio" label="Speaker bio" value={bio} onChange={setBio} isRequired rows={5} maxLength={MEETUP_PROPOSAL_LIMITS.bio} hint={profile ? 'Filled in from your profile. Changing it here changes only this proposal.' : undefined} />
            <TextField id="proposal-profile-url" label="LinkedIn or website" value={profileUrl} onChange={setProfileUrl} maxLength={MEETUP_PROPOSAL_LIMITS.profileUrl} />
            <TextField id="proposal-experience" label="Speaking experience" value={speakingExperience} onChange={setSpeakingExperience} rows={3} maxLength={MEETUP_PROPOSAL_LIMITS.speakingExperience} hint="Optional. Links to past talks are welcome. First-timers too." />
            <TextField id="proposal-notes" label="Anything else?" value={notes} onChange={setNotes} rows={3} maxLength={MEETUP_PROPOSAL_LIMITS.notes} hint="Optional. Dates that suit you, equipment you need, anything we should know." />
          </>
        ) : (
          <>
            <Choice name="devfest-track" legend={<>Track{required}</>} options={DEVFEST_TRACKS} selected={track} onSelect={setTrack} />
            <Choice name="devfest-format" legend={<>Format{required}</>} options={DEVFEST_FORMATS} selected={devfestFormat} onSelect={setDevfestFormat} />
            <Choice name="devfest-level" legend={<>Level{required}</>} options={DEVFEST_LEVELS} selected={level} onSelect={setLevel} />
            <TextField id="proposal-tagline" label="Tagline" value={tagline} onChange={setTagline} maxLength={200} hint="Your role and company, or a one-line intro." />
            <TextField id="proposal-devfest-bio" label="Speaker bio" value={bio} onChange={setBio} rows={5} maxLength={1000} hint={profile ? 'Filled in from your profile. Changing it here changes only this proposal.' : undefined} />
            <div className="grid gap-6 sm:grid-cols-3">
              <TextField id="proposal-linkedin" label="LinkedIn" value={linkedinUrl} onChange={setLinkedinUrl} maxLength={500} />
              <TextField id="proposal-github" label="GitHub" value={githubUrl} onChange={setGithubUrl} maxLength={500} />
              <TextField id="proposal-website" label="Website" value={websiteUrl} onChange={setWebsiteUrl} maxLength={500} />
            </div>
            <TextField id="proposal-previous-talk" label="A previous talk" value={previousTalkLink} onChange={setPreviousTalkLink} maxLength={500} hint="Optional. A recording or slides, if you have one." />
            <TextField id="proposal-co-speakers" label="Co-speakers' emails" value={coSpeakerEmails} onChange={setCoSpeakerEmails} maxLength={500} hint="Optional. Separate them with commas." />
            <TextField id="proposal-accessibility" label="Accessibility needs" value={accessibilityNeeds} onChange={setAccessibilityNeeds} rows={3} maxLength={1000} hint="Optional. Anything you need to present comfortably." />
            <TextField id="proposal-how-heard" label="How did you hear about us?" value={howDidYouHear} onChange={setHowDidYouHear} maxLength={300} />
            <fieldset className="space-y-4">
              <legend className={labelClass}>About you and your session</legend>
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
              <TextField id="proposal-travel" label="Which city would you travel from?" value={travelSupportLocation} onChange={setTravelSupportLocation} isRequired maxLength={200} />
            )}
          </>
        )}

        <button type="submit" disabled={isPending} aria-label="Send your proposal" className={submitClass}>
          {isPending ? 'Sending…' : 'Send proposal'}
        </button>
      </form>
      {alertMessage && <Alert message={alertMessage} onDismiss={dismissAlert} />}
    </>
  );
}
