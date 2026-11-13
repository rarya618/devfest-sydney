'use client';

import { useRef, useState } from 'react';
import SavedTalkEditor from './talks/SavedTalkEditor';
import { secondaryButton } from './portalStyles';

// "Add a talk" on the dashboard: opens the saved-talk form inside the Saved talks section
// rather than on a page of its own, so the rest of the dashboard stays where it is. Saving
// refreshes the list below it and closes the form.
export default function AddSavedTalk({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const addButton = useRef<HTMLButtonElement>(null);

  function close() {
    setIsOpen(false);
    // Back to where they started, for keyboard and screen-reader users.
    requestAnimationFrame(() => addButton.current?.focus());
  }

  return (
    <>
      {/* Holds the button's height when it hides, so the heading doesn't shift. */}
      <div className="flex items-center justify-between gap-4 min-h-10">
        <h2 id="saved-talks-heading" className="text-xl font-bold text-off-white">Saved talks</h2>
        {!isOpen && (
          <button
            ref={addButton}
            type="button"
            onClick={() => setIsOpen(true)}
            aria-expanded={false}
            aria-controls="add-saved-talk"
            aria-label="Add a talk to propose later"
            className={secondaryButton}
          >
            Add a talk
          </button>
        )}
      </div>
      <p className="mt-2 text-sm text-white/60">Only you can see these until you propose them.</p>
      {isOpen && (
        <div id="add-saved-talk" className="mt-5 rounded-3xl bg-white/[0.05] p-6 sm:p-8 animate-page-in">
          <h3 className="mb-5 font-bold text-off-white">New talk</h3>
          <SavedTalkEditor
            savedTalkId={null}
            initialFields={{ talkTitle: '', abstract: '', audience: '' }}
            proposedCount={0}
            onSaved={close}
            onCancel={close}
          />
        </div>
      )}
      {children}
    </>
  );
}
