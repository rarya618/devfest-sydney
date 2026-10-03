'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import {
  STARTER_GUIDES,
  STARTER_GUIDE_BEGINNER_PATH,
  STARTER_GUIDE_GROUPS,
  STARTER_GUIDE_CODING_LABELS,
  starterGuideSetupLabel,
  starterGuideTimeLabel,
  starterGuideCheckedLabel,
  type StarterGuide,
  type StarterGuideGroup,
} from './guides';

const GROUP_LABELS = Object.fromEntries(STARTER_GUIDE_GROUPS.map((groupInfo) => [groupInfo.id, groupInfo.label]));
type GroupFilter = StarterGuideGroup | 'all';

const GROUP_ORDER = Object.fromEntries(STARTER_GUIDE_GROUPS.map((groupInfo, groupIndex) => [groupInfo.id, groupIndex]));
const GROUP_BORDER_CLASSES = Object.fromEntries(STARTER_GUIDE_GROUPS.map((groupInfo) => [groupInfo.id, groupInfo.borderClass]));
const GROUP_SIDE_BORDER_CLASSES = Object.fromEntries(STARTER_GUIDE_GROUPS.map((groupInfo) => [groupInfo.id, groupInfo.sideBorderClass]));

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
  const timeLabel = starterGuideTimeLabel(guide);
  const checkedLabel = starterGuideCheckedLabel(guide);

  return (
    <li>
      <a
        href={guide.href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Open ${guide.title}, ${codingLabel}, ${setupLabel}, takes about ${timeLabel.replace('~', '')}, link checked ${checkedLabel} (opens in a new tab)`}
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
          {[codingLabel, setupLabel, timeLabel].map((tagLabel) => (
            <li key={tagLabel} className="inline-flex items-center rounded px-1.5 py-0.5 font-mono text-[11px] font-bold text-white/70 border border-white/25">
              {tagLabel}
            </li>
          ))}
        </ul>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1" aria-hidden="true">
          <span className="inline-flex items-center gap-1 text-sm font-bold text-white">
            Get started
            <span className="material-symbols-outlined text-sm leading-none transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
              arrow_outward
            </span>
          </span>
          <span className="font-mono text-xs text-white/50">Checked {checkedLabel}</span>
        </div>
      </a>
    </li>
  );
}

// The beginner path's steps joined to their guides, dropping any whose guide has been removed.
const BEGINNER_STEPS = STARTER_GUIDE_BEGINNER_PATH.flatMap((step) => {
  const guide = STARTER_GUIDES.find((candidate) => candidate.href === step.href);
  return guide ? [{ ...step, guide }] : [];
});
const BEGINNER_TOTAL_MINUTES = BEGINNER_STEPS.reduce((total, step) => total + step.guide.minutes, 0);

// A compact numbered list rather than more cards: the same guides appear as cards in their groups.
function BeginnerPath() {
  if (BEGINNER_STEPS.length === 0) return null;
  const roundedTotal = Math.round(BEGINNER_TOTAL_MINUTES / 5) * 5;

  return (
    <section aria-labelledby="starter-guide-beginner-path" className="rounded-2xl border border-white/15 bg-white/[0.025] p-6 sm:p-8">
      <h2 id="starter-guide-beginner-path" className="text-2xl font-bold text-white">
        New to coding? Start with these {BEGINNER_STEPS.length}
      </h2>
      <p className="mt-2 text-base text-white/70 leading-relaxed">
        In order, from no code to your first code. All in the browser with nothing to install, about{' '}
        {roundedTotal} minutes in total.
      </p>
      <ol className="mt-6 flex flex-col gap-3">
        {BEGINNER_STEPS.map((step, stepIndex) => (
          <li key={step.href}>
            <a
              href={step.guide.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Step ${stepIndex + 1}: ${step.guide.title}. ${step.why} Takes about ${starterGuideTimeLabel(step.guide).replace('~', '')} (opens in a new tab)`}
              className={`group flex items-center gap-4 rounded-lg border-l-4 ${GROUP_SIDE_BORDER_CLASSES[step.guide.group]} bg-surface px-4 py-4 transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-google-blue`}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/35 font-mono text-sm font-bold text-white" aria-hidden="true">
                {stepIndex + 1}
              </span>
              <span className="flex-1" aria-hidden="true">
                <span className="block font-bold text-white">{step.guide.title}</span>
                <span className="block text-sm text-white/70">{step.why}</span>
              </span>
              <span className="hidden sm:inline font-mono text-xs text-white/55" aria-hidden="true">
                {starterGuideTimeLabel(step.guide)}
              </span>
              <span className="material-symbols-outlined text-base leading-none text-white transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true">
                arrow_outward
              </span>
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}

