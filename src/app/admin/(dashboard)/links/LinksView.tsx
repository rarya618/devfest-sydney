'use client';

import { useState, useMemo } from 'react';
import Alert from '@/components/Alert';
import { useMobileBarHidden } from '../../MobileBarContext';

// Every public page lives on gdgsydney.com since the content pages left this app (stage 3,
// PM.md). Its Google Analytics property records the utm_* params on arrival, so that is where
// these links are counted; nothing on that site reads `ref`, so it isn't offered.
const GDG_SITE = 'https://gdgsydney.com';

type FieldKey = 'source' | 'medium' | 'campaign' | 'content';

const FIELDS: { key: FieldKey; param: string; label: string; placeholder: string }[] = [
  { key: 'source', param: 'utm_source', label: 'Source', placeholder: 'e.g. linkedin' },
  { key: 'medium', param: 'utm_medium', label: 'Medium', placeholder: 'e.g. social' },
  { key: 'campaign', param: 'utm_campaign', label: 'Campaign', placeholder: 'e.g. devfest-2027' },
  { key: 'content', param: 'utm_content', label: 'Content', placeholder: 'e.g. speaker-post' },
];

const DESTINATIONS: { path: string; label: string }[] = [
  { path: '/', label: 'GDG Sydney homepage' },
  { path: '/devfest', label: 'DevFest' },
  { path: '/speak', label: 'Speak at a meetup' },
  { path: '/guides', label: 'Starter guides' },
];

export default function LinksView() {
  const [values, setValues] = useState<Record<FieldKey, string>>({ source: '', medium: '', campaign: '', content: '' });
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const mobileBarHidden = useMobileBarHidden();

  const query = useMemo(() => {
    const params = new URLSearchParams();
    for (const { key, param } of FIELDS) {
      if (values[key].trim()) params.set(param, values[key].trim());
    }
    return params.toString();
  }, [values]);

  function urlFor(path: string): string {
    return `${GDG_SITE}${path}${query ? `?${query}` : ''}`;
  }

  async function handleCopy(path: string) {
    try {
      await navigator.clipboard.writeText(urlFor(path));
      setCopiedPath(path);
      setTimeout(() => setCopiedPath((current) => (current === path ? null : current)), 2000);
    } catch {
      setAlertMessage('Could not copy the link. Please select and copy it manually.');
    }
  }

  return (
    <>
      <div className={`sticky ${mobileBarHidden ? 'top-0' : 'top-[4.25rem]'} md:top-0 transition-[top] duration-300 ease-in-out z-20 w-full px-4 md:px-5 pt-4 pb-4 md:pt-8 md:pb-5 bg-[#010103]/95 backdrop-blur-sm`}>
        <h1 className="text-xl font-bold text-white tracking-tight">Links</h1>
      </div>

      <div className="px-4 md:px-5">
        <div className="bg-surface border border-white/10 rounded-2xl px-5 py-5">
          <h2 className="text-sm font-bold text-white/70 mb-1">Generate a tracking link</h2>
          <p className="text-xs text-white/50 mb-4">
            Add a source, medium, campaign or content tag to any link below. Visits are counted in Google
            Analytics for gdgsydney.com, under traffic acquisition, not on this app&apos;s Analytics page.
          </p>

          <div className="grid sm:grid-cols-4 gap-3 mb-4">
            {FIELDS.map(({ key, label, placeholder }) => (
              <div key={key}>
                <label htmlFor={`link-gen-${key}`} className="block text-xs font-medium text-white/50 mb-1.5">
                  {label}
                </label>
                <input
                  id={`link-gen-${key}`}
                  type="text"
                  value={values[key]}
                  onChange={(e) => setValues((prev) => ({ ...prev, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full bg-white/[0.04] border border-white/35 rounded-lg px-3 py-1.5 text-sm text-white placeholder-white/50 outline-none focus:border-google-blue transition-colors"
                />
              </div>
            ))}
          </div>

          <div className="space-y-3">
            {DESTINATIONS.map(({ path, label }) => (
              <div key={path}>
                <p className="text-xs font-medium text-white/50 mb-1.5">{label}</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 min-w-0 truncate text-xs text-white/70 bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2">
                    {urlFor(path)}
                  </code>
                  <button
                    onClick={() => handleCopy(path)}
                    aria-label={`Copy ${label} tracking link`}
                    className="shrink-0 text-xs font-semibold px-3 py-2 rounded-lg bg-google-blue-deep text-white hover:opacity-90 transition-colors"
                  >
                    {copiedPath === path ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {alertMessage && <Alert message={alertMessage} onDismiss={() => setAlertMessage(null)} />}
    </>
  );
}
