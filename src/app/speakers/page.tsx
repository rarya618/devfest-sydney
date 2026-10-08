import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/metadata';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import EventDateVenue from '@/components/EventDateVenue';
import Reveal from '@/components/Reveal';
import { areTicketsOpen } from '@/lib/tickets';
import { isCfsOpen } from '@/lib/cfs';
import { fetchPublicSpeakers } from '@/lib/speakers';
import { getInitials } from '@/lib/format';
import { LinkedInIcon, GitHubIcon, WebsiteIcon } from '@/components/SocialIcons';
import { FORMAT_LABELS, TRACK_LABELS, TRACK_DOT_COLORS } from '@/lib/submissionLabels';
import type { PublicSpeaker, Track } from '@/lib/types';

// The lineup changes as speakers confirm, and the navbar ticket CTA follows the on-sale
// date, so this page is rendered per request rather than prerendered: see `src/app/page.tsx`.
export const dynamic = 'force-dynamic';

const title = 'Speakers';
const description =
  'Meet the speakers of DevFest Sydney 2026. Talks and workshops across the Spotlight, Developer, Builder and Workshops tracks, Saturday 10 October at Torrens University, Surry Hills.';

export const metadata: Metadata = buildPageMetadata({ title, description, path: '/speakers' });

// Display order for the track groups. Showcase is not a speaking track, so any speaker
// filed under it is listed last.
const TRACK_ORDER: Track[] = ['keynote', 'spotlight', 'developer', 'builder', 'workshop', 'showcase'];

const TRACK_DESCRIPTIONS: Record<Track, string> = {
  keynote: 'Keynotes on the main stage in the Auditorium.',
  spotlight: 'Headline sessions on the main stage in the Auditorium.',
  developer: 'Technical sessions for professional engineers.',
  builder: 'For product managers, designers, founders, and anyone building with AI.',
  workshop: 'Hands-on sessions where you build alongside the speaker.',
  showcase: 'Five-minute demos from the community.',
};

// One entry per session: the lead speaker, then anyone presenting it with them. The page
// lists sessions rather than people, so a co-presented talk is one card, not two copies.
function groupIntoSessions(speakers: PublicSpeaker[]): PublicSpeaker[][] {
  const publicIds = new Set(speakers.map((speaker) => speaker.id));
  return speakers
    .filter((speaker) => !speaker.coSpeakerOf || !publicIds.has(speaker.coSpeakerOf))
    .map((lead) => [lead, ...speakers.filter((speaker) => speaker.coSpeakerOf === lead.id)]);
}

function groupByTrack(speakers: PublicSpeaker[]): { track: Track; sessions: PublicSpeaker[][] }[] {
  const sessions = groupIntoSessions(speakers);
  return TRACK_ORDER.map((track) => ({
    track,
    sessions: sessions.filter((presenters) => presenters[0].track === track),
  })).filter((group) => group.sessions.length > 0);
}

function PresenterHeader({ speaker }: { speaker: PublicSpeaker }) {
  const hasLinks = Boolean(speaker.linkedinUrl || speaker.githubUrl || speaker.websiteUrl);

  return (
    <div className="flex items-start gap-4">
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
        <h3 className="text-lg font-bold text-white leading-snug">
          <Link href={`/speakers/${speaker.slug}`} className="hover:text-white/80 transition-colors">
            {speaker.name}
          </Link>
        </h3>
        {speaker.tagline && (
          <p className="mt-0.5 text-sm text-white/60 leading-snug line-clamp-3" title={speaker.tagline}>
            {speaker.tagline}
          </p>
        )}
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
  );
}

