import { Children, isValidElement } from 'react';
import type { ReactNode } from 'react';
import type { SubmissionTracking } from '@/lib/types';
import { INTERNAL_UTM_SOURCE } from '@/lib/tracking';

export type AnalyticsAccent = 'blue' | 'green' | 'yellow';

// Full class strings so Tailwind can see them; each tab colours its chart to match its
// form (talk proposals blue, volunteers green, showcase yellow).
export const ACCENT_CHART_CLASSES: Record<AnalyticsAccent, { fill: string; stroke: string; bar: string }> = {
  blue: { fill: 'fill-google-blue', stroke: 'stroke-google-blue', bar: 'bg-google-blue' },
  green: { fill: 'fill-google-green', stroke: 'stroke-google-green', bar: 'bg-google-green' },
  yellow: { fill: 'fill-google-yellow', stroke: 'stroke-google-yellow', bar: 'bg-google-yellow' },
};

// A row of figures in one panel: a large number under its label, with a status dot only where
// the figure is a record's status (DESIGN.md, Admin tables: one signal per fact, no tinted
// chips). Replaces the icon-and-tint pills, which repeated the cards below them.
//
// The column count follows the number of figures and the panel's own width (a container
// query, since the same strip sits full width and in half a column), so a figure is never
// left alone on a row: four go 2 by 2 then 4 across, five go 3 and 2 then 5 across. Each
// figure is a subgrid of three rows, so a label that wraps keeps the numbers beside it level.
const STAT_STRIP_COLUMNS: Record<number, string> = {
  3: 'grid-cols-3',
  4: 'grid-cols-2 @xl:grid-cols-4',
  5: 'grid-cols-3 @2xl:grid-cols-5',
};

export function StatStrip({ children, className = 'mb-6' }: { children: ReactNode; className?: string }) {
  const figureCount = Children.toArray(children).filter(isValidElement).length;
  const columns = STAT_STRIP_COLUMNS[figureCount] ?? 'grid-cols-[repeat(auto-fit,minmax(6.5rem,1fr))] sm:grid-cols-[repeat(auto-fit,minmax(9rem,1fr))]';
  return (
    <div className={`@container rounded-2xl bg-surface px-4 py-4 sm:px-5 sm:py-5 ${className}`}>
      <dl className={`-mb-4 grid gap-x-4 gap-y-0 sm:-mb-5 sm:gap-x-8 ${columns}`}>{children}</dl>
    </div>
  );
}

type StatStatus = 'waiting' | 'good' | 'done';

const STAT_STATUS_DOTS: Record<StatStatus, string> = {
  waiting: 'bg-google-yellow',
  good: 'bg-google-green',
  done: 'bg-white/40',
};

export function StatTile({
  label,
  count,
  subtext,
  status,
}: {
  label: string;
  count: number;
  subtext?: string;
  status?: StatStatus;
}) {
  return (
    <div className="row-span-3 mb-4 grid grid-rows-subgrid content-start gap-y-1 sm:mb-5">
      <dt className="flex items-start gap-1.5 self-end text-balance text-sm text-white/60">
        {status && <span aria-hidden="true" className={`mt-[0.4375rem] h-1.5 w-1.5 shrink-0 rounded-full ${STAT_STATUS_DOTS[status]}`} />}
        {label}
      </dt>
      <dd className={`text-2xl font-bold tabular-nums tracking-tight ${count === 0 ? 'text-white/60' : 'text-off-white'}`}>{count}</dd>
      {subtext && <dd className="-mt-0.5 text-xs text-white/60">{subtext}</dd>}
    </div>
  );
}

// The Total / People / Pending / Accepted / Not selected row every tab opens with.
export function StatusTiles({
  total,
  totalLabel,
  uniqueCount,
  uniqueLabel,
  pending,
  accepted,
  rejected,
}: {
  total: number;
  totalLabel: string;
  uniqueCount: number;
  uniqueLabel: string;
  pending: number;
  accepted: number;
  rejected: number;
}) {
  const percentOfTotal = (count: number) => (total > 0 ? `${Math.round((count / total) * 100)}% of ${totalLabel.toLowerCase()}` : undefined);
  return (
    <StatStrip>
      <StatTile label={totalLabel} count={total} />
      <StatTile label={uniqueLabel} count={uniqueCount} />
      <StatTile label="Pending" count={pending} subtext={percentOfTotal(pending)} status="waiting" />
      <StatTile label="Accepted" count={accepted} subtext={percentOfTotal(accepted)} status="good" />
      <StatTile label="Not selected" count={rejected} subtext={percentOfTotal(rejected)} status="done" />
    </StatStrip>
  );
}

