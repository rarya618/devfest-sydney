'use client';

import { useCallback, useEffect, useRef, useState, useTransition, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Alert from '@/components/Alert';
import { hintClass, inputNormal, labelClass } from '@/lib/formStyles';
import { findSavedTalkError, SAVED_TALK_LIMITS, type SavedTalkFields } from '@/lib/portalLabels';
import { deleteSavedTalk, saveTalkForLater } from './actions';
import { dangerButton, dangerOutlineButton, primaryButton, secondaryButton } from './portalStyles';

interface SavedTalkEditorProps {
  // Null for a new talk.
  savedTalkId: string | null;
  initialFields: SavedTalkFields;
  // Where it has been proposed, to explain that those proposals won't change.
  proposedCount: number;
  // Called after a save or a delete, once the dashboard has been asked to refresh.
  onDone: () => void;
  onCancel: () => void;
}

// The saved-talk form, opened in place on the dashboard (SavedTalksSection) to add a talk or
// edit one. Saving or deleting refreshes the dashboard around it rather than leaving the page.
export default function SavedTalkEditor({ savedTalkId, initialFields, proposedCount, onDone, onCancel }: SavedTalkEditorProps) {
  const router = useRouter();
  const [fields, setFields] = useState<SavedTalkFields>(initialFields);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const dismissAlert = useCallback(() => setAlertMessage(null), []);
  const titleInput = useRef<HTMLInputElement>(null);

  // The form opens because someone asked for it: put them in the first field. The section
  // scrolls the form into view itself, so focusing mustn't jump the page as well.
  useEffect(() => {
    titleInput.current?.focus({ preventScroll: true });
  }, []);

  function update(key: keyof SavedTalkFields, value: string) {
    setFields((previous) => ({ ...previous, [key]: value }));
  }

  function handleSave(event: FormEvent) {
    event.preventDefault();
    const problem = findSavedTalkError(fields);
    if (problem) {
      setAlertMessage(problem);
      return;
    }
    startTransition(async () => {
      const result = await saveTalkForLater(savedTalkId, fields);
      if ('error' in result) setAlertMessage(result.error);
      else {
        router.refresh();
        onDone();
      }
    });
  }

  function handleDelete() {
    if (!savedTalkId) return;
    startTransition(async () => {
      const result = await deleteSavedTalk(savedTalkId);
      if (result.error) {
        setAlertMessage(result.error);
        setIsConfirmingDelete(false);
      } else {
        router.refresh();
        onDone();
      }
    });
  }

  return (
    <>
      <form onSubmit={handleSave} noValidate className="space-y-6">
        <div>
          <label htmlFor="saved-title" className={labelClass}>
            Title <span className="text-google-red-light" aria-hidden="true">*</span>
          </label>
          <input ref={titleInput} id="saved-title" value={fields.talkTitle} required maxLength={SAVED_TALK_LIMITS.talkTitle} onChange={(event) => update('talkTitle', event.target.value)} className={inputNormal} />
        </div>
        <div>
          <label htmlFor="saved-abstract" className={labelClass}>Abstract</label>
          <textarea id="saved-abstract" rows={5} value={fields.abstract} maxLength={SAVED_TALK_LIMITS.abstract} aria-describedby="saved-abstract-hint" onChange={(event) => update('abstract', event.target.value)} className={`${inputNormal} resize-y`} />
          <p id="saved-abstract-hint" className={hintClass}>
            What the session is about and what people take away. {fields.abstract.length} of {SAVED_TALK_LIMITS.abstract} characters.
          </p>
        </div>
        <div>
          <label htmlFor="saved-audience" className={labelClass}>Who is it for?</label>
          <textarea id="saved-audience" rows={3} value={fields.audience} maxLength={SAVED_TALK_LIMITS.audience} aria-describedby="saved-audience-hint" onChange={(event) => update('audience', event.target.value)} className={`${inputNormal} resize-y`} />
          <p id="saved-audience-hint" className={hintClass}>Optional. The level and background you have in mind.</p>
        </div>

        {proposedCount > 0 && (
          <p className="text-sm text-white/60 leading-relaxed">
            You&rsquo;ve proposed this talk {proposedCount === 1 ? 'once' : `${proposedCount} times`}. Changes here are for
            future proposals; the ones already sent stay as they were.
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button type="submit" disabled={isPending} aria-label="Save this talk" className={primaryButton}>
            {isPending ? 'Saving…' : 'Save talk'}
          </button>
          <button type="button" disabled={isPending} onClick={onCancel} aria-label={savedTalkId ? 'Cancel editing this talk' : 'Cancel adding a talk'} className={secondaryButton}>
            Cancel
          </button>
          {savedTalkId && (
            <span className="sm:ml-auto flex flex-wrap gap-3">
              {isConfirmingDelete ? (
                <>
                  <button type="button" disabled={isPending} onClick={handleDelete} aria-label="Yes, delete this saved talk" className={dangerButton}>
                    Yes, delete it
                  </button>
                  <button type="button" disabled={isPending} onClick={() => setIsConfirmingDelete(false)} aria-label="Keep this saved talk" className={secondaryButton}>
                    Keep it
                  </button>
                </>
              ) : (
                <button type="button" disabled={isPending} onClick={() => setIsConfirmingDelete(true)} aria-label="Delete this saved talk" className={dangerOutlineButton}>
                  Delete
                </button>
              )}
            </span>
          )}
        </div>
      </form>
      {alertMessage && <Alert message={alertMessage} onDismiss={dismissAlert} />}
    </>
  );
}