// A session card: every presenter at the top, then the talk. The talk fields are the
// lead's, which co-speakers share.
function SessionCard({ presenters, delay }: { presenters: PublicSpeaker[]; delay: number }) {
  const lead = presenters[0];
  const presenterNames = presenters.map((speaker) => speaker.name).join(' and ');
  const isSolo = presenters.length === 1;

  return (
    <Reveal delay={delay} className="card-hover-lift bg-surface rounded-2xl p-6 md:p-7 flex flex-col">
      <div className="space-y-4 mb-5">
        {presenters.map((speaker) => (
          <PresenterHeader key={speaker.id} speaker={speaker} />
        ))}
      </div>

      <p className="text-xs font-bold text-white/55 mb-2">{FORMAT_LABELS[lead.format]}</p>
      <p className="text-base font-bold text-white/90 leading-snug mb-4">
        <Link href={`/speakers/${lead.slug}`} className="hover:text-white/80 transition-colors">
          {lead.talkTitle}
        </Link>
      </p>

      {/* Native disclosure keeps this a server component: the abstract and bio are long
          enough that a wall of them per card would bury the lineup. */}
      <details className="group mt-auto">
        <summary
          aria-label={`Read more about ${presenterNames}'s session`}
          className="cursor-pointer list-none inline-flex items-center gap-1.5 text-sm font-bold text-google-blue hover:underline [&::-webkit-details-marker]:hidden"
        >
          <span className="group-open:hidden">About this session</span>
          <span className="hidden group-open:inline">Show less</span>
          <svg className="w-3 h-3 transition-transform group-open:rotate-180" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 4.5l3.5 3.5 3.5-3.5" />
          </svg>
        </summary>
        <div className="mt-4 space-y-4">
          <p className="text-sm text-white/65 leading-relaxed whitespace-pre-wrap">{lead.abstract}</p>
          {presenters
            .filter((speaker) => speaker.bio)
            .map((speaker) => (
              <p key={speaker.id} className="text-sm text-white/65 leading-relaxed whitespace-pre-wrap border-t border-white/10 pt-4">
                <span className="font-bold text-white/85">About {speaker.name.split(' ')[0]}: </span>
                {speaker.bio}
              </p>
            ))}
          {/* With several presenters, each name above already links to their page. */}
          {isSolo && (
            <Link
              href={`/speakers/${lead.slug}`}
              aria-label={`Open ${lead.name}'s speaker page`}
              className="inline-flex items-center gap-1.5 text-sm font-bold text-white/70 hover:text-white transition-colors"
            >
              Speaker page
              <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8h10M9 4l4 4-4 4" />
              </svg>
            </Link>
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
    <div className="bg-[#010103] text-white min-h-screen">
      <Navbar accent="red" isCfsOpen={cfsOpen} cfsCloseDate={cfsCloseDate} areTicketsOpen={ticketsOnSale} />

      <section className={`relative pb-16 px-4 sm:px-6 lg:px-12 overflow-hidden ${ticketsOnSale ? 'pt-40' : 'pt-36'}`}>
        <div className="absolute inset-0 hero-atmosphere pointer-events-none" aria-hidden="true" />

        <div className="relative max-w-4xl mx-auto text-center">
          <EventDateVenue />

          <h1
            className="text-[clamp(2.5rem,10vw,4rem)] md:text-[clamp(2.25rem,5.5vw,4rem)] font-bold leading-[0.95] tracking-tight text-white mb-6 animate-slide-up"
            style={{ animationDelay: '0.1s' }}
          >
            Speakers
          </h1>

          <p
            className="text-white/70 text-lg max-w-2xl mx-auto leading-relaxed animate-slide-up"
            style={{ animationDelay: '0.2s' }}
          >
            {speakers.length > 0
              ? 'The people bringing DevFest Sydney to life. More are confirmed every week, so check back as the lineup fills out.'
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
                  {group.sessions.map((presenters, index) => (
                    <SessionCard key={presenters[0].id} presenters={presenters} delay={Math.min(index, 5) * 0.08} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      ) : (
        <section className="pb-24 px-4 sm:px-6 lg:px-12">
          <div className="max-w-2xl mx-auto text-center">
            <Reveal className="bg-surface rounded-2xl p-10">
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
