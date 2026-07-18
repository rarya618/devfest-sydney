'use client';

import { useState, useMemo, useEffect } from 'react';
import Alert from '@/components/Alert';

const FIELDS: { key: 'source' | 'medium' | 'campaign' | 'ref'; label: string; placeholder: string }[] = [
  { key: 'source', label: 'Source', placeholder: 'e.g. twitter' },
  { key: 'medium', label: 'Medium', placeholder: 'e.g. social' },
  { key: 'campaign', label: 'Campaign', placeholder: 'e.g. launch' },
  { key: 'ref', label: 'Ref', placeholder: 'e.g. newsletter' },
];

const DESTINATIONS: { path: string; label: string }[] = [
  { path: '/', label: 'Homepage' },
  { path: '/call-for-speakers', label: 'Call for Speakers' },
];

export default function LinksView() {
  const [origin, setOrigin] = useState('');
  const [values, setValues] = useState({ source: '', medium: '', campaign: '', ref: '' });
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (values.source.trim()) params.set('utm_source', values.source.trim());
    if (values.medium.trim()) params.set('utm_medium', values.medium.trim());
    if (values.campaign.trim()) params.set('utm_campaign', values.campaign.trim());
    if (values.ref.trim()) params.set('ref', values.ref.trim());
    return params.toString();
  }, [values]);

  function urlFor(path: string): string {
    return `${origin}${path}${query ? `?${query}` : ''}`;
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
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-black-02 tracking-tight mt-8 mb-6">Links</h1>

        <div className="bg-white border border-black-02/8 rounded-2xl px-5 py-5">
          <h2 className="text-sm font-bold text-black-02/70 mb-1">Generate a tracking link</h2>
          <p className="text-xs text-black-02/45 mb-4">
            Add a source, medium, campaign, or ref to the homepage or Call for Speakers link so submissions show up
            under &quot;Traffic sources&quot; on the Analytics page. Tracking params carry over automatically if
            someone lands on the homepage and clicks through to Call for Speakers.
          </p>

          <div className="grid sm:grid-cols-4 gap-3 mb-4">
            {FIELDS.map(({ key, label, placeholder }) => (
              <div key={key}>
                <label htmlFor={`link-gen-${key}`} className="block text-xs font-medium text-black-02/45 mb-1.5">
                  {label}
                </label>
                <input
                  id={`link-gen-${key}`}
                  type="text"
                  value={values[key]}
                  onChange={(e) => setValues((prev) => ({ ...prev, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full bg-off-white border border-black-02/10 rounded-lg px-3 py-1.5 text-sm text-black-02 placeholder-black-02/30 outline-none focus:border-google-blue/50 transition-colors"
                />
              </div>
            ))}
          </div>

          <div className="space-y-3">
            {DESTINATIONS.map(({ path, label }) => (
              <div key={path}>
                <p className="text-xs font-medium text-black-02/45 mb-1.5">{label}</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 min-w-0 truncate text-xs text-black-02/70 bg-off-white border border-black-02/10 rounded-lg px-3 py-2">
                    {urlFor(path)}
                  </code>
                  <button
                    onClick={() => handleCopy(path)}
                    aria-label={`Copy ${label} tracking link`}
                    className="shrink-0 text-xs font-semibold px-3 py-2 rounded-lg bg-google-blue text-white hover:bg-[#3574db] transition-colors"
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
