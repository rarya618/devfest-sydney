// The night before the event. Held here rather than in src/lib/speakerConfirm.ts because
// this component renders inside a client component, and that module pulls in node:crypto.
const SPEAKER_DINNER_DATE_LABEL = 'Friday 9 October';

interface SpeakerNextStepsProps {
  // The Humanitix link carrying the speaker access code, or null when
  // SPEAKER_TICKET_URL isn't configured. Only ever handed over for a confirmed
  // speaker, since the code unlocks a complimentary ticket.
  ticketUrl: string | null;
}

// Everything a speaker needs once they have said yes: their ticket, and the dinner the
// night before. Shared by the freshly confirmed state and the "already confirmed" one, so
// a speaker returning to the link later still finds both.
export default function SpeakerNextSteps({ ticketUrl }: SpeakerNextStepsProps) {
  return (
    <div className="mt-8 space-y-6 text-left">
      {ticketUrl ? (
        <div className="text-center">
          <a
            href={ticketUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Get your complimentary speaker ticket on Humanitix, opens in a new tab"
            className="inline-flex items-center justify-center gap-2.5 px-7 py-2 bg-google-blue-deep text-white text-base font-bold rounded
              border border-google-blue-deep transition-opacity hover:opacity-80"
          >
            Get your speaker ticket
          </a>
          <p className="mt-3 text-sm text-white/55 leading-relaxed">
            Your ticket is complimentary. Please keep this link to yourself, as it unlocks a
            speaker ticket.
          </p>
        </div>
      ) : (
        <p className="text-center text-white/70 leading-relaxed">
          We&rsquo;ll email your complimentary speaker ticket shortly.
        </p>
      )}

      <div className="p-6 bg-black/20 border border-white/10 rounded-2xl">
        <p className="text-xs font-mono text-google-yellow mb-2">
          Speaker dinner &middot; {SPEAKER_DINNER_DATE_LABEL}
        </p>
        <p className="text-white/70 leading-relaxed">
          The evening before DevFest we&rsquo;re hosting a dinner for our speakers, so you can meet
          the rest of the lineup and the organising team before the day itself. We&rsquo;ll email
          the venue, the time and an RSVP closer to the date.
        </p>
      </div>
    </div>
  );
}
