import Image from 'next/image';
import { getInitials } from '@/lib/format';
import MarkdownText from '@/components/MarkdownText';

// How a speaker appears next to their talks on our public pages, drawn from their profile.
// Shared by the speaker portal (the dashboard, and the profile editor, where it updates as
// they type) and the admin's preview on All speakers. No hooks and no server imports, so it
// renders on either side.

export interface SpeakerCardProfile {
  name: string;
  tagline: string;
  bio: string;
  photoUrl: string;
  linkedinUrl: string;
  githubUrl: string;
  websiteUrl: string;
}

interface SpeakerCardProps {
  profile: SpeakerCardProfile;
  // Shows the bio in full (the editor) rather than a few lines of it (the dashboard).
  showFullBio?: boolean;
  // Replaces the photo with a pulsing placeholder while a new one uploads.
  isPhotoLoading?: boolean;
  // Who is looking: the speaker at their own card (the portal), or an organiser (the admin).
  // Only the screen-reader wording changes.
  viewer?: 'speaker' | 'organiser';
  // On a phone, the badge only: no bio or links, so the agenda under it reaches the first screen.
  compactOnPhone?: boolean;
}

// The badge shows the start of the bio: its first block, cut to a few lines. line-clamp alone
// can't cut across the paragraphs and lists MarkdownText renders as separate blocks.
const CLAMPED_BIO =
  '[&>*:not(:first-child)]:hidden [&>*:first-child]:line-clamp-3 sm:[&>*:first-child]:line-clamp-4 lg:[&>*:first-child]:line-clamp-2';

const LINK_LABELS: { key: 'linkedinUrl' | 'githubUrl' | 'websiteUrl'; label: string }[] = [
  { key: 'linkedinUrl', label: 'LinkedIn' },
  { key: 'githubUrl', label: 'GitHub' },
  { key: 'websiteUrl', label: 'Website' },
];

export default function SpeakerCard({ profile, showFullBio = false, isPhotoLoading = false, viewer = 'speaker', compactOnPhone = false }: SpeakerCardProps) {
  const links = LINK_LABELS.filter((link) => profile[link.key]);
  const isOwnCard = viewer === 'speaker';
  // A speaker badge, as worn on the day: punched slot, photo, name, tagline and the Speaker
  // band, with the bio and links below. The portal hangs it from a lanyard (BadgeLanyard).
  return (
    <article
      aria-label={isOwnCard ? `Your public speaker card, as ${profile.name}` : `${profile.name}'s public speaker card`}
      className="relative overflow-hidden rounded-[28px] bg-surface px-5 pt-10 pb-6 text-center shadow-[0_24px_48px_-20px_rgba(0,0,0,0.7)] ring-1 ring-white/[0.06]"
    >
      <span aria-hidden="true" className="absolute left-1/2 top-4 h-2 w-7 -translate-x-1/2 rounded-full bg-black-02 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]" />
      <div className="relative mx-auto aspect-square w-[52%] max-w-44 overflow-hidden rounded-[22px] bg-white/[0.06]">
        {isPhotoLoading ? (
          <div aria-label={isOwnCard ? 'Uploading your photo' : 'Uploading the photo'} className="absolute inset-0 animate-pulse bg-white/10" />
        ) : profile.photoUrl ? (
          <Image src={profile.photoUrl} alt={`Photo of ${profile.name}`} fill sizes="176px" className="object-cover" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
            <span aria-hidden="true" className="text-4xl font-bold text-white/30">{getInitials(profile.name)}</span>
            <span className="text-xs text-white/60">No photo yet</span>
          </div>
        )}
      </div>
      {/* Not a heading: the card sits before the page's own h1 wherever it appears. */}
      <p className="mt-5 text-2xl font-bold leading-tight text-balance text-off-white">{profile.name}</p>
      {profile.tagline ? (
        <p className="mt-1.5 text-white/70 leading-snug text-balance">{profile.tagline}</p>
      ) : (
        <p className="mt-1.5 text-white/50 leading-snug">No tagline yet</p>
      )}
      <p className="-mx-5 mt-5 bg-google-blue-deep py-2 text-sm font-bold text-white">Speaker</p>
      {profile.bio && (
        <MarkdownText text={profile.bio} className={`mt-5 text-left text-sm text-white/65 leading-relaxed ${showFullBio ? '' : CLAMPED_BIO} ${compactOnPhone ? 'hidden sm:block' : ''}`} />
      )}
      {links.length > 0 && (
        <ul className={`mt-5 flex-wrap justify-center gap-2 ${compactOnPhone ? 'hidden sm:flex' : 'flex'}`} aria-label={isOwnCard ? 'Your links' : `${profile.name}'s links`}>
          {links.map((link) => (
            <li key={link.key}>
              <a
                href={profile[link.key]}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${isOwnCard ? 'Your' : `${profile.name}'s`} ${link.label} link, opens in a new tab`}
                className="inline-flex px-3 py-1 rounded-full border border-white/35 text-xs font-bold text-white/80 transition-colors hover:border-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-google-blue"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
