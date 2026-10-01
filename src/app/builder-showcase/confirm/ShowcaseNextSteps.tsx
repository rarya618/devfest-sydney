interface ShowcaseNextStepsProps {
  // The Humanitix link carrying the showcase access code, or null when
  // SHOWCASE_TICKET_URL isn't configured. Only ever handed over for a confirmed entry,
  // since the code unlocks a complimentary ticket.
  ticketUrl: string | null;
  // Co-presenters need a ticket each, and the acceptance email went to the entrant only,
  // so they are the one who has to pass the link on.
  hasCoPresenters: boolean;
}

// What an entrant needs once they have said yes: their ticket. Shared by the freshly
// confirmed state and the "already confirmed" one, so an entrant returning to the link
// later still finds it.
export default function ShowcaseNextSteps({ ticketUrl, hasCoPresenters }: ShowcaseNextStepsProps) {
  if (!ticketUrl) {
    return (
      <p className="mt-8 text-white/70 leading-relaxed">
        We&rsquo;ll email your complimentary showcase ticket shortly.
      </p>
    );
  }

  return (
    <div className="mt-8">
      <a
        href={ticketUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Get your complimentary Builder Showcase ticket on Humanitix, opens in a new tab"
        className="inline-flex items-center justify-center gap-2.5 px-7 py-2 bg-google-yellow text-black-02 text-base font-bold rounded
          border border-google-yellow transition-opacity hover:opacity-80"
      >
        Get your showcase ticket
      </a>
      <p className="mt-3 text-sm text-white/55 leading-relaxed">
        {hasCoPresenters
          ? 'Your ticket is complimentary. Pass this link on to your co-presenters so each of you can claim one, but please keep it within your team, as it unlocks presenter tickets.'
          : 'Your ticket is complimentary. Please keep this link to yourself, as it unlocks a presenter ticket.'}
      </p>
    </div>
  );
}
