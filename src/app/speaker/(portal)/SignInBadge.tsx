import BadgeLanyard from './BadgeLanyard';

// The sign-in pages' frame: a blank speaker badge on the GDG lanyard, holding the form. Signing
// in turns it into your own badge on the dashboard, which is where the swing plays. This one
// arrives quietly and never tilts, since people are about to type into it.
export default function SignInBadge({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-md">
      <BadgeLanyard entrance="arrive" canTilt={false} isLevel strapClassName="h-10 sm:h-16">
        <div className="relative overflow-hidden rounded-[28px] bg-surface px-6 pt-11 pb-8 sm:px-9 shadow-[0_24px_48px_-20px_rgba(0,0,0,0.7)] ring-1 ring-white/[0.06]">
          <span aria-hidden="true" className="absolute left-1/2 top-4 h-2 w-7 -translate-x-1/2 rounded-full bg-black-02 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]" />
          {children}
        </div>
      </BadgeLanyard>
    </div>
  );
}
