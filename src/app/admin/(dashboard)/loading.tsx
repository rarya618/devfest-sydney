// Shown inside the shell while a dashboard page fetches its data. Mirrors the shape the
// dashboards share: a sticky title row, a strip of stat tiles, then a stack of cards.
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

      <div className="px-4 md:px-5 space-y-3">
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <div key={index} className="bg-surface border-l-4 border-white/10 rounded-lg p-4 sm:p-5">
            <div className="flex items-start gap-4">
              <div className="h-4 w-4 rounded bg-white/[0.08] animate-pulse mt-0.5" />
              <div className="flex-1 min-w-0 space-y-3">
                <div className="h-5 w-2/3 max-w-md rounded-md bg-white/[0.1] animate-pulse" />
                <div className="h-3.5 w-1/3 max-w-xs rounded-md bg-white/[0.06] animate-pulse" />
                <div className="flex gap-2 pt-1">
                  <div className="h-6 w-20 rounded-full bg-white/[0.06] animate-pulse" />
                  <div className="h-6 w-16 rounded-full bg-white/[0.06] animate-pulse" />
                  <div className="h-6 w-24 rounded-full bg-white/[0.06] animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
