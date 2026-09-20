// The dates behind a record: when it arrived, when the person was told, when they
// answered, when their ticket went out. Useful when chasing someone, noise the rest of
// the time, so it sits behind its own disclosure rather than as a sentence of middots
// under every card. A native <details> keeps it out of the card's own open/closed state,
// so it survives collapsing and reopening the card; the dashboards' card click handlers
// ignore clicks on a summary so opening this doesn't close the card underneath it.

export interface HistoryRow {
  label: string;
  value: string;
}

interface Props {
  // Whose history this is, for the summary's aria-label. Every card on a dashboard has
  // one of these, so "Show the history" on its own would be nine identical buttons.
  subjectName: string;
  rows: HistoryRow[];
}

export default function HistoryDisclosure({ subjectName, rows }: Props) {
  return (
    <details className="group mt-4">
      <summary
        aria-label={`Show the history for ${subjectName}`}
        className="inline-flex items-center gap-1.5 cursor-pointer list-none [&::-webkit-details-marker]:hidden text-xs text-white/50 hover:text-white/75 transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-google-blue"
      >
        <svg
          className="w-3 h-3 shrink-0 transition-transform group-open:rotate-90"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 2.5l4 3.5-4 3.5" />
        </svg>
        History
      </summary>

      <dl className="mt-2 space-y-1">
        {rows.map((row) => (
          <div key={row.label} className="flex flex-wrap gap-x-3 text-xs">
            <dt className="font-mono uppercase tracking-wide text-white/50 w-36 shrink-0">{row.label}</dt>
            <dd className="text-white/65 min-w-0 break-words">{row.value}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}

// Both dashboards record who sent an email as well as when. One helper so the two can't
// join them up differently.
export function stampedOn(date: string, by?: string | null): string {
  return by ? `${date} · ${by}` : date;
}
