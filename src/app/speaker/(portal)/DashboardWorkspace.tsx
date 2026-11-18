'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { PortalEditableProposal } from '@/lib/portalData';
import type { SavedTalkFields } from '@/lib/portalLabels';
import ProfileEditorPanel, { type EditableProfile } from './ProfileEditorPanel';
import ProposalForm from './ProposalForm';
import SpeakerCard, { type SpeakerCardProfile } from '@/components/SpeakerCard';
import { revealPanel } from './revealPanel';
import AnimatedPanel from './AnimatedPanel';
import BadgeLanyard from './BadgeLanyard';
import { primaryButton, secondaryButton } from './portalStyles';

// The dashboard is one page: editing a profile, proposing a talk and editing a proposal open in a panel at the top
// of the right-hand column rather than on pages of their own, so nothing else moves away. One
// panel at a time. Saved-talk forms open in their own section (SavedTalksSection).

type Panel =
  | null
  | { type: 'profile'; profileId: string }
  | { type: 'propose'; savedTalkId: string | null }
  // The proposal as it was when opened, so the form stays put if a refresh drops it from the list.
  | { type: 'edit-proposal'; proposal: EditableProposalEntry };

interface DashboardPanels {
  openPropose: (savedTalkId: string | null, openerId: string) => void;
  openEditProposal: (proposalId: string, openerId: string) => void;
}

// A proposal the speaker can still change (see PortalProposal.editable).
export interface EditableProposalEntry {
  id: string;
  talkTitle: string;
  editable: PortalEditableProposal;
}

const DashboardPanelsContext = createContext<DashboardPanels | null>(null);

// For the saved talks' Propose buttons, which sit further down the column.
export function useDashboardPanels(): DashboardPanels {
  const panels = useContext(DashboardPanelsContext);
  if (!panels) throw new Error('useDashboardPanels must be used inside DashboardWorkspace.');
  return panels;
}

interface DashboardWorkspaceProps {
  profiles: EditableProfile[];
  // The current DevFest, when its Call for Speakers is open.
  openDevfest: { name: string; closesAt: string | null } | null;
  savedTalks: (SavedTalkFields & { id: string })[];
  editableProposals: EditableProposalEntry[];
  // From the URL: ?edit=<speakerId> (the header's profile button) or ?propose (optionally
  // =<savedTalkId>) opens that panel straight away.
  requestedPanel: Panel;
  // Anything waiting on the speaker (a spot to confirm), shown above everything else.
  actionStrip?: React.ReactNode;
  // The rest of the right-hand column (talks, proposals, saved talks), rendered on the server.
  children: React.ReactNode;
}

