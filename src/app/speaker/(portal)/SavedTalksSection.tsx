'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { SavedTalkFields } from '@/lib/portalLabels';
import SavedTalkEditor from './SavedTalkEditor';
import { primaryButtonSmall, secondaryButton, sectionHeading } from './portalStyles';

export interface SavedTalkRow extends SavedTalkFields {
  id: string;
  // Event names it has been proposed to, newest first; empty when not proposed yet.
  proposedTo: string[];
}

// Which form is open: none, a new talk, or one saved talk by id. One at a time, so the page
// never holds two half-filled forms.
type OpenForm = null | 'new' | string;

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// The dashboard's Saved talks: adding and editing happen in place, in the section itself, so
// the rest of the dashboard stays where it is.
export default function SavedTalksSection({ savedTalks }: { savedTalks: SavedTalkRow[] }) {
  const [openForm, setOpenForm] = useState<OpenForm>(null);
  const formContainer = useRef<HTMLDivElement>(null);
  // Where focus goes back to when the form closes: the button that opened it.
  const returnFocusTo = useRef<string | null>(null);

  // Bring the opened form into view: on a phone the section sits below the profile card and
  // talks, so the form can otherwise open off screen. scroll-mt keeps it clear of the header.
  useEffect(() => {
    if (!openForm) return;
    formContainer.current?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'nearest' });
  }, [openForm]);

  function open(form: Exclude<OpenForm, null>, openerId: string) {
    returnFocusTo.current = openerId;
    setOpenForm(form);
  }

  function close() {
    setOpenForm(null);
    const openerId = returnFocusTo.current;
    // After the refresh has put the list back: the opener may have been re-rendered.
    requestAnimationFrame(() => {
      const opener = openerId ? document.getElementById(openerId) : null;
      (opener ?? document.getElementById('add-saved-talk-button'))?.focus();
    });
  }

  function editorFor(row: SavedTalkRow | null) {
    return (
      <div ref={formContainer} className="scroll-mt-28 scroll-mb-6 rounded-3xl bg-white/[0.05] p-6 sm:p-8 animate-page-in">
        <h3 className="mb-5 font-bold text-off-white">{row ? 'Edit talk' : 'New talk'}</h3>
        <SavedTalkEditor
          savedTalkId={row?.id ?? null}
          initialFields={row ? { talkTitle: row.talkTitle, abstract: row.abstract, audience: row.audience } : { talkTitle: '', abstract: '', audience: '' }}
          proposedCount={row?.proposedTo.length ?? 0}
          onDone={close}
          onCancel={close}
        />
      </div>
    );
  }

  return (
    <section aria-labelledby="saved-talks-heading">
      {/* min-h holds the button's height when it hides, so the heading doesn't shift. */}
      <div className="flex items-center justify-between gap-4 min-h-10">
        <h2 id="saved-talks-heading" className={sectionHeading}>Saved talks</h2>
        {openForm !== 'new' && (
          <button
            id="add-saved-talk-button"
            type="button"
            onClick={() => open('new', 'add-saved-talk-button')}
            aria-label="Add a talk to propose later"
            className={secondaryButton}
          >
            Add a talk
          </button>
        )}
      </div>
      <p className="mt-2 text-sm text-white/60">Only you can see these until you propose them.</p>

      {openForm === 'new' && <div className="mt-5">{editorFor(null)}</div>}

      {savedTalks.length === 0 ? (
        openForm !== 'new' && (
          <p className="mt-4 py-5 border-t border-white/10 text-white/60">
            Keep a talk idea here and propose it when you&rsquo;re ready, to a meetup, DevFest, or both.
          </p>
        )
      ) : (
        <ul className="mt-4">
          {savedTalks.map((savedTalk) => (
            <li key={savedTalk.id} className="py-5 border-t border-white/10">
              {openForm === savedTalk.id ? (
                editorFor(savedTalk)
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-bold leading-snug">{savedTalk.talkTitle}</p>
                    {savedTalk.abstract && <p className="mt-1 text-sm text-white/60 line-clamp-2">{savedTalk.abstract}</p>}
                    <p className="mt-2 text-sm text-white/60">
                      {savedTalk.proposedTo.length === 0 ? 'Not proposed yet' : `Proposed to ${savedTalk.proposedTo.join(', ')}`}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      id={`edit-saved-talk-${savedTalk.id}`}
                      type="button"
                      onClick={() => open(savedTalk.id, `edit-saved-talk-${savedTalk.id}`)}
                      aria-label={`Edit ${savedTalk.talkTitle}`}
                      className={secondaryButton}
                    >
                      Edit
                    </button>
                    <Link href={`/speaker/propose?talk=${savedTalk.id}`} aria-label={`Propose ${savedTalk.talkTitle}`} className={primaryButtonSmall}>
                      Propose
                    </Link>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
