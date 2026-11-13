import { portalMainClass } from './PortalShell';

// Loading placeholders shaped like the page they stand in for, so the layout doesn't jump when
// the content arrives. The header stays on screen above them (it is in layout.tsx).

function Bar({ className }: { className: string }) {
  return <div className={`rounded-lg bg-white/[0.08] ${className}`} />;
}

function CardSkeleton() {
  return (
    <div className="rounded-3xl bg-white/[0.05] p-3">
      <div className="aspect-square rounded-[1.25rem] bg-white/[0.07]" />
      <Bar className="h-6 w-2/3 mt-5 mx-3" />
      <Bar className="h-4 w-1/2 mt-3 mx-3 mb-4" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading your talks" className={`${portalMainClass('wide')} animate-pulse`}>
      <div className="flex items-end justify-between gap-6 mb-12">
        <Bar className="h-12 sm:h-14 w-64 max-w-[60%]" />
        <div className="h-11 w-40 rounded-full bg-white/[0.08]" />
      </div>
      <div className="grid gap-12 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-16">
        <CardSkeleton />
        <div className="space-y-14">
          {[0, 1].map((index) => (
            <div key={index}>
              <Bar className="h-6 w-36" />
              <div className="mt-4 border-t border-white/10 py-5 space-y-2">
                <Bar className="h-5 w-3/4" />
                <Bar className="h-4 w-1/3" />
              </div>
              <div className="border-t border-white/10 py-5 space-y-2">
                <Bar className="h-5 w-2/3" />
                <Bar className="h-4 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// For the single-column pages: proposing, saved talks, signing in.
export function FormSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading" className={`${portalMainClass('narrow')} animate-pulse`}>
      <Bar className="h-4 w-24" />
      <Bar className="h-12 sm:h-14 w-80 max-w-full mt-6" />
      <Bar className="h-4 w-full mt-5" />
      <Bar className="h-4 w-2/3 mt-2 mb-12" />
      <div className="space-y-7">
        <div><Bar className="h-4 w-28 mb-2" /><Bar className="h-11 w-full" /></div>
        <div><Bar className="h-4 w-20 mb-2" /><Bar className="h-40 w-full" /></div>
        <div><Bar className="h-4 w-24 mb-2" /><Bar className="h-11 w-full" /></div>
      </div>
    </div>
  );
}
