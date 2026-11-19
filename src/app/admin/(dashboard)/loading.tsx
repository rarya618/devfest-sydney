// Shown inside the shell while a dashboard page fetches its data. Mirrors the shape the
// busiest dashboards share since issue #9: a title row with its controls, then a table of rows.
export default function AdminDashboardLoading() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="w-full px-4 md:px-5 pt-4 pb-3 md:pt-8 md:pb-4">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <div className="min-h-[3.25rem] flex flex-col justify-center gap-2">
            <div className="h-6 w-40 rounded-md bg-white/[0.08] animate-pulse" />
            <div className="h-3.5 w-56 rounded-md bg-white/[0.06] animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-white/[0.06] animate-pulse" />
            <div className="h-10 w-24 rounded-full bg-white/[0.06] animate-pulse" />
            <div className="h-10 w-10 rounded-full bg-white/[0.06] animate-pulse" />
          </div>
        </div>
      </div>

      <div className="px-4 md:px-5">
        <div className="rounded-2xl bg-surface overflow-hidden divide-y divide-white/[0.07]">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
            <div key={index} className="flex items-center gap-4 px-4 py-3.5">
              <div className="h-4 w-4 shrink-0 rounded bg-white/[0.08] animate-pulse" />
              <div className="flex-1 min-w-0 space-y-2">
                <div className="h-4 w-2/3 max-w-md rounded-md bg-white/[0.1] animate-pulse" />
                <div className="h-3 w-1/3 max-w-xs rounded-md bg-white/[0.06] animate-pulse" />
              </div>
              <div className="hidden md:block h-6 w-24 rounded-full bg-white/[0.06] animate-pulse" />
              <div className="hidden md:block h-3.5 w-28 rounded-md bg-white/[0.06] animate-pulse" />
              <div className="hidden md:block h-8 w-32 rounded-full bg-white/[0.06] animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
