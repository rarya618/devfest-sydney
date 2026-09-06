import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fetchPublicSpeakerBySlug } from '@/lib/speakers';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const LOGO_HEIGHT = 92;
const LOGO_WIDTH = 164; // logo.png is 975x548, preserve its aspect ratio

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [bold, regular, logoBuffer, speaker] = await Promise.all([
    readFile(join(process.cwd(), 'src/fonts/GoogleSans-Bold.ttf')),
    readFile(join(process.cwd(), 'src/fonts/GoogleSans-Regular.ttf')),
    readFile(join(process.cwd(), 'public/logo.png')),
    fetchPublicSpeakerBySlug(slug),
  ]);
  const logoSrc = `data:image/png;base64,${logoBuffer.toString('base64')}`;

  // Unknown slugs get the generic lineup card rather than an error, since a stale share
  // link is the most likely way to land here.
  const headline = speaker ? speaker.name : 'Meet the Speakers';
  const subline = speaker
    ? speaker.talkTitle
    : 'The 2026 lineup. Saturday 10 October, Torrens University, Surry Hills.';
  const headlineSize = headline.length > 22 ? 56 : 72;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px 96px',
          background: '#f0f0f0',
          fontFamily: 'Google Sans',
          textAlign: 'center',
        }}
      >
        <img src={logoSrc} width={LOGO_WIDTH} height={LOGO_HEIGHT} style={{ marginBottom: 28 }} />
        <div style={{ display: 'flex', fontSize: 24, color: '#EA4335', fontWeight: 700, letterSpacing: 4, marginBottom: 16 }}>
          DEVFEST SYDNEY 2026 SPEAKER
        </div>
        <div style={{ display: 'flex', fontSize: headlineSize, fontWeight: 700, color: '#1e1e1e', lineHeight: 1.1, marginBottom: 24 }}>
          {headline}
        </div>
        <div style={{ display: 'flex', fontSize: 30, color: 'rgba(30,30,30,0.55)', maxWidth: 900, lineHeight: 1.3 }}>
          {subline}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Google Sans', data: bold, weight: 700, style: 'normal' },
        { name: 'Google Sans', data: regular, weight: 400, style: 'normal' },
      ],
    }
  );
}