export function BarRow({
  label,
  count,
  total,
  dotClass,
  barClass = 'bg-google-blue',
}: {
  label: string;
  count: number;
  total: number;
  dotClass?: string;
  barClass?: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div title={`${label}: ${count} of ${total} (${pct}%)`}>
      <div className="flex items-center justify-between text-sm mb-1.5">
        <span className="flex items-center gap-2 font-normal text-white/70">
          {dotClass && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClass}`} aria-hidden="true" />}
          {label}
        </span>
        <span className="text-white/55 text-xs shrink-0">{count} &middot; {pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <div className={`h-full rounded-full ${barClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function BreakdownCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl bg-surface px-5 py-5">
      <h2 className="text-sm font-bold text-white/70 mb-4">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

// "Where they heard of us": a bar per source, or one plain sentence when there is only one
// source to report, which a lone bar at 100% says worse.
export function ChannelsCard({
  title,
  channels,
  total,
  noun,
  barClass,
}: {
  title: string;
  channels: [string, number][];
  total: number;
  noun: string;
  barClass?: string;
}) {
  if (channels.length === 1) {
    const [source] = channels[0];
    return (
      <p className="text-sm text-white/60 sm:col-span-2">
        {source === NO_SOURCE_LABEL ? `No source was recorded for any of the ${total} ${noun}.` : `All ${total} ${noun} came from ${source}.`}
      </p>
    );
  }
  return (
    <BreakdownCard title={title}>
      {channels.map(([channel, count]) => (
        <BarRow key={channel} label={channel} count={count} total={total} barClass={barClass} />
      ))}
    </BreakdownCard>
  );
}

// A fold for detail that most visits skip. The chevron turns as it opens, as on a record's
// History (HistoryDisclosure.tsx), so it reads as a control rather than a heading.
export function Disclosure({
  summary,
  children,
  className = '',
  size = 'sm',
}: {
  summary: ReactNode;
  children: ReactNode;
  className?: string;
  size?: 'sm' | 'xs';
}) {
  const textClasses = size === 'xs' ? 'text-xs text-white/60' : 'text-sm font-bold text-white/70';
  return (
    <details className={`group ${className}`}>
      <summary
        className={`inline-flex min-h-11 cursor-pointer select-none list-none items-center gap-1.5 rounded-lg pr-1 transition-colors hover:text-off-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-google-blue [&::-webkit-details-marker]:hidden ${textClasses}`}
      >
        <svg
          className="h-3 w-3 shrink-0 transition-transform duration-200 group-open:rotate-90"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 2.5l4 3.5-4 3.5" />
        </svg>
        {summary}
      </summary>
      {children}
    </details>
  );
}

export function EmptyState({ message }: { message: string }) {
  return <div className="text-center py-16 text-white/55 text-sm">{message}</div>;
}

const NO_SOURCE_LABEL = 'No source recorded';

export function getChannel(tracking: SubmissionTracking): string {
  // Internal CTAs (banner, navbar, footer, etc.) all share the same utm_source, so bucket
  // those by their more specific ref instead, so "banner" and "footer" show up separately.
  if (tracking.utmSource && tracking.utmSource !== INTERNAL_UTM_SOURCE) return tracking.utmSource;
  if (tracking.ref) return tracking.ref;
  if (tracking.utmSource) return tracking.utmSource;
  return NO_SOURCE_LABEL;
}

export function countChannels(entries: { tracking: SubmissionTracking }[]): [string, number][] {
  const channelCounts: Record<string, number> = {};
  for (const entry of entries) {
    const channel = getChannel(entry.tracking);
    channelCounts[channel] = (channelCounts[channel] ?? 0) + 1;
  }
  return Object.entries(channelCounts).sort((a, b) => b[1] - a[1]);
}

export function countUniqueEmails(entries: { email: string }[]): number {
  return new Set(entries.map((entry) => entry.email.trim().toLowerCase())).size;
}
