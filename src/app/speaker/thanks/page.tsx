import type { Metadata } from 'next';
import Image from 'next/image';
import { EMPTY_SPEAKER_GIFT_FIELDS, type SpeakerGiftFormFields } from '@/lib/speakerGiftLabels';
import {
  fetchSpeakerGift,
  fetchSpeakerPhotosUrl,
  loadThanksRecipient,
  verifyThanksToken,
  type ThanksRecipient,
} from '@/lib/speakerThanks';
import type { SpeakerGift } from '@/lib/types';
import SpeakerGiftForm from './SpeakerGiftForm';

// Reached only from the link in a speaker's thank-you email, and shows what they have
// already saved, so there is nothing to prerender.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Thank you',
  // A personal link that can show a home address: it has no business in search results.
  robots: { index: false, follow: false },
};

interface ThanksPageProps {
  searchParams: Promise<{ token?: string }>;
}

interface ThanksPageData {
  recipient: ThanksRecipient;
  savedGift: SpeakerGift | null;
  photosUrl: string | null;
}

async function loadPage(token: string): Promise<ThanksPageData | null> {
  const speakerId = verifyThanksToken(token);
  if (!speakerId) return null;
  const recipient = await loadThanksRecipient(speakerId);
  if (!recipient) return null;
  const [savedGift, photosUrl] = await Promise.all([fetchSpeakerGift(speakerId), fetchSpeakerPhotosUrl()]);
  return { recipient, savedGift, photosUrl };
}

function formFieldsFrom(gift: SpeakerGift | null): SpeakerGiftFormFields {
  if (!gift) return EMPTY_SPEAKER_GIFT_FIELDS;
  // Only the form's own fields go to the browser, not the bookkeeping beside them.
  const fields: Record<string, unknown> = {};
  for (const key of Object.keys(EMPTY_SPEAKER_GIFT_FIELDS) as (keyof SpeakerGiftFormFields)[]) {
    fields[key] = gift[key];
  }
  // A half they opted out of was saved blank; open it with the default country if they
  // tick it now.
  return { ...(fields as unknown as SpeakerGiftFormFields), country: gift.country || EMPTY_SPEAKER_GIFT_FIELDS.country };
}

export default async function SpeakerThanksPage({ searchParams }: ThanksPageProps) {
  const { token } = await searchParams;

  // A missing secret or a failed read lands on the same message as a bad link: from the
  // speaker's side, both mean "this didn't work".
  let page: ThanksPageData | null = null;
  if (token) {
    try {
      page = await loadPage(token);
    } catch {
      page = null;
    }
  }

  const firstName = page ? page.recipient.name.trim().split(/\s+/)[0] : '';

  return (
    // No navbar and no footer, like /speaker/confirm: one personal task on its own.
    <main className="bg-[#010103] text-white min-h-screen flex items-center justify-center px-4 sm:px-6 py-16">
      <div className="w-full max-w-xl bg-white/[0.04] border border-white/10 rounded-3xl px-6 py-12 sm:px-12">
        <Image
          src="/logo-wordmark.png"
          alt="DevFest Sydney"
          width={1331}
          height={240}
          priority
          className="h-8 w-auto object-contain mx-auto mb-10"
        />

        {!page ? (
          <div className="text-center">
            <h1 className="text-[clamp(1.75rem,5vw,2.5rem)] font-bold leading-tight tracking-tight mb-5">
              This link isn&rsquo;t working
            </h1>
            <p className="text-white/70 leading-relaxed">
              We couldn&rsquo;t match this link to a speaker. It may have been copied incompletely.
              Reply to your thank-you email or write to{' '}
              <a href="mailto:hello@gdgsydney.com" className="text-google-blue hover:underline">
                hello@gdgsydney.com
              </a>{' '}
              and we&rsquo;ll sort it out.
            </p>
          </div>
        ) : (
          <>
            <div className="text-center mb-10">
              <h1 className="text-[clamp(1.75rem,5vw,2.5rem)] font-bold leading-tight tracking-tight mb-4">
                Thank you, {firstName}
              </h1>
              <p className="text-white/70 leading-relaxed">
                Thanks for speaking at DevFest Sydney 2026. Tell us where to send your speaker mug,
                and whether you&rsquo;d like the Asana Enterprise trial.
              </p>
              {page.photosUrl && (
                <a
                  href={page.photosUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="See the photos from DevFest Sydney 2026 on Google Drive, opens in a new tab"
                  className="inline-flex mt-6 items-center px-6 py-2 text-white text-sm font-bold rounded border border-white/40 transition-colors hover:border-white"
                >
                  See the photos from the day
                </a>
              )}
            </div>

            <SpeakerGiftForm
              token={token!}
              initialFields={formFieldsFrom(page.savedGift)}
              savedAt={page.savedGift?.submittedAt ?? null}
            />
          </>
        )}
      </div>
    </main>
  );
}
