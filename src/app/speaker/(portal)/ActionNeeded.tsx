import type { PortalProposal } from '@/lib/portalData';
import { formatDeadline } from './agendaItems';

function isStillAhead(iso: string | null): iso is string {
  return iso !== null && Date.parse(iso) > Date.now();
}

const confirmButtonClass =
  'press inline-flex self-start sm:self-auto shrink-0 px-5 py-2 rounded-full bg-google-green-deep text-white text-sm font-bold hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-google-blue focus-visible:ring-offset-2 focus-visible:ring-offset-black-02';

// Proposals accepted and waiting for the speaker to say yes: the one thing on the page that
// can run out. On a phone it comes before the badge; on a wide screen the agenda card beside the
// badge already leads with it.
export default function ActionNeeded({ proposals }: { proposals: PortalProposal[] }) {
  const waiting = proposals.filter((proposal) => proposal.confirmUrl);
  if (waiting.length === 0) return null;
  return (
    <section aria-labelledby="action-needed-heading" className="row-in mb-10 lg:hidden rounded-3xl border border-google-green/30 bg-google-green/10 px-5 py-5 sm:px-7 sm:py-6">
      <h2 id="action-needed-heading" className="text-lg font-bold text-off-white">
        {waiting.length === 1 ? 'You’re in. Confirm your spot.' : 'You’re in. Confirm your spots.'}
      </h2>
      <ul className="mt-4 space-y-4">
        {waiting.map((proposal) => (
          <li key={proposal.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="min-w-0">
              <p className="font-bold leading-snug">{proposal.talkTitle}</p>
              <p className="mt-1 text-sm text-white/70">
                {proposal.eventName ?? 'A GDG Sydney meetup'}
                {isStillAhead(proposal.confirmBy) && (
                  <>. Confirm by <span className="text-google-green">{formatDeadline(proposal.confirmBy)}</span></>
                )}
              </p>
            </div>
            <a
              href={proposal.confirmUrl!}
              aria-label={`Confirm you will give ${proposal.talkTitle}`}
              className={confirmButtonClass}
            >
              Confirm your spot
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

