'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { updateShowcaseEntry, type ShowcaseEditableFields } from './showcaseActions';
import { SHOWCASE_STAGE_LABELS } from '@/lib/showcaseLabels';
import type { ShowcaseSubmission } from '@/lib/types';

interface Props {
  entry: ShowcaseSubmission;
  onClose: () => void;
  onError: (message: string) => void;
}

const CO_PRESENTERS_MAX = 4;

function toEditableFields(entry: ShowcaseSubmission): ShowcaseEditableFields {
  return {
    name: entry.name,
    email: entry.email,
    projectName: entry.projectName,
    pitch: entry.pitch,
    description: entry.description,
    stage: entry.stage,
    demoUrl: entry.demoUrl,
    repoUrl: entry.repoUrl,
    linkedinUrl: entry.linkedinUrl,
    builtWith: entry.builtWith,
    coPresenters: entry.coPresenters.map((coPresenter) => ({ ...coPresenter })),
    demoRequirements: entry.demoRequirements,
    isFirstTimePresenter: entry.isFirstTimePresenter,
  };
}

const inputClasses =
  'w-full rounded-lg border border-white/35 bg-white/[0.06] px-3 py-2 text-sm text-white placeholder:text-white/50 focus:outline-none focus:border-google-blue/50 focus:ring-1 focus:ring-google-blue/30';
const labelClasses = 'block text-xs font-semibold text-white/50 mb-1';