// "a photo", "a photo and a bio", "a photo, a tagline and a bio".
function listInWords(parts: (string | false)[]): string {
  const words = parts.filter((part): part is string => Boolean(part));
  return words.length <= 1 ? words.join('') : `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
}

function isValidPanel(panel: Panel, profiles: EditableProfile[]): boolean {
  if (!panel) return false;
  if (panel.type === 'profile') return profiles.some((profile) => profile.id === panel.profileId);
  return true;
}

export default function DashboardWorkspace({
  profiles,
  openDevfest,
  savedTalks,
  editableProposals,
  requestedPanel,
  actionStrip,
  children,
}: DashboardWorkspaceProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [panel, setPanel] = useState<Panel>(isValidPanel(requestedPanel, profiles) ? requestedPanel : null);
  // A new panel object each time one opens, so reopening the same panel still scrolls to it.
  const [panelOpenedAt, setPanelOpenedAt] = useState(0);
  const [preview, setPreview] = useState<{ profile: SpeakerCardProfile; isPhotoBusy: boolean } | null>(null);
  const panelContainer = useRef<HTMLElement>(null);
  const panelHeading = useRef<HTMLHeadingElement>(null);
  // "Profile saved" under the card that was just saved, until another panel opens.
  const [savedProfileId, setSavedProfileId] = useState<string | null>(null);
  // Where focus goes back to when the panel closes: the button that opened it.
  const returnFocusTo = useRef<string | null>(null);

  // A new ?edit= or ?propose arriving while already here (the header's profile button). Only a
  // change of request counts: a refresh after saving brings new props, not a new request.
  const requestKey = requestedPanel ? JSON.stringify(requestedPanel) : '';
  const profilesRef = useRef(profiles);
  profilesRef.current = profiles;
  useEffect(() => {
    if (!requestKey) return;
    const requested = JSON.parse(requestKey) as Panel;
    if (!isValidPanel(requested, profilesRef.current)) return;
    setPreview(null);
    setPanel(requested);
    setPanelOpenedAt(Date.now());
  }, [requestKey]);

  // Bring the panel into view: on a phone the right column starts below the profile card.
  // Focus goes with it, so a keyboard or screen-reader user lands in the panel rather than on
  // the button below that opened it. The profile editor puts them in its first field itself.
  useEffect(() => {
    if (!panel) return;
    revealPanel(panelContainer.current);
    if (panel.type !== 'profile') panelHeading.current?.focus({ preventScroll: true });
  }, [panel, panelOpenedAt]);

  const open = useCallback((next: Exclude<Panel, null>, openerId: string) => {
    returnFocusTo.current = openerId;
    setPreview(null);
    setSavedProfileId(null);
    setPanel(next);
    setPanelOpenedAt(Date.now());
  }, []);

  const panels: DashboardPanels = {
    openPropose: (savedTalkId, openerId) => open({ type: 'propose', savedTalkId }, openerId),
    openEditProposal: (proposalId, openerId) => {
      const proposal = editableProposals.find((candidate) => candidate.id === proposalId);
      if (proposal) open({ type: 'edit-proposal', proposal }, openerId);
    },
  };

  const handlePreviewChange = useCallback((profile: SpeakerCardProfile, isPhotoBusy: boolean) => {
    setPreview({ profile, isPhotoBusy });
  }, []);

  function closeAfterProfileSave(wasSaved: boolean) {
    if (wasSaved && panel?.type === 'profile') setSavedProfileId(panel.profileId);
    close();
  }

  function close() {
    const fallbackFocus =
      panel?.type === 'profile'
        ? `edit-profile-${panel.profileId}`
        : panel?.type === 'edit-proposal'
          ? `edit-proposal-${panel.proposal.id}`
          : window.matchMedia('(min-width: 1024px)').matches
            ? 'propose-button-wide'
            : 'propose-button';
    setPanel(null);
    setPreview(null);
    // Drop ?edit= or ?propose so a reload doesn't reopen the panel.
    if (requestedPanel) router.replace(pathname, { scroll: false });
    const openerId = returnFocusTo.current ?? fallbackFocus;
    returnFocusTo.current = null;
    requestAnimationFrame(() => (document.getElementById(openerId) ?? document.getElementById(fallbackFocus))?.focus());
  }

  const editingProfile = panel?.type === 'profile' ? profiles.find((profile) => profile.id === panel.profileId) ?? null : null;
  const editingProposal = panel?.type === 'edit-proposal' ? panel.proposal : null;

  const isSingleProfile = profiles.length === 1;
  // Two placements of one action: under the badge on a phone, beside "Your agenda" on a wide
  // screen, where the badge would push it below the first screen.
  function proposeButton(placement: 'badge' | 'agenda') {
    const id = placement === 'badge' ? 'propose-button' : 'propose-button-wide';
    return (
      <button
        id={id}
        type="button"
        onClick={() => open({ type: 'propose', savedTalkId: null }, id)}
        aria-label="Propose a talk"
        className={`${primaryButton} ${placement === 'badge' ? 'lg:hidden' : 'max-lg:hidden'}`}
      >
        Propose a talk
      </button>
    );
  }

  return (
    <DashboardPanelsContext.Provider value={panels}>
      {actionStrip}

      <div className="grid gap-8 sm:gap-12 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] lg:gap-20">
        {/* Sticky only when the window is tall enough to show the whole badge and its buttons. */}
        <aside aria-label="Your speaker badge" className="lg:self-start [@media(min-width:1024px)_and_(min-height:820px)]:sticky [@media(min-width:1024px)_and_(min-height:820px)]:top-24">
          {profiles.length === 0 ? (
            <div className="mx-auto w-full max-w-[320px]">
              <BadgeLanyard entrance="arrive" canTilt={false}>
                <div className="rounded-[28px] border border-dashed border-white/35 bg-surface px-6 pt-10 pb-7 text-center">
                  <div aria-hidden="true" className="mx-auto aspect-square w-[52%] max-w-44 rounded-[22px] bg-white/[0.05]" />
                  <p className="mt-5 text-xl font-bold text-balance">Your badge comes with your first talk</p>
                  <p className="mt-2 text-sm text-white/70 leading-relaxed">
                    We set up your speaker badge when a talk of yours is accepted, and you can edit it here from then on.
                  </p>
                  <p className="mt-4 text-sm text-white/60 leading-relaxed">
                    Spoken for us before under another address? Sign in with that one, or write to{' '}
                    <a href="mailto:hello@gdgsydney.com" className="text-google-blue-light underline underline-offset-2 hover:no-underline">hello@gdgsydney.com</a>.
                  </p>
                </div>
              </BadgeLanyard>
            </div>
          ) : (
            <div className="space-y-12">
              {profiles.length > 1 && (
                <p className="text-center text-sm text-white/65 leading-relaxed">
                  {profiles.length} speakers share this email address, so you can edit each of their badges.
                </p>
              )}
              {profiles.map((profile, index) => {
                const isEditing = editingProfile?.id === profile.id;
                const shown = isEditing && preview ? preview.profile : profile;
                const missing = listInWords([!shown.photoUrl && 'a photo', !shown.tagline && 'a tagline', !shown.bio && 'a bio']);
                const editButton = !isEditing && (
                  <button
                    id={`edit-profile-${profile.id}`}
                    type="button"
                    onClick={() => open({ type: 'profile', profileId: profile.id }, `edit-profile-${profile.id}`)}
                    aria-label={`Edit the speaker badge for ${profile.name}`}
                    className={`${secondaryButton} text-base px-6 py-2.5`}
                  >
                    Edit badge
                  </button>
                );
                return (
                  <div key={profile.id} className="mx-auto w-full max-w-[320px]">
                    <BadgeLanyard entrance={index === 0 ? 'swing' : 'arrive'} strapClassName="h-10 sm:h-20">
                      <SpeakerCard profile={shown} showFullBio={isEditing} isPhotoLoading={isEditing && preview?.isPhotoBusy} compactOnPhone={!isEditing} />
                    </BadgeLanyard>
                    <div className="mt-5 text-center text-sm leading-relaxed" aria-live="polite">
                      {isEditing && <p className="text-white/60">Preview: your badge changes as you type.</p>}
                      {missing && <p className="text-google-yellow">Add {missing} to finish it.</p>}
                      {savedProfileId === profile.id && !isEditing && (
                        <p className="text-google-green">Badge saved. It&rsquo;s live on our event pages now.</p>
                      )}
                    </div>
                    {isSingleProfile ? (
                      <div className="mt-6 flex flex-wrap justify-center gap-3">
                        {editButton}
                        {proposeButton('badge')}
                      </div>
                    ) : (
                      editButton && <div className="mt-5 flex justify-center">{editButton}</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {!isSingleProfile && <div className="mt-8 flex justify-center lg:hidden">{proposeButton('badge')}</div>}
        </aside>

        <div className="min-w-0">
          <div className="flex items-center justify-between gap-6">
            <h1 className="text-[clamp(1.75rem,4vw,2.25rem)] font-bold leading-tight tracking-[-0.01em] text-off-white">Your agenda</h1>
            {proposeButton('agenda')}
          </div>

          <AnimatedPanel isOpen={panel !== null}>
            <section
              ref={panelContainer}
              aria-labelledby="dashboard-panel-heading"
              className="mt-8 scroll-mt-28 scroll-mb-6 rounded-3xl bg-surface p-6 sm:p-8"
            >
              {editingProfile ? (
                <>
                  <h2 id="dashboard-panel-heading" ref={panelHeading} tabIndex={-1} className="mb-6 text-xl font-bold text-off-white focus:outline-none">
                    Edit your badge{profiles.length > 1 ? `: ${editingProfile.name}` : ''}
                  </h2>
                  <ProfileEditorPanel
                    key={editingProfile.id}
                    profile={editingProfile}
                    onPreviewChange={handlePreviewChange}
                    onDone={closeAfterProfileSave}
                    onCancel={close}
                  />
                </>
              ) : panel?.type === 'propose' ? (
                <>
                  <h2 id="dashboard-panel-heading" ref={panelHeading} tabIndex={-1} className="mb-2 text-xl font-bold text-off-white focus:outline-none">Propose a talk</h2>
                  <p className="mb-8 text-sm text-white/60 leading-relaxed">
                    We&rsquo;ll email you a copy, and you can follow it in your agenda. Not ready to send it? Save it for later.
                  </p>
                  <ProposalForm
                    // A different saved talk's Propose starts a fresh form.
                    key={`${panel.savedTalkId ?? 'new'}:${panelOpenedAt}`}
                    profiles={profiles}
                    openDevfest={openDevfest}
                    savedTalks={savedTalks}
                    initialSavedTalkId={panel.savedTalkId}
                    onClose={close}
                  />
                </>
              ) : editingProposal ? (
                <>
                  <h2 id="dashboard-panel-heading" ref={panelHeading} tabIndex={-1} className="mb-2 text-xl font-bold text-off-white focus:outline-none">
                    {editingProposal.editable.isAccepted ? 'Edit your talk' : 'Edit your proposal'}
                  </h2>
                  <p className="mb-8 text-sm text-white/60 leading-relaxed">
                    {editingProposal.editable.isAccepted
                      ? 'Changes show on the event page straight away, until the event. Our organisers will see that it was edited.'
                      : <>You can change it until our organisers make a decision. They&rsquo;ll see that it was edited.</>}
                  </p>
                  <ProposalForm
                    key={`edit:${editingProposal.id}:${panelOpenedAt}`}
                    profiles={profiles}
                    openDevfest={openDevfest}
                    savedTalks={savedTalks}
                    initialSavedTalkId={null}
                    editing={{ proposalId: editingProposal.id, proposal: editingProposal.editable }}
                    onClose={close}
                  />
                </>
              ) : null}
            </section>
          </AnimatedPanel>

          <div className="mt-10 space-y-14">{children}</div>
        </div>
      </div>
    </DashboardPanelsContext.Provider>
  );
}
