'use client';

import { useCallback, useState, useTransition, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Alert from '@/components/Alert';
import { hintClass, inputNormal, labelClass, submitClass } from '@/lib/formStyles';
import { findSavedTalkError, SAVED_TALK_LIMITS, type SavedTalkFields } from '@/lib/portalLabels';
import { deleteSavedTalk, saveTalkForLater } from '../actions';

interface SavedTalkEditorProps {
  // Null for a new talk.
  savedTalkId: string | null;
  initialFields: SavedTalkFields;
  // Where it has been proposed, to explain that those proposals won't change.
  proposedCount: number;
}

const secondaryButton =
  'inline-flex items-center px-5 py-2 text-sm font-bold rounded border transition-colors disabled:opacity-50';

export default function SavedTalkEditor({ savedTalkId, initialFields, proposedCount }: SavedTalkEditorProps) {
  const router = useRouter();
  const [fields, setFields] = useState<SavedTalkFields>(initialFields);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const dismissAlert = useCallback(() => setAlertMessage(null), []);

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
      else router.push('/portal');
    });
  }

  function handleDelete() {
    if (!savedTalkId) return;
    startTransition(async () => {
      const result = await deleteSavedTalk(savedTalkId);
      if (result.error) {
        setAlertMessage(result.error);
        setIsConfirmingDelete(false);
      } else router.push('/portal');
    });
  }

  return (
    <>
      <form onSubmit={handleSave} noValidate className="space-y-6">
        <div>
          <label htmlFor="saved-title" className={labelClass}>
            Title <span className="text-google-red-light" aria-hidden="true">*</span>
          </label>
          <input id="saved-title" value={fields.talkTitle} required maxLength={SAVED_TALK_LIMITS.talkTitle} onChange={(event) => update('talkTitle', event.target.value)} className={inputNormal} />
        </div>
        <div>
          <label htmlFor="saved-abstract" className={labelClass}>Abstract</label>
          <textarea id="saved-abstract" rows={8} value={fields.abstract} maxLength={SAVED_TALK_LIMITS.abstract} aria-describedby="saved-abstract-hint" onChange={(event) => update('abstract', event.target.value)} className={`${inputNormal} resize-y`} />
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
          <button type="submit" disabled={isPending} aria-label="Save this talk" className={submitClass}>
            {isPending ? 'Saving…' : 'Save talk'}
          </button>
          {savedTalkId &&
            (isConfirmingDelete ? (
              <>
                <button type="button" disabled={isPending} onClick={handleDelete} aria-label="Yes, delete this saved talk" className={`${secondaryButton} bg-google-red-deep border-google-red-deep text-white`}>
                  Yes, delete it
                </button>
                <button type="button" disabled={isPending} onClick={() => setIsConfirmingDelete(false)} aria-label="Keep this saved talk" className={`${secondaryButton} border-white/35 text-white hover:border-white`}>
                  Keep it
                </button>
              </>
            ) : (
              <button type="button" disabled={isPending} onClick={() => setIsConfirmingDelete(true)} aria-label="Delete this saved talk" className={`${secondaryButton} border-white/35 text-google-red-light hover:border-white`}>
                Delete
              </button>
            ))}
        </div>
      </form>
      {alertMessage && <Alert message={alertMessage} onDismiss={dismissAlert} />}
    </>
  );
}
