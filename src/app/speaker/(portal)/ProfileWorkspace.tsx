'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import ProfileEditorPanel, { type EditableProfile } from './ProfileEditorPanel';
import SpeakerCard, { type SpeakerCardProfile } from './SpeakerCard';
import { secondaryButton } from './portalStyles';

interface ProfileWorkspaceProps {
  profiles: EditableProfile[];
  // From ?edit=<speakerId> (the header's profile button): open that profile's editor straight away.
  initialEditingId: string | null;
  // The rest of the right-hand column (talks, proposals, saved talks), rendered on the server.
  children: React.ReactNode;
}

// "a photo", "a photo and a bio", "a photo, a tagline and a bio".
function listInWords(parts: (string | false)[]): string {
  const words = parts.filter((part): part is string => Boolean(part));
  return words.length <= 1 ? words.join('') : `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// The dashboard's two columns: the speaker card on the left, everything else on the right.
// Editing a profile happens in place: the form opens at the top of the right column and the
// card becomes its live preview, so nothing else on the dashboard moves away.
export default function ProfileWorkspace({ profiles, initialEditingId, children }: ProfileWorkspaceProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [editingId, setEditingId] = useState<string | null>(
    profiles.some((profile) => profile.id === initialEditingId) ? initialEditingId : null
  );
  const [preview, setPreview] = useState<{ profile: SpeakerCardProfile; isPhotoBusy: boolean } | null>(null);
  const editorContainer = useRef<HTMLDivElement>(null);

  const editingProfile = profiles.find((profile) => profile.id === editingId) ?? null;

  // The header's profile button pressed while already on the dashboard: a new ?edit= arrives
  // as a prop on the same component, so open that editor here.
  // Only a change of ?edit= counts: a refresh after saving brings new profiles, not a new request.
  const profilesRef = useRef(profiles);
  profilesRef.current = profiles;
  useEffect(() => {
    if (initialEditingId && profilesRef.current.some((profile) => profile.id === initialEditingId)) {
      setPreview(null);
      setEditingId(initialEditingId);
    }
  }, [initialEditingId]);

  useEffect(() => {
    if (!editingId) return;
    editorContainer.current?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'nearest' });
  }, [editingId]);

  const handlePreviewChange = useCallback((profile: SpeakerCardProfile, isPhotoBusy: boolean) => {
    setPreview({ profile, isPhotoBusy });
  }, []);

  function startEditing(profileId: string) {
    setPreview(null);
    setEditingId(profileId);
  }

  function stopEditing() {
    const closedId = editingId;
    setEditingId(null);
    setPreview(null);
    // Drop ?edit= so a reload (or the effect above) doesn't reopen the form.
    if (initialEditingId) router.replace(pathname, { scroll: false });
    requestAnimationFrame(() => document.getElementById(`edit-profile-${closedId}`)?.focus());
  }

  return (
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
              const isEditing = profile.id === editingId;
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
                      onClick={() => startEditing(profile.id)}
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
        {editingProfile && (
          <section
            ref={editorContainer}
            aria-labelledby="profile-editor-heading"
            className="scroll-mt-28 scroll-mb-6 rounded-3xl bg-white/[0.05] p-6 sm:p-8 animate-page-in"
          >
            <h2 id="profile-editor-heading" className="mb-6 text-xl font-bold text-off-white">
              Edit profile{profiles.length > 1 ? `: ${editingProfile.name}` : ''}
            </h2>
            <ProfileEditorPanel
              key={editingProfile.id}
              profile={editingProfile}
              onPreviewChange={handlePreviewChange}
              onDone={stopEditing}
              onCancel={stopEditing}
            />
          </section>
        )}
        {children}
      </div>
    </div>
  );
}
