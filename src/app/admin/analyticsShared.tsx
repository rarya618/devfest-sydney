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
export function StatStrip({ children, className = 'mb-6' }: { children: ReactNode; className?: string }) {
  return (
    <dl className={`grid grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] gap-x-8 gap-y-5 rounded-2xl bg-surface px-5 py-5 ${className}`}>
      {children}
    </dl>
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
    <div>
      <dt className="flex items-center gap-1.5 text-sm text-white/60">
        {status && <span aria-hidden="true" className={`h-1.5 w-1.5 shrink-0 rounded-full ${STAT_STATUS_DOTS[status]}`} />}
        {label}
      </dt>
      <dd className={`mt-1 text-2xl font-bold tabular-nums tracking-tight ${count === 0 ? 'text-white/60' : 'text-off-white'}`}>{count}</dd>
      {subtext && <p className="mt-0.5 text-xs text-white/60">{subtext}</p>}
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
    <div className="bg-surface border border-white/10 rounded-2xl px-5 py-5">
      <h2 className="text-sm font-bold text-white/70 mb-4">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return <div className="text-center py-16 text-white/55 text-sm">{message}</div>;
}

export function getChannel(tracking: SubmissionTracking): string {
  // Internal CTAs (banner, navbar, footer, etc.) all share the same utm_source, so bucket
  // those by their more specific ref instead, so "banner" and "footer" show up separately.
  if (tracking.utmSource && tracking.utmSource !== INTERNAL_UTM_SOURCE) return tracking.utmSource;
  if (tracking.ref) return tracking.ref;
  if (tracking.utmSource) return tracking.utmSource;
  return 'No source recorded';
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
