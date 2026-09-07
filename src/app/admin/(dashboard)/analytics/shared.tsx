import type { ReactNode } from 'react';
import type { SubmissionTracking } from '@/lib/types';
import { INTERNAL_UTM_SOURCE } from '@/lib/tracking';

export type AnalyticsAccent = 'blue' | 'green' | 'yellow';

// Full class strings so Tailwind can see them; each tab colours its chart to match the
// left border of the matching dashboard's cards (CfS blue, volunteers green, showcase yellow).
export const ACCENT_CHART_CLASSES: Record<AnalyticsAccent, { fill: string; stroke: string; bar: string }> = {
  blue: { fill: 'fill-google-blue', stroke: 'stroke-google-blue', bar: 'bg-google-blue' },
  green: { fill: 'fill-google-green', stroke: 'stroke-google-green', bar: 'bg-google-green' },
  yellow: { fill: 'fill-google-yellow', stroke: 'stroke-google-yellow', bar: 'bg-google-yellow' },
};

type StatAccent = 'neutral' | 'blue' | 'yellow' | 'green' | 'muted';

const STAT_ACCENT_STYLES: Record<StatAccent, { border: string; bg: string; iconBg: string; iconText: string; countText: string }> = {
  neutral: { border: 'border-white/15', bg: 'bg-surface', iconBg: 'bg-white/10', iconText: 'text-white/70', countText: 'text-white' },
  blue: { border: 'border-google-blue/25', bg: 'bg-google-blue/[0.08]', iconBg: 'bg-google-blue/15', iconText: 'text-google-blue', countText: 'text-google-blue' },
  yellow: { border: 'border-google-yellow/25', bg: 'bg-google-yellow/[0.08]', iconBg: 'bg-google-yellow/15', iconText: 'text-google-yellow', countText: 'text-google-yellow' },
  green: { border: 'border-google-green/25', bg: 'bg-google-green/[0.08]', iconBg: 'bg-google-green/15', iconText: 'text-google-green', countText: 'text-google-green' },
  muted: { border: 'border-white/10', bg: 'bg-surface', iconBg: 'bg-white/10', iconText: 'text-white/55', countText: 'text-white/50' },
};

const STAT_ICON_PATHS = {
  layers: 'M12 3 2 8l10 5 10-5-10-5ZM2 12l10 5 10-5M2 16l10 5 10-5',
  users: 'M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M11 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM12 6v6l4 2',
  check: 'M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3',
  x: 'M18 6 6 18M6 6l12 12',
} as const;

type StatIconName = keyof typeof STAT_ICON_PATHS;

function StatIcon({ name, className }: { name: StatIconName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={STAT_ICON_PATHS[name]} />
    </svg>
  );
}

export function StatTile({
  label,
  count,
  subtext,
  accent = 'neutral',
  icon,
}: {
  label: string;
  count: number;
  subtext?: string;
  accent?: StatAccent;
  icon: StatIconName;
}) {
  const styles = STAT_ACCENT_STYLES[count === 0 ? 'muted' : accent];
  return (
    <div
      title={subtext}
      className={`group inline-flex items-center gap-3 rounded-full border ${styles.border} ${styles.bg} pl-2 pr-6 py-2`}
    >
      <span className={`flex items-center justify-center w-8 h-8 rounded-full shrink-0 ${styles.iconBg} ${styles.iconText}`}>
        <StatIcon name={icon} className="w-4 h-4" />
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-[11px] font-medium text-white/50">{label}</span>
        <span className={`text-lg font-bold tracking-tight ${styles.countText}`}>{count}</span>
      </span>
    </div>
  );
}

// The Total / Unique / Pending / Accepted / Rejected row every tab opens with.
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
  const percentOfTotal = (count: number) => (total > 0 ? `${Math.round((count / total) * 100)}% of total` : undefined);
  return (
    <div className="flex flex-wrap gap-2.5 mb-6">
      <StatTile label={totalLabel} count={total} icon="layers" accent="neutral" />
      <StatTile
        label={uniqueLabel}
        count={uniqueCount}
        subtext={total > 0 ? `${Math.round((uniqueCount / total) * 100)}% of ${totalLabel.toLowerCase()}` : undefined}
        icon="users"
        accent="blue"
      />
      <StatTile label="Pending" count={pending} subtext={percentOfTotal(pending)} icon="clock" accent="yellow" />
      <StatTile label="Accepted" count={accepted} subtext={percentOfTotal(accepted)} icon="check" accent="green" />
      <StatTile label="Rejected" count={rejected} subtext={percentOfTotal(rejected)} icon="x" accent="muted" />
    </div>
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
        <span className="flex items-center gap-2 font-medium text-white/70">
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
  // Internal CTAs (banner, navbar, footer, etc.) all share the same utm_source — bucket
  // those by their more specific ref instead, so "banner" and "footer" show up separately.
  if (tracking.utmSource && tracking.utmSource !== INTERNAL_UTM_SOURCE) return tracking.utmSource;
  if (tracking.ref) return tracking.ref;
  if (tracking.utmSource) return tracking.utmSource;
  return 'Direct / unknown';
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