// Cards sit in a grid beside the sidebar: one column on phones, never more than two.
const CARD_GRID_CLASSES = 'grid gap-6 sm:grid-cols-2';

export default function StarterGuidesBrowser() {
  const [query, setQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<GroupFilter>('all');
  const browserTopRef = useRef<HTMLDivElement>(null);
  const scrollToTopAfterRenderRef = useRef(false);

  // Picking a group can shrink the page a lot, which would leave someone scrolled down past the
  // list they just asked for. Bring the top of the guides back into view if it is above the fold.
  // Done after the render: a smooth scroll started in the click handler is cut short when the
  // page shrinks underneath it.
  function selectGroup(groupFilter: GroupFilter) {
    scrollToTopAfterRenderRef.current = true;
    setSelectedGroup(groupFilter);
  }

  useEffect(() => {
    if (!scrollToTopAfterRenderRef.current) return;
    scrollToTopAfterRenderRef.current = false;
    const browserTop = browserTopRef.current;
    if (browserTop && browserTop.getBoundingClientRect().top < 0) {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      browserTop.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
    }
  }, [selectedGroup]);

  // Search first, so the sidebar can count matches per group whichever group is selected.
  // In group order, then list order within a group, so related results sit together.
  const searchMatches = STARTER_GUIDES.filter((guide) => matchesQuery(guide, query)).sort(
    (firstGuide, secondGuide) => GROUP_ORDER[firstGuide.group] - GROUP_ORDER[secondGuide.group],
  );
  const matchingGuides =
    selectedGroup === 'all' ? searchMatches : searchMatches.filter((guide) => guide.group === selectedGroup);

  const sidebarEntries: { id: GroupFilter; label: string; dotClass?: string; count: number }[] = [
    { id: 'all', label: 'All guides', count: searchMatches.length },
    ...STARTER_GUIDE_GROUPS.map((groupInfo) => ({
      id: groupInfo.id,
      label: groupInfo.label,
      dotClass: groupInfo.dotClass,
      count: searchMatches.filter((guide) => guide.group === groupInfo.id).length,
    })),
  ];

  const isSearching = query.trim() !== '';
  const selectedGroupLabel = selectedGroup === 'all' ? null : GROUP_LABELS[selectedGroup];
  const isSingleResult = matchingGuides.length === 1;
  const resultSummary = `${matchingGuides.length} ${isSingleResult ? 'guide' : 'guides'}${
    selectedGroupLabel ? ` in ${selectedGroupLabel}` : ''
  }${isSearching ? ` ${isSingleResult ? 'matches' : 'match'} your search` : ''}`;

  // Group headings only help when browsing everything. A search or a single group is one list.
  const showGroupHeadings = selectedGroup === 'all' && !isSearching;
  const groupedGuides = STARTER_GUIDE_GROUPS.map((groupInfo) => ({
    ...groupInfo,
    guides: matchingGuides.filter((guide) => guide.group === groupInfo.id),
  })).filter((groupInfo) => groupInfo.guides.length > 0);

  return (
    // scroll-mt clears the fixed navbar when selectGroup scrolls back up to here.
    <div ref={browserTopRef} className="max-w-6xl mx-auto scroll-mt-32 lg:grid lg:grid-cols-[15rem_1fr] lg:gap-12">
      {/* Sticky below the fixed navbar on wide screens; stacked above the cards on narrow ones. */}
      <aside className="mb-10 lg:mb-0 lg:sticky lg:top-32 lg:self-start">
        <label htmlFor="starter-guide-search" className="sr-only">
          Search starter guides
        </label>
        <div className="relative">
          <span className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl leading-none text-white/55" aria-hidden="true">
            search
          </span>
          <input
            id="starter-guide-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search guides"
            aria-label="Search starter guides by name, topic, or what they need"
            className="w-full h-12 rounded-full border border-white/35 bg-transparent pl-12 pr-5 text-base text-white placeholder:text-white/50 focus:outline-none focus:border-google-blue focus:ring-2 focus:ring-google-blue/40"
          />
        </div>

        <nav aria-label="Guide groups" className="mt-6">
          <p className="mb-3 font-mono text-xs text-white/55">Groups</p>
          {/* Wrapping chips on narrow screens, a vertical list beside the cards on wide ones. */}
          <ul className="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
            {sidebarEntries.map((entry) => {
              const isSelected = selectedGroup === entry.id;
              return (
                <li key={entry.id}>
                  <button
                    type="button"
                    onClick={() => selectGroup(entry.id)}
                    aria-pressed={isSelected}
                    aria-label={`Show ${entry.id === 'all' ? 'all guides' : `${entry.label} guides`}, ${entry.count} ${entry.count === 1 ? 'guide' : 'guides'}`}
                    className={`flex w-full items-center gap-3 rounded-full border px-4 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-google-blue lg:rounded-lg lg:border-transparent lg:px-3 ${
                      isSelected
                        ? 'border-white/35 bg-white/10 font-bold text-white'
                        : 'border-white/15 text-white/70 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {entry.dotClass ? (
                      <span className={`h-2 w-2 shrink-0 rounded-full ${entry.dotClass}`} aria-hidden="true" />
                    ) : (
                      <span className="h-2 w-2 shrink-0 rounded-full border border-white/55" aria-hidden="true" />
                    )}
                    <span className="flex-1">{entry.label}</span>
                    <span className="font-mono text-xs text-white/55" aria-hidden="true">
                      {entry.count}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Visible once something narrows the list; screen readers hear it change either way. */}
        <p
          className={isSearching || selectedGroupLabel ? 'mt-6 font-mono text-sm text-white/55' : 'sr-only'}
          aria-live="polite"
        >
          {resultSummary}
        </p>
      </aside>

      <div>
        {matchingGuides.length === 0 ? (
          <div className="bg-white/[0.025] border border-white/10 rounded-2xl p-12 text-center">
            <h2 className="text-lg font-bold text-white/70 mb-3">
              No {selectedGroupLabel ? `${selectedGroupLabel} ` : ''}guides match &ldquo;{query.trim()}&rdquo;
            </h2>
            <p className="text-sm text-white/55 leading-relaxed">
              {selectedGroup !== 'all' && searchMatches.length > 0 ? (
                <button
                  type="button"
                  onClick={() => selectGroup('all')}
                  aria-label={`Show all ${searchMatches.length} matching guides from every group`}
                  className="underline underline-offset-2 hover:text-white transition-colors"
                >
                  {searchMatches.length} {searchMatches.length === 1 ? 'guide matches' : 'guides match'} in other groups
                </button>
              ) : (
                <>Try a product name like Gemini or Flutter, or a tag like &ldquo;no code&rdquo;.</>
              )}
            </p>
          </div>
        ) : showGroupHeadings ? (
          <div className="flex flex-col gap-16">
            <BeginnerPath />
            {groupedGuides.map((groupInfo) => (
              <section key={groupInfo.id} aria-labelledby={`starter-guide-group-${groupInfo.id}`}>
                <h2 id={`starter-guide-group-${groupInfo.id}`} className="mb-6 text-2xl font-bold text-white">
                  {groupInfo.label}
                </h2>
                <ul className={CARD_GRID_CLASSES}>
                  {groupInfo.guides.map((guide) => (
                    <GuideCard key={guide.href} guide={guide} borderClass={groupInfo.borderClass} />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        ) : (
          // One list for a search or a single group. Each card keeps its group's border colour.
          <>
            <h2 className={selectedGroupLabel ? 'mb-6 text-2xl font-bold text-white' : 'sr-only'}>
              {selectedGroupLabel ?? 'Search results'}
            </h2>
            <ul className={CARD_GRID_CLASSES}>
              {matchingGuides.map((guide) => (
                <GuideCard key={guide.href} guide={guide} borderClass={GROUP_BORDER_CLASSES[guide.group]} />
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
