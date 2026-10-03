'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  STARTER_GUIDES,
  STARTER_GUIDE_GROUPS,
  STARTER_GUIDE_CODING_LABELS,
  starterGuideSetupLabel,
  type StarterGuide,
} from './guides';

const GROUP_LABELS = Object.fromEntries(STARTER_GUIDE_GROUPS.map((groupInfo) => [groupInfo.id, groupInfo.label]));

// Everything a search can match on: what the card shows, plus the name of its group.
function searchableText(guide: StarterGuide): string {
  return [
    guide.title,
    guide.summary,
    STARTER_GUIDE_CODING_LABELS[guide.coding],
    starterGuideSetupLabel(guide),
    GROUP_LABELS[guide.group],
  ]
    .join(' ')
    .toLowerCase();
}

// Every word of the query has to appear somewhere, in any order, so "no code design" finds Stitch.
function matchesQuery(guide: StarterGuide, query: string): boolean {
  const queryWords = query.toLowerCase().split(/\s+/).filter(Boolean);
  const guideText = searchableText(guide);
  return queryWords.every((queryWord) => guideText.includes(queryWord));
}

function GuideCard({ guide, borderClass }: { guide: StarterGuide; borderClass: string }) {
  const codingLabel = STARTER_GUIDE_CODING_LABELS[guide.coding];
  const setupLabel = starterGuideSetupLabel(guide);

  return (
    <li className="w-full sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)]">
      <a
        href={guide.href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Open ${guide.title}, ${codingLabel}, ${setupLabel} (opens in a new tab)`}
        className={`group flex h-full flex-col gap-3 rounded-lg border-t-4 ${borderClass} bg-surface px-6 pt-9 pb-6 transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-google-blue`}
      >
        {guide.logo && (
          <Image
            src={guide.logo.url}
            alt={guide.logo.alt}
            width={guide.logo.width}
            height={guide.logo.height}
            className="mb-3 h-8 w-auto self-start object-contain"
          />
        )}
        <h3 className="text-xl font-bold text-white">{guide.title}</h3>
        <p className="flex-1 text-base text-white/75 leading-relaxed">{guide.summary}</p>
        {/* Below the flex-1 summary, so the tags line up across a row of cards. */}
        <ul className="flex flex-wrap gap-2" aria-hidden="true">
          {[codingLabel, setupLabel].map((tagLabel) => (
            <li key={tagLabel} className="inline-flex items-center rounded px-1.5 py-0.5 font-mono text-[11px] font-bold text-white/70 border border-white/25">
              {tagLabel}
            </li>
          ))}
        </ul>
        <span className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-white" aria-hidden="true">
          Open guide
          <span className="material-symbols-outlined text-sm leading-none transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
            arrow_outward
          </span>
        </span>
      </a>
    </li>
  );
}

export default function StarterGuidesBrowser() {
  const [query, setQuery] = useState('');

  const matchingGuides = STARTER_GUIDES.filter((guide) => matchesQuery(guide, query));
  const visibleGroups = STARTER_GUIDE_GROUPS.map((groupInfo) => ({
    ...groupInfo,
    guides: matchingGuides.filter((guide) => guide.group === groupInfo.id),
  })).filter((groupInfo) => groupInfo.guides.length > 0);

  const isSearching = query.trim() !== '';
  const resultSummary = isSearching
    ? `${matchingGuides.length} ${matchingGuides.length === 1 ? 'guide matches' : 'guides match'} your search`
    : `${STARTER_GUIDES.length} guides`;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="relative max-w-xl mx-auto mb-14">
        <label htmlFor="starter-guide-search" className="sr-only">
          Search starter guides
        </label>
        <span className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl leading-none text-white/55" aria-hidden="true">
          search
        </span>
        <input
          id="starter-guide-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search guides, e.g. Gemini, no code, npm"
          aria-label="Search starter guides by name, topic, or what they need"
          className="w-full h-12 rounded-full border border-white/35 bg-transparent pl-12 pr-5 text-base text-white placeholder:text-white/50 focus:outline-none focus:border-google-blue focus:ring-2 focus:ring-google-blue/40"
        />
        <p className="sr-only" aria-live="polite">
          {resultSummary}
        </p>
      </div>

      {visibleGroups.length === 0 ? (
        <div className="max-w-xl mx-auto bg-white/[0.025] border border-white/10 rounded-2xl p-12 text-center">
          <h2 className="text-lg font-bold text-white/70 mb-3">No guides match &ldquo;{query.trim()}&rdquo;</h2>
          <p className="text-sm text-white/55 leading-relaxed">
            Try a product name like Gemini or Flutter, or a tag like &ldquo;no code&rdquo;.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-16">
          {visibleGroups.map((groupInfo) => (
            <section key={groupInfo.id} aria-labelledby={`starter-guide-group-${groupInfo.id}`}>
              <h2 id={`starter-guide-group-${groupInfo.id}`} className="mb-6 text-2xl font-bold text-white text-center">
                {groupInfo.label}
              </h2>
              {/* Centred wrapping row rather than a grid, so one or two guides don't sit off to the left. */}
              <ul className="flex flex-wrap justify-center gap-6">
                {groupInfo.guides.map((guide) => (
                  <GuideCard key={guide.href} guide={guide} borderClass={groupInfo.borderClass} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
