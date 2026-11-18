import { portalMainClass } from './PortalShell';

// Loading placeholders shaped like the page they stand in for, so the layout doesn't jump when
// the content arrives. The header stays on screen above them (it is in layout.tsx).

function Bar({ className }: { className: string }) {
  return <div className={`rounded-lg bg-white/[0.08] ${className}`} />;
}

// The badge on its lanyard, at rest, so the swing-in lands where the placeholder stood.
function BadgeSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-[320px] flex-col items-center">
      <div className="h-10 sm:h-20 w-4 bg-white/[0.08]" />
      <div className="relative z-10 -mt-0.5 h-5 w-10 rounded-lg bg-white/[0.1]" />
      <div className="-mt-[26px] w-full origin-top -rotate-[1.2deg] rounded-[28px] bg-white/[0.05] px-5 pt-10 pb-6">
        <div className="mx-auto aspect-square w-[52%] rounded-[22px] bg-white/[0.07]" />
        <Bar className="h-6 w-2/3 mt-5 mx-auto" />
        <Bar className="h-4 w-1/2 mt-3 mx-auto" />
        <div className="-mx-5 mt-5 h-9 bg-white/[0.07]" />
        <Bar className="hidden sm:block h-4 w-full mt-5" />
        <Bar className="hidden sm:block h-4 w-4/5 mt-2" />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading your agenda" className={`${portalMainClass('wide')} animate-pulse`}>
      <div className="grid gap-8 sm:gap-12 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] lg:gap-20">
        <BadgeSkeleton />
        <div>
          <Bar className="h-9 w-48" />
          <div className="mt-10 space-y-14">
            {[0, 1].map((index) => (
              <div key={index}>
                <Bar className="h-5 w-32" />
                {[0, 1].map((row) => (
                  <div key={row} className="mt-4 grid grid-cols-[5.75rem_minmax(0,1fr)] sm:grid-cols-[7.5rem_minmax(0,1fr)] gap-x-4 border-t border-white/10 pt-5">
                    <Bar className="h-8 w-16" />
                    <div className="space-y-2"><Bar className="h-5 w-3/4" /><Bar className="h-4 w-1/3" /></div>
                  </div>
                ))}
              </div>
            ))}
          </div>
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
