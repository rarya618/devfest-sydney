import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { buildPageMetadata } from '@/lib/metadata';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Reveal from '@/components/Reveal';
import VolunteerLink from '@/components/VolunteerLink';
import { areTicketsOpen } from '@/lib/tickets';
import { isCfsOpen } from '@/lib/cfs';
import { isVolunteerOpen } from '@/lib/volunteer';
import { fetchPublicCrew } from '@/lib/volunteers';
import { getInitials } from '@/lib/format';
import { VOLUNTEER_AREA_LABELS } from '@/lib/volunteerLabels';
import { LinkedInIcon } from '@/components/SocialIcons';
import type { PublicCrewMember } from '@/lib/types';

// The crew list changes as volunteers confirm, and the navbar ticket CTA follows the
// on-sale date, so this page is rendered per request rather than prerendered.
export const dynamic = 'force-dynamic';

const title = 'Crew';
const description =
  'The volunteers running DevFest Sydney 2026. The people on registration, AV, speaker support and the Builder’s Space on Saturday 10 October at Torrens University, Surry Hills.';

export const metadata: Metadata = buildPageMetadata({ title, description, path: '/crew' });

function CrewCard({ member, delay }: { member: PublicCrewMember; delay: number }) {
  return (
    <Reveal delay={delay} className="card-hover-lift bg-surface rounded-2xl p-6 flex flex-col items-center text-center">
      <div className="w-20 h-20 rounded-full overflow-hidden bg-white/5 mb-4">
        {member.photoUrl ? (
          <Image src={member.photoUrl} alt={member.name} width={80} height={80} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/50 text-xl font-bold" aria-hidden="true">
            {getInitials(member.name)}
          </div>
        )}
      </div>
      <h2 className="text-base font-bold text-white leading-snug">{member.name}</h2>
      {member.isOrganiser ? (
        <>
          {member.organiserRole && <p className="mt-1 font-mono text-xs text-google-blue">{member.organiserRole}</p>}
          {member.linkedinUrl && (
            <a
              href={member.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${member.name} on LinkedIn`}
              className="mt-3 text-white/55 hover:text-white transition-colors"
            >
              <LinkedInIcon />
            </a>
          )}
        </>
      ) : (
        member.assignedArea && (
          <p className="mt-1 font-mono text-xs text-google-green">{VOLUNTEER_AREA_LABELS[member.assignedArea]}</p>
        )
      )}
    </Reveal>
  );
}

// One grid under its own heading. Organisers and volunteers are kept apart rather than
// mixed alphabetically: the organisers have been at this all year, the volunteers run
// the day, and the two are different things to have said yes to.
function CrewGroup({ heading, members }: { heading: string; members: PublicCrewMember[] }) {
  return (
    <section className="pb-16 px-4 sm:px-6 lg:px-12" aria-label={heading}>
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold tracking-tight mb-8 text-center">{heading}</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 items-start">
          {members.map((member, index) => (
            <CrewCard key={member.id} member={member} delay={Math.min(index, 7) * 0.06} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default async function CrewPage() {
  const cfsOpen = isCfsOpen();
  const cfsCloseDate = process.env.CFS_CLOSE_DATE;
  const ticketsOnSale = areTicketsOpen();
  const volunteerOpen = isVolunteerOpen();
  const { organisers, volunteers } = await fetchPublicCrew();
  const crewCount = organisers.length + volunteers.length;

  return (
    <div className="bg-[#010103] text-white min-h-screen">
      <Navbar accent="green" isCfsOpen={cfsOpen} cfsCloseDate={cfsCloseDate} areTicketsOpen={ticketsOnSale} />

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
            className="text-[clamp(2.5rem,10vw,4rem)] md:text-[clamp(2.25rem,5.5vw,4rem)] font-bold leading-[0.95] tracking-tight text-white mb-6 animate-slide-up"
            style={{ animationDelay: '0.1s' }}
          >
            The crew
          </h1>

          <p
            className="text-white/70 text-lg max-w-2xl mx-auto leading-relaxed animate-slide-up"
            style={{ animationDelay: '0.2s' }}
          >
            {crewCount > 0
              ? 'DevFest Sydney is run by volunteers. These are the people on registration, on AV, looking after speakers, and keeping the day moving.'
              : 'DevFest Sydney is run by volunteers: on registration, on AV, looking after speakers, and keeping the day moving. The crew is being confirmed, and we’ll introduce them here soon.'}
          </p>
        </div>
      </section>

      {organisers.length > 0 && <CrewGroup heading="Organisers" members={organisers} />}
      {volunteers.length > 0 && <CrewGroup heading="Volunteers" members={volunteers} />}

      <section className="pb-24 px-4 sm:px-6 lg:px-12">
        <div className="max-w-2xl mx-auto text-center">
          <Reveal className="bg-surface rounded-2xl p-10">
            <h2 className="text-2xl font-bold tracking-tight mb-3">Want to join them?</h2>
            <p className="text-white/65 leading-relaxed mb-8">
              {volunteerOpen
                ? 'Volunteering is the best seat in the house: you meet everyone, you see how the day is put together, and you get in free.'
                : 'Volunteer signups are closed for this year, but the tracks will tell you what the day covers, and we’d love to see you there.'}
            </p>
            {volunteerOpen ? (
              <VolunteerLink
                source="crew-page"
                className="inline-flex items-center px-7 py-2 bg-google-green-deep text-white text-base font-bold rounded border border-google-green-deep transition-opacity hover:opacity-80"
              >
                Volunteer with us
              </VolunteerLink>
            ) : (
              <Link
                href="/#tracks"
                className="inline-flex items-center px-7 py-2 bg-transparent text-white text-base font-bold rounded border border-white/40 transition-colors hover:border-white"
              >
                See the tracks
              </Link>
            )}
          </Reveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}
