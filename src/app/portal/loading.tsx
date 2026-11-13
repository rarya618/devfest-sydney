// Skeleton for every portal page while its Firestore reads finish.
export default function PortalLoading() {
  return (
    <div aria-busy="true" aria-label="Loading" className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14 animate-pulse">
      <div className="h-9 w-2/3 rounded bg-white/10 mb-4" />
      <div className="h-5 w-1/2 rounded bg-white/[0.07] mb-12" />
      {[0, 1, 2].map((index) => (
        <div key={index} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 mb-5">
          <div className="h-5 w-1/3 rounded bg-white/10 mb-4" />
          <div className="h-4 w-full rounded bg-white/[0.07] mb-2" />
          <div className="h-4 w-4/5 rounded bg-white/[0.07]" />
        </div>
      ))}
    </div>
  );
}
