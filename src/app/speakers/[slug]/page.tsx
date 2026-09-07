import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/metadata';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Reveal from '@/components/Reveal';
import TicketsLink from '@/components/TicketsLink';
import { areTicketsOpen } from '@/lib/tickets';
import { isCfsOpen } from '@/lib/cfs';
import { fetchPublicSpeakerBySlug, fetchPublicSpeakers } from '@/lib/speakers';
import { getInitials } from '@/lib/format';
import { buildEventReference } from '@/lib/eventJsonLd';
import { LinkedInIcon, GitHubIcon, WebsiteIcon } from '@/components/SocialIcons';
import { FORMAT_LABELS, TRACK_LABELS, TRACK_DOT_COLORS, TRACK_COLORS } from '@/lib/submissionLabels';
import type { PublicSpeaker } from '@/lib/types';

// A speaker's page exists only while they are confirmed, and the navbar ticket CTA
// follows the on-sale date, so this is rendered per request like the other public pages.
export const dynamic = 'force-dynamic';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://devfest.gdgsydney.com';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const speaker = await fetchPublicSpeakerBySlug(slug);
  if (!speaker) {
    return { title: 'Speaker not found', robots: { index: false } };
  }

  return buildPageMetadata({
    title: speaker.name,
    description: `${speaker.talkTitle}. ${FORMAT_LABELS[speaker.format]} in the ${TRACK_LABELS[speaker.track]} track at DevFest Sydney 2026, Saturday 10 October at Torrens University, Surry Hills.`,
    path: `/speakers/${speaker.slug}`,
    ogType: 'profile',
  });
}

function ProfileLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/[0.06] text-white/70 hover:text-white hover:bg-white/[0.12] transition-colors"
    >
      {children}
    </a>
  );
}

// Person + Event JSON-LD so a shared speaker link carries who they are and where they
// are speaking. The nested Event is the same one `/` describes in full, and that page
// lists this speaker back under `performer`.
function buildJsonLd(speaker: PublicSpeaker) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: speaker.name,
    url: `${siteUrl}/speakers/${speaker.slug}`,
    ...(speaker.tagline ? { jobTitle: speaker.tagline } : {}),
    ...(speaker.bio ? { description: speaker.bio } : {}),
    ...(speaker.photoUrl ? { image: speaker.photoUrl } : {}),
    sameAs: [speaker.linkedinUrl, speaker.githubUrl, speaker.websiteUrl].filter(Boolean),
    performerIn: buildEventReference(),
  };
}

