export interface VolunteerLinks {
  // The Humanitix link carrying the volunteer access code. Null when VOLUNTEER_TICKET_URL
  // isn't configured, or when an admin has marked this volunteer's ticket as already sent
  // from /admin/crew; ticketAlreadySent tells the two apart.
  ticketUrl: string | null;
  ticketAlreadySent: boolean;
  // The volunteer WhatsApp group invite, or null when VOLUNTEER_WHATSAPP_URL isn't set.
  whatsappUrl: string | null;
}

// Everything a volunteer needs once they have said yes: their ticket, and the group chat
// the crew is run from. Shared by the freshly confirmed state and the "already confirmed"
// one, so a volunteer returning to the link later still finds both.
export default function VolunteerNextSteps({ ticketUrl, ticketAlreadySent, whatsappUrl }: VolunteerLinks) {
  return (
    <div className="mt-8 space-y-6 text-left">
      {ticketAlreadySent ? (
        <p className="text-center text-white/70 leading-relaxed">
          Your volunteer ticket has already been sent to you. If you can&rsquo;t find it, reply to
          your acceptance email and we&rsquo;ll send it again.
        </p>
      ) : ticketUrl ? (
        <div className="text-center">
          <a
            href={ticketUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Get your volunteer ticket on Humanitix, opens in a new tab"
            className="inline-flex items-center justify-center gap-2.5 px-7 py-2 bg-google-green-deep text-white text-base font-bold rounded
              border border-google-green-deep transition-opacity hover:opacity-80"
          >
            Get your volunteer ticket
          </a>
          <p className="mt-3 text-sm text-white/55 leading-relaxed">
            Please keep this link to yourself, as it unlocks a volunteer ticket.
          </p>
        </div>
      ) : (
        <p className="text-center text-white/70 leading-relaxed">
          We&rsquo;ll email your volunteer ticket shortly.
        </p>
      )}

      <div className="p-6 bg-black/20 border border-white/10 rounded-2xl">
        <p className="text-xs font-mono text-google-green mb-2">Volunteer WhatsApp group</p>
        <p className="text-white/70 leading-relaxed">
          This is where we&rsquo;ll share the run sheet, last-minute changes and who&rsquo;s where
          on the day.
          {!whatsappUrl && ' We’ll send you the invite shortly.'}
        </p>
        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Join the DevFest Sydney volunteer WhatsApp group, opens in a new tab"
            className="mt-4 inline-flex items-center px-7 py-2 bg-transparent text-white text-base font-bold rounded border border-white/40 transition-colors hover:border-white"
          >
            Join the WhatsApp group
          </a>
        )}
      </div>
    </div>
  );
}