export default function EditShowcaseEntryModal({ entry, onClose, onError }: Props) {
  const [fields, setFields] = useState<ShowcaseEditableFields>(() => toEditableFields(entry));
  const [isPending, startTransition] = useTransition();

  function update<K extends keyof ShowcaseEditableFields>(key: K, value: ShowcaseEditableFields[K]) {
    setFields((previous) => ({ ...previous, [key]: value }));
  }

  function updateCoPresenter(index: number, key: 'name' | 'email', value: string) {
    setFields((previous) => ({
      ...previous,
      coPresenters: previous.coPresenters.map((coPresenter, position) =>
        position === index ? { ...coPresenter, [key]: value } : coPresenter
      ),
    }));
  }

  function addCoPresenter() {
    setFields((previous) => ({
      ...previous,
      coPresenters: [...previous.coPresenters, { name: '', email: '' }],
    }));
  }

  function removeCoPresenter(index: number) {
    setFields((previous) => ({
      ...previous,
      coPresenters: previous.coPresenters.filter((_, position) => position !== index),
    }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const result = await updateShowcaseEntry(entry.id, fields);
      if (result.error) {
        onError(result.error);
        return;
      }
      onClose();
    });
  }

  return createPortal(
    <div
      className="fixed inset-0 z-40 flex items-start sm:items-center justify-center bg-black/70 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={`Edit Builder Showcase entry: ${entry.projectName}`}
    >
      <div className="w-full max-w-xl bg-[#2d2e31] rounded-2xl shadow-xl my-8">
        <form onSubmit={handleSubmit}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <h2 className="text-lg font-bold text-white">Edit entry</h2>
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              aria-label="Close edit form"
              className="text-white/55 hover:text-white/70 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M4.47 4.47a.75.75 0 0 1 1.06 0L8 6.94l2.47-2.47a.75.75 0 1 1 1.06 1.06L9.06 8l2.47 2.47a.75.75 0 1 1-1.06 1.06L8 9.06l-2.47 2.47a.75.75 0 0 1-1.06-1.06L6.94 8 4.47 5.53a.75.75 0 0 1 0-1.06z" />
              </svg>
            </button>
          </div>

          <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClasses} htmlFor="edit-showcase-name">Name</label>
                <input
                  id="edit-showcase-name"
                  className={inputClasses}
                  value={fields.name}
                  onChange={(e) => update('name', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className={labelClasses} htmlFor="edit-showcase-email">Email</label>
                <input
                  id="edit-showcase-email"
                  type="email"
                  className={inputClasses}
                  value={fields.email}
                  onChange={(e) => update('email', e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className={labelClasses} htmlFor="edit-showcase-project">Project name</label>
              <input
                id="edit-showcase-project"
                className={inputClasses}
                maxLength={120}
                value={fields.projectName}
                onChange={(e) => update('projectName', e.target.value)}
                required
              />
            </div>

            <div>
              <label className={labelClasses} htmlFor="edit-showcase-pitch">One-line pitch</label>
              <input
                id="edit-showcase-pitch"
                className={inputClasses}
                maxLength={140}
                value={fields.pitch}
                onChange={(e) => update('pitch', e.target.value)}
                required
              />
            </div>

            <div>
              <label className={labelClasses} htmlFor="edit-showcase-description">What they&rsquo;ll demo</label>
              <textarea
                id="edit-showcase-description"
                className={`${inputClasses} min-h-[100px]`}
                maxLength={1000}
                value={fields.description}
                onChange={(e) => update('description', e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClasses} htmlFor="edit-showcase-stage">Stage</label>
                <select
                  id="edit-showcase-stage"
                  className={inputClasses}
                  value={fields.stage}
                  onChange={(e) => update('stage', e.target.value as ShowcaseEditableFields['stage'])}
                >
                  {Object.entries(SHOWCASE_STAGE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClasses} htmlFor="edit-showcase-built-with">Built with</label>
                <input
                  id="edit-showcase-built-with"
                  className={inputClasses}
                  maxLength={300}
                  value={fields.builtWith}
                  onChange={(e) => update('builtWith', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClasses} htmlFor="edit-showcase-demo-url">Project link</label>
                <input
                  id="edit-showcase-demo-url"
                  className={inputClasses}
                  value={fields.demoUrl}
                  onChange={(e) => update('demoUrl', e.target.value)}
                />
              </div>
              <div>
                <label className={labelClasses} htmlFor="edit-showcase-repo-url">Repository</label>
                <input
                  id="edit-showcase-repo-url"
                  className={inputClasses}
                  value={fields.repoUrl}
                  onChange={(e) => update('repoUrl', e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className={labelClasses} htmlFor="edit-showcase-linkedin">LinkedIn</label>
              <input
                id="edit-showcase-linkedin"
                className={inputClasses}
                value={fields.linkedinUrl}
                onChange={(e) => update('linkedinUrl', e.target.value)}
              />
            </div>

            <div>
              <label className={labelClasses} htmlFor="edit-showcase-requirements">Needs on the day</label>
              <textarea
                id="edit-showcase-requirements"
                className={`${inputClasses} min-h-[80px]`}
                maxLength={500}
                value={fields.demoRequirements}
                onChange={(e) => update('demoRequirements', e.target.value)}
              />
            </div>

            <div className="space-y-2 pt-2 border-t border-white/10">
              <p className={labelClasses}>Co-presenters</p>
              {fields.coPresenters.length === 0 && (
                <p className="text-xs text-white/50">Presenting alone.</p>
              )}
              {fields.coPresenters.map((coPresenter, index) => (
                <div key={index} className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className={labelClasses} htmlFor={`edit-showcase-copresenter-name-${index}`}>
                      Name
                    </label>
                    <input
                      id={`edit-showcase-copresenter-name-${index}`}
                      className={inputClasses}
                      maxLength={100}
                      value={coPresenter.name}
                      onChange={(e) => updateCoPresenter(index, 'name', e.target.value)}
                    />
                  </div>
                  <div className="flex-1">
                    <label className={labelClasses} htmlFor={`edit-showcase-copresenter-email-${index}`}>
                      Email
                    </label>
                    <input
                      id={`edit-showcase-copresenter-email-${index}`}
                      type="email"
                      className={inputClasses}
                      maxLength={200}
                      value={coPresenter.email}
                      onChange={(e) => updateCoPresenter(index, 'email', e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeCoPresenter(index)}
                    aria-label={`Remove co-presenter ${index + 1}`}
                    className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-lg border border-white/10 text-white/55 hover:border-white/20 hover:text-white transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
                      <path strokeLinecap="round" d="M4 4l8 8M12 4l-8 8" />
                    </svg>
                  </button>
                </div>
              ))}
              {fields.coPresenters.length < CO_PRESENTERS_MAX && (
                <button
                  type="button"
                  onClick={addCoPresenter}
                  aria-label="Add a co-presenter"
                  className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-white/70 hover:border-white/20 hover:text-white transition-colors"
                >
                  Add co-presenter
                </button>
              )}
            </div>

            <div className="pt-2 border-t border-white/10">
              <label className="flex items-center gap-2 text-sm text-white/70">
                <input
                  type="checkbox"
                  checked={fields.isFirstTimePresenter}
                  onChange={(e) => update('isFirstTimePresenter', e.target.checked)}
                />
                First-time presenter
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-white/50 hover:border-white/20 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              aria-label="Save changes to this Builder Showcase entry"
              className="text-xs px-4 py-1.5 rounded-lg bg-google-blue-deep text-white font-medium hover:opacity-90 transition-colors disabled:opacity-50"
            >
              {isPending ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
