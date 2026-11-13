import Image from 'next/image';
import { getInitials } from '@/lib/format';

// How a speaker appears next to their talks on our public pages, drawn from their profile.
// Shared by the dashboard and the profile editor, where it updates as they type. No hooks
// and no server imports, so it renders on either side.

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
}

const LINK_LABELS: { key: 'linkedinUrl' | 'githubUrl' | 'websiteUrl'; label: string }[] = [
  { key: 'linkedinUrl', label: 'LinkedIn' },
  { key: 'githubUrl', label: 'GitHub' },
  { key: 'websiteUrl', label: 'Website' },
];

export default function SpeakerCard({ profile, showFullBio = false, isPhotoLoading = false }: SpeakerCardProps) {
  const links = LINK_LABELS.filter((link) => profile[link.key]);
  return (
    <article aria-label={`Your public speaker card, as ${profile.name}`} className="rounded-3xl bg-white/[0.05] p-3">
      <div className="relative aspect-square w-full overflow-hidden rounded-[1.25rem] bg-white/[0.06]">
        {isPhotoLoading ? (
          <div aria-label="Uploading your photo" className="absolute inset-0 animate-pulse bg-white/10" />
        ) : profile.photoUrl ? (
          <Image src={profile.photoUrl} alt={`Photo of ${profile.name}`} fill sizes="(min-width: 1024px) 320px, 100vw" className="object-cover" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <span aria-hidden="true" className="text-6xl font-bold text-white/25">{getInitials(profile.name)}</span>
            <span className="text-sm text-white/60">No photo yet</span>
          </div>
        )}
      </div>
      <div className="px-3 pt-5 pb-4">
        <h2 className="text-2xl font-bold leading-tight text-off-white">{profile.name}</h2>
        {profile.tagline ? (
          <p className="mt-1.5 text-white/70 leading-snug">{profile.tagline}</p>
        ) : (
          <p className="mt-1.5 text-white/50 leading-snug">No tagline yet</p>
        )}
        {profile.bio && (
          <p className={`mt-4 text-sm text-white/65 leading-relaxed whitespace-pre-line ${showFullBio ? '' : 'line-clamp-4'}`}>{profile.bio}</p>
        )}
        {links.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2" aria-label="Your links">
            {links.map((link) => (
              <li key={link.key}>
                <a
                  href={profile[link.key]}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Your ${link.label} link, opens in a new tab`}
                  className="inline-flex px-3 py-1 rounded-full border border-white/20 text-xs font-bold text-white/80 hover:border-white/60"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}
