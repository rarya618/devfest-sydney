import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const LOGO_HEIGHT = 92;
const LOGO_WIDTH = 164; // logo.png is 975x548, preserve its aspect ratio

export default async function Image() {
  const [bold, regular, logoBuffer] = await Promise.all([
    readFile(join(process.cwd(), 'src/fonts/GoogleSans-Bold.ttf')),
    readFile(join(process.cwd(), 'src/fonts/GoogleSans-Regular.ttf')),
    readFile(join(process.cwd(), 'public/logo.png')),
  ]);
  const logoSrc = `data:image/png;base64,${logoBuffer.toString('base64')}`;

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
        <img
          src={logoSrc}
          width={LOGO_WIDTH}
          height={LOGO_HEIGHT}
          style={{ marginBottom: 28 }}
        />
        <div
          style={{
            display: 'flex',
            fontSize: 72,
            fontWeight: 700,
            color: '#1e1e1e',
            lineHeight: 1.1,
            marginBottom: 24,
          }}
        >
          The Builder<span style={{ color: '#f9ab00', marginLeft: 16 }}>Showcase</span>
        </div>
        <div style={{ display: 'flex', fontSize: 30, color: 'rgba(30,30,30,0.55)', maxWidth: 820 }}>
          Five minutes on stage to demo what you built. The room votes on the winner.
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
