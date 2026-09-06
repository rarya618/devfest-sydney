import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Reveal from '@/components/Reveal';
import { areTicketsOpen } from '@/lib/tickets';
import { isCfsOpen } from '@/lib/cfs';
import { fetchPublicSpeakers } from '@/lib/speakers';
import { getInitials } from '@/lib/format';
import { FORMAT_LABELS, TRACK_LABELS, TRACK_DOT_COLORS } from '@/lib/submissionLabels';
import type { PublicSpeaker, Track } from '@/lib/types';

// The lineup changes as speakers confirm, and the navbar ticket CTA follows the on-sale
// date, so this page is rendered per request rather than prerendered: see `src/app/page.tsx`.
export const dynamic = 'force-dynamic';

const title = 'Speakers';
const description =
  'Meet the speakers of DevFest Sydney 2026. Talks and workshops across the Developer and Builder tracks, Saturday 10 October at Torrens University, Surry Hills.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/speakers' },
  openGraph: {
    title: `${title} — DevFest Sydney 2026`,
    description,
    url: '/speakers',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${title} — DevFest Sydney 2026`,
    description,
  },
};

// Display order for the track groups. Showcase is not a speaking track, so any speaker
// filed under it is listed last.
const TRACK_ORDER: Track[] = ['developer', 'builder', 'workshop', 'showcase'];

const TRACK_DESCRIPTIONS: Record<Track, string> = {
  developer: 'Technical sessions for professional engineers.',
  builder: 'For product managers, designers, founders, and anyone building with AI.',
  workshop: 'Hands-on sessions where you build alongside the speaker.',
  showcase: 'Five-minute demos from the community.',
};

function groupByTrack(speakers: PublicSpeaker[]): { track: Track; speakers: PublicSpeaker[] }[] {
  return TRACK_ORDER.map((track) => ({
    track,
    speakers: speakers.filter((speaker) => speaker.track === track),
  })).filter((group) => group.speakers.length > 0);
}

function LinkedInIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2.17c-3.2.7-3.87-1.37-3.87-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 015.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.83 1.19 3.09 0 4.42-2.7 5.39-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.51 11.51 0 0023.5 12C23.5 5.65 18.35.5 12 .5z" />
    </svg>
  );
}

function WebsiteIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" d="M3 12h18M12 3c2.5 2.7 3.75 5.7 3.75 9S14.5 18.3 12 21c-2.5-2.7-3.75-5.7-3.75-9S9.5 5.7 12 3z" />
    </svg>
  );
}

function SpeakerCard({ speaker, delay }: { speaker: PublicSpeaker; delay: number }) {
  const hasLinks = Boolean(speaker.linkedinUrl || speaker.githubUrl || speaker.websiteUrl);

  return (
    <Reveal delay={delay} className="card-hover-lift bg-white/[0.045] rounded-2xl p-6 md:p-7 flex flex-col">
      <div className="flex items-start gap-4 mb-5">
        <div className="w-16 h-16 rounded-full overflow-hidden bg-white/5 shrink-0">
          {speaker.photoUrl ? (
            <Image src={speaker.photoUrl} alt={speaker.name} width={64} height={64} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/50 text-lg font-bold" aria-hidden="true">
              {getInitials(speaker.name)}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-bold text-white leading-snug">{speaker.name}</h3>
          {speaker.tagline && <p className="mt-0.5 text-sm text-white/60 leading-snug">{speaker.tagline}</p>}
          {hasLinks && (
            <div className="mt-2 flex items-center gap-3">
              {speaker.linkedinUrl && (
                <a
                  href={speaker.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${speaker.name} on LinkedIn`}
                  className="text-white/50 hover:text-white/80 transition-colors"
                >
                  <LinkedInIcon />
                </a>
              )}
              {speaker.githubUrl && (
                <a
                  href={speaker.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${speaker.name} on GitHub`}
                  className="text-white/50 hover:text-white/80 transition-colors"
                >
                  <GitHubIcon />
                </a>
              )}
              {speaker.websiteUrl && (
                <a
                  href={speaker.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${speaker.name}'s website`}
                  className="text-white/50 hover:text-white/80 transition-colors"
                >
                  <WebsiteIcon />
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-white/55 mb-2">{FORMAT_LABELS[speaker.format]}</p>
      <p className="text-base font-bold text-white/90 leading-snug mb-4">{speaker.talkTitle}</p>

      {/* Native disclosure keeps this a server component: the abstract and bio are long
          enough that a wall of them per card would bury the lineup. */}
      <details className="group mt-auto">
        <summary
          aria-label={`Read more about ${speaker.name}'s session`}
          className="cursor-pointer list-none inline-flex items-center gap-1.5 text-sm font-bold text-google-blue hover:underline [&::-webkit-details-marker]:hidden"
        >
          <span className="group-open:hidden">About this session</span>
          <span className="hidden group-open:inline">Show less</span>
          <svg className="w-3 h-3 transition-transform group-open:rotate-180" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 4.5l3.5 3.5 3.5-3.5" />
          </svg>
        </summary>
        <div className="mt-4 space-y-4">
          <p className="text-sm text-white/65 leading-relaxed whitespace-pre-wrap">{speaker.abstract}</p>
          {speaker.bio && (
            <p className="text-sm text-white/65 leading-relaxed whitespace-pre-wrap border-t border-white/10 pt-4">
              <span className="font-bold text-white/85">About {speaker.name.split(' ')[0]}: </span>
              {speaker.bio}
            </p>
          )}
        </div>
      </details>
    </Reveal>
  );
}

