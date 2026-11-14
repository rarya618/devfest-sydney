'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { PortalEditableProposal } from '@/lib/portalData';
import type { SavedTalkFields } from '@/lib/portalLabels';
import ProfileEditorPanel, { type EditableProfile } from './ProfileEditorPanel';
import ProposalForm from './ProposalForm';
import SpeakerCard, { type SpeakerCardProfile } from './SpeakerCard';
import { revealPanel } from './revealPanel';
import { pageHeading, primaryButton, secondaryButton } from './portalStyles';

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
  greeting: string;
  profiles: EditableProfile[];
  // The current DevFest, when its Call for Speakers is open.
  openDevfest: { name: string; closesAt: string | null } | null;
  savedTalks: (SavedTalkFields & { id: string })[];
  editableProposals: EditableProposalEntry[];
  // From the URL: ?edit=<speakerId> (the header's profile button) or ?propose (optionally
  // =<savedTalkId>) opens that panel straight away.
  requestedPanel: Panel;
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
  greeting,
  profiles,
  openDevfest,
  savedTalks,
  editableProposals,
  requestedPanel,
  children,
}: DashboardWorkspaceProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [panel, setPanel] = useState<Panel>(isValidPanel(requestedPanel, profiles) ? requestedPanel : null);
  // A new panel object each time one opens, so reopening the same panel still scrolls to it.
  const [panelOpenedAt, setPanelOpenedAt] = useState(0);
  const [preview, setPreview] = useState<{ profile: SpeakerCardProfile; isPhotoBusy: boolean } | null>(null);
  const panelContainer = useRef<HTMLElement>(null);
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
  useEffect(() => {
    if (!panel) return;
    revealPanel(panelContainer.current);
  }, [panel, panelOpenedAt]);

  const open = useCallback((next: Exclude<Panel, null>, openerId: string) => {
    returnFocusTo.current = openerId;
    setPreview(null);
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

  function close() {
    const fallbackFocus =
      panel?.type === 'profile'
        ? `edit-profile-${panel.profileId}`
        : panel?.type === 'edit-proposal'
          ? `edit-proposal-${panel.proposal.id}`
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

  return (
    <DashboardPanelsContext.Provider value={panels}>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-12">
        <h1 className={pageHeading}>{greeting}</h1>
        <button
          id="propose-button"
          type="button"
          onClick={() => open({ type: 'propose', savedTalkId: null }, 'propose-button')}
          aria-label="Propose a talk"
          className={`${primaryButton} self-start sm:self-auto`}
        >
          Propose a talk
        </button>
      </div>

      <div className="grid gap-12 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-16">
        <aside aria-label="Your speaker profile" className="lg:sticky lg:top-28 lg:self-start">
          {profiles.length === 0 ? (
            <div className="rounded-3xl bg-white/[0.05] p-6">
              <h2 className="text-xl font-bold">No speaker profile yet</h2>
              <p className="mt-3 text-white/70 leading-relaxed">
                Your profile is set up when a talk of yours is accepted. Until then, propose a talk and follow it here.
              </p>
              <p className="mt-3 text-sm text-white/60 leading-relaxed">
                Spoken for us before under another address? Sign in with that one, or write to{' '}
                <a href="mailto:hello@gdgsydney.com" className="text-google-blue-light underline hover:no-underline">hello@gdgsydney.com</a>.
              </p>
            </div>
          ) : (
            <div className="space-y-10">
              {profiles.length > 1 && (
                <p className="text-sm text-white/65 leading-relaxed">
                  {profiles.length} speakers share this email address, so you can edit each of their profiles.
                </p>
              )}
              {profiles.map((profile) => {
                const isEditing = editingProfile?.id === profile.id;
                const shown = isEditing && preview ? preview.profile : profile;
                const missing = listInWords([!shown.photoUrl && 'a photo', !shown.tagline && 'a tagline', !shown.bio && 'a bio']);
                return (
                  <div key={profile.id}>
                    <SpeakerCard profile={shown} showFullBio={isEditing} isPhotoLoading={isEditing && preview?.isPhotoBusy} />
                    <p className="mt-4 text-sm text-white/60 leading-relaxed">
                      {isEditing ? 'Preview: this changes as you type.' : 'This is how you appear next to your talks on our event pages.'}
                      {missing && <span className="block mt-1 text-google-yellow">Add {missing} to finish it.</span>}
                    </p>
                    {!isEditing && (
                      <button
                        id={`edit-profile-${profile.id}`}
                        type="button"
                        onClick={() => open({ type: 'profile', profileId: profile.id }, `edit-profile-${profile.id}`)}
                        aria-label={`Edit the speaker profile for ${profile.name}`}
                        className={`${secondaryButton} mt-4`}
                      >
                        Edit profile
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </aside>

        <div className="space-y-14 min-w-0">
          {panel && (
            <section
              ref={panelContainer}
              aria-labelledby="dashboard-panel-heading"
              className="scroll-mt-28 scroll-mb-6 rounded-3xl bg-white/[0.05] p-6 sm:p-8 animate-page-in"
            >
              {editingProfile ? (
                <>
                  <h2 id="dashboard-panel-heading" className="mb-6 text-xl font-bold text-off-white">
                    Edit profile{profiles.length > 1 ? `: ${editingProfile.name}` : ''}
                  </h2>
                  <ProfileEditorPanel
                    key={editingProfile.id}
                    profile={editingProfile}
                    onPreviewChange={handlePreviewChange}
                    onDone={close}
                    onCancel={close}
                  />
                </>
              ) : panel.type === 'propose' ? (
                <>
                  <h2 id="dashboard-panel-heading" className="mb-2 text-xl font-bold text-off-white">Propose a talk</h2>
                  <p className="mb-8 text-sm text-white/60 leading-relaxed">
                    We&rsquo;ll email you a copy, and you can follow it below. Not ready to send it? Save it for later.
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
                  <h2 id="dashboard-panel-heading" className="mb-2 text-xl font-bold text-off-white">Edit your proposal</h2>
                  <p className="mb-8 text-sm text-white/60 leading-relaxed">
                    You can change it until our organisers make a decision. They&rsquo;ll see that it was edited.
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
          )}
          {children}
        </div>
      </div>
    </DashboardPanelsContext.Provider>
  );
}
