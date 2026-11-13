// Skeleton for every portal page while its Firestore reads finish: the dashboard's shape,
// which is the page people land on most.
export default function PortalLoading() {
  return (
    <div aria-busy="true" aria-label="Loading" className="max-w-6xl mx-auto px-4 sm:px-6 pt-26 sm:pt-32 pb-16 animate-pulse">
      <div className="h-12 w-72 max-w-full rounded-lg bg-white/10 mb-12" />
      <div className="grid gap-10 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-16">
        <div className="rounded-3xl bg-white/[0.05] p-3">
          <div className="aspect-square rounded-[1.25rem] bg-white/[0.07]" />
          <div className="h-6 w-2/3 rounded bg-white/10 mt-5 mx-3" />
          <div className="h-4 w-1/2 rounded bg-white/[0.07] mt-3 mx-3 mb-4" />
        </div>
        <div className="space-y-10">
          {[0, 1, 2].map((index) => (
            <div key={index}>
              <div className="h-6 w-40 rounded bg-white/10 mb-5" />
              <div className="h-16 rounded-2xl bg-white/[0.05] mb-3" />
              <div className="h-16 rounded-2xl bg-white/[0.05]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