export default async function SpeakerPage({ params }: PageProps) {
  const { slug } = await params;
  const [speaker, allSpeakers] = await Promise.all([fetchPublicSpeakerBySlug(slug), fetchPublicSpeakers()]);
  if (!speaker) notFound();

  const cfsOpen = isCfsOpen();
  const cfsCloseDate = process.env.CFS_CLOSE_DATE;
  const ticketsOnSale = areTicketsOpen();
  const hasLinks = Boolean(speaker.linkedinUrl || speaker.githubUrl || speaker.websiteUrl);
  const otherSpeakers = allSpeakers.filter((other) => other.id !== speaker.id).slice(0, 4);
  const firstName = speaker.name.split(' ')[0];

  return (
    <div className="bg-[#17181a] text-white min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildJsonLd(speaker)) }} />
      <Navbar accent="red" isCfsOpen={cfsOpen} cfsCloseDate={cfsCloseDate} areTicketsOpen={ticketsOnSale} />

      {/* Hero */}
      <section className={`relative pb-16 px-4 sm:px-6 lg:px-12 overflow-hidden ${ticketsOnSale ? 'pt-36' : 'pt-32'}`}>
        <div className="absolute inset-0 hero-atmosphere pointer-events-none" aria-hidden="true" />

        <div className="relative max-w-4xl mx-auto">
          <Link
            href="/speakers"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-white/60 hover:text-white transition-colors mb-10 animate-fade-in"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 8H3M7 4L3 8l4 4" />
            </svg>
            All speakers
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center gap-8">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden bg-white/5 shrink-0 animate-fade-in">
              {speaker.photoUrl ? (
                <Image src={speaker.photoUrl} alt={speaker.name} width={160} height={160} priority className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/50 text-4xl font-bold" aria-hidden="true">
                  {getInitials(speaker.name)}
                </div>
              )}
            </div>

            <div className="min-w-0">
              <p
                className={`inline-flex items-center gap-2 text-xs font-bold mb-3 animate-slide-up ${TRACK_COLORS[speaker.track]}`}
                style={{ animationDelay: '0.05s' }}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${TRACK_DOT_COLORS[speaker.track]}`} aria-hidden="true" />
                {TRACK_LABELS[speaker.track]} track
              </p>
              <h1
                className="text-4xl md:text-6xl font-bold leading-[1.05] tracking-tight text-white mb-3 animate-slide-up"
                style={{ animationDelay: '0.1s' }}
              >
                {speaker.name}
              </h1>
              {speaker.tagline && (
                <p className="text-lg text-white/70 leading-relaxed animate-slide-up" style={{ animationDelay: '0.15s' }}>
                  {speaker.tagline}
                </p>
              )}
              {hasLinks && (
                <div className="mt-5 flex items-center gap-2.5 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                  {speaker.linkedinUrl && (
                    <ProfileLink href={speaker.linkedinUrl} label={`${speaker.name} on LinkedIn`}>
                      <LinkedInIcon className="w-[18px] h-[18px]" />
                    </ProfileLink>
                  )}
                  {speaker.githubUrl && (
                    <ProfileLink href={speaker.githubUrl} label={`${speaker.name} on GitHub`}>
                      <GitHubIcon className="w-[18px] h-[18px]" />
                    </ProfileLink>
                  )}
                  {speaker.websiteUrl && (
                    <ProfileLink href={speaker.websiteUrl} label={`${speaker.name}'s website`}>
                      <WebsiteIcon className="w-[18px] h-[18px]" />
                    </ProfileLink>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Session + bio */}
      <section className="pb-24 px-4 sm:px-6 lg:px-12">
        <div className="max-w-4xl mx-auto grid lg:grid-cols-[1fr_18rem] gap-8 items-start">
          <div className="space-y-8">
            <Reveal>
              <article className="rounded-xl border-l-[8px] border-google-red bg-white/[0.035] p-8 md:p-10">
                <p className="text-xs font-bold text-white/55 mb-3">{FORMAT_LABELS[speaker.format]}</p>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight leading-snug mb-6">{speaker.talkTitle}</h2>
                <p className="text-white/70 leading-relaxed whitespace-pre-wrap">{speaker.abstract}</p>
              </article>
            </Reveal>

            {speaker.bio && (
              <Reveal delay={0.1}>
                <div className="px-2 md:px-4">
                  <h2 className="text-xl font-bold tracking-tight mb-4">About {firstName}</h2>
                  <p className="text-white/65 leading-relaxed whitespace-pre-wrap">{speaker.bio}</p>
                </div>
              </Reveal>
            )}
          </div>

          <Reveal delay={0.15} className="lg:sticky lg:top-28">
            <aside className="rounded-2xl bg-white/[0.045] p-6 space-y-5">
              <div>
                <p className="text-xs font-bold text-white/55 mb-2">Catch this session</p>
                <p className="font-bold text-white">Saturday, 10 October 2026</p>
                <p className="text-sm text-white/60 mt-0.5">Torrens University, Surry Hills</p>
                <p className="text-sm text-white/55 mt-3 leading-relaxed">
                  Session times are announced with the schedule. One ticket covers every track.
                </p>
              </div>
              {ticketsOnSale ? (
                <TicketsLink
                  source={`speaker-${speaker.slug}`}
                  aria-label="Get tickets for DevFest Sydney 2026 on Humanitix"
                  className="inline-flex w-full items-center justify-center gap-2.5 px-6 py-2 bg-google-blue-deep text-white text-base font-bold rounded border border-google-blue-deep transition-opacity hover:opacity-80"
                >
                  Get tickets
                </TicketsLink>
              ) : (
                <Link
                  href="/tickets"
                  className="inline-flex w-full items-center justify-center px-6 py-2 bg-transparent text-white text-base font-bold rounded border border-white/40 transition-colors hover:border-white"
                >
                  Ticket info
                </Link>
              )}
            </aside>
          </Reveal>
        </div>
      </section>

      {otherSpeakers.length > 0 && (
        <section className="pb-24 px-4 sm:px-6 lg:px-12 border-t border-white/8 pt-16">
          <div className="max-w-4xl mx-auto">
            <Reveal className="flex items-end justify-between gap-6 mb-8">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">More speakers</h2>
              <Link href="/speakers" className="text-sm font-bold text-white/60 hover:text-white transition-colors whitespace-nowrap">
                See all
              </Link>
            </Reveal>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-8">
              {otherSpeakers.map((other, index) => (
                <Reveal key={other.id} delay={index * 0.06} className="text-center">
                  <Link href={`/speakers/${other.slug}`} aria-label={`${other.name}: ${other.talkTitle}`} className="group block">
                    <div className="w-20 h-20 rounded-full mx-auto mb-3 overflow-hidden bg-white/5 ring-2 ring-transparent group-hover:ring-white/30 transition-shadow">
                      {other.photoUrl ? (
                        <Image src={other.photoUrl} alt="" width={80} height={80} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/50 text-xl font-bold" aria-hidden="true">
                          {getInitials(other.name)}
                        </div>
                      )}
                    </div>
                    <p className="font-semibold text-white/85 text-sm leading-snug">{other.name}</p>
                    <p className="text-xs text-white/55 mt-1 leading-snug line-clamp-2">{other.talkTitle}</p>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