export default async function SpeakersPage() {
  const cfsOpen = isCfsOpen();
  const cfsCloseDate = process.env.CFS_CLOSE_DATE;
  const ticketsOnSale = areTicketsOpen();
  const speakers = await fetchPublicSpeakers();
  const groups = groupByTrack(speakers);

  return (
    <div className="bg-[#17181a] text-white min-h-screen">
      <Navbar accent="red" isCfsOpen={cfsOpen} cfsCloseDate={cfsCloseDate} areTicketsOpen={ticketsOnSale} />

      <section className={`relative pb-16 px-4 sm:px-6 lg:px-12 overflow-hidden ${ticketsOnSale ? 'pt-40' : 'pt-36'}`}>
        <div className="absolute inset-0 hero-atmosphere pointer-events-none" aria-hidden="true" />

        <div className="relative max-w-4xl mx-auto text-center">
          <p className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-center gap-1.5 sm:gap-2.5 text-base font-bold text-white/80 animate-fade-in">
            <span className="flex items-center gap-2.5">
              <span>Saturday, 10 October 2026</span>
              <span className="w-1.5 h-1.5 rounded-full bg-white/80 shrink-0" aria-hidden="true" />
            </span>
            <span>Torrens University, Surry Hills</span>
          </p>

          <h1
            className="text-[clamp(3rem,13vw,5rem)] md:text-[clamp(2.5rem,7vw,5rem)] font-bold leading-[0.95] tracking-tight text-white mb-6 animate-slide-up"
            style={{ animationDelay: '0.1s' }}
          >
            Speakers
          </h1>

          <p
            className="text-white/70 text-lg max-w-2xl mx-auto leading-relaxed animate-slide-up"
            style={{ animationDelay: '0.2s' }}
          >
            {speakers.length > 0
              ? 'The people bringing Build, Secure, Scale to life. More are confirmed every week, so check back as the lineup fills out.'
              : 'The lineup is being finalised. Speakers are announced here as they confirm, so check back soon.'}
          </p>
        </div>
      </section>

      {groups.length > 0 ? (
        <div className="pb-24 px-4 sm:px-6 lg:px-12">
          <div className="max-w-6xl mx-auto space-y-20">
            {groups.map((group) => (
              <section key={group.track} id={group.track} aria-labelledby={`${group.track}-heading`}>
                <Reveal className="mb-8">
                  <h2 id={`${group.track}-heading`} className="inline-flex items-center gap-3 text-3xl md:text-4xl font-bold tracking-tight">
                    <span className={`w-2.5 h-2.5 rounded-full ${TRACK_DOT_COLORS[group.track]}`} aria-hidden="true" />
                    {TRACK_LABELS[group.track]} track
                  </h2>
                  <p className="mt-2 text-white/55">{TRACK_DESCRIPTIONS[group.track]}</p>
                </Reveal>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
                  {group.speakers.map((speaker, index) => (
                    <SpeakerCard key={speaker.id} speaker={speaker} delay={Math.min(index, 5) * 0.08} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      ) : (
        <section className="pb-24 px-4 sm:px-6 lg:px-12">
          <div className="max-w-2xl mx-auto text-center">
            <Reveal className="bg-white/[0.045] rounded-2xl p-10">
              <p className="text-white/65 leading-relaxed mb-8">
                In the meantime, have a look at the tracks to see what the day covers.
              </p>
              <Link
                href="/#tracks"
                className="inline-flex items-center px-7 py-2 bg-transparent text-white text-base font-bold rounded border border-white/40 transition-colors hover:border-white"
              >
                See the tracks
              </Link>
            </Reveal>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
