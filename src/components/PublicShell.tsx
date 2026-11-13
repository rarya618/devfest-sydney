import Image from 'next/image';
import Link from 'next/link';

// The frame for the app's public pages outside the speaker portal and the admin: the landing
// page, /privacy and the 404. Same look as the portal and gdgsydney.com (Black 02 page, GDG
// Sydney logo); the logo links home to the sign-in choice.

// Same logo file the emails and the speaker portal use, served by gdgsydney.com.
const GDG_LOGO_URL = 'https://gdgsydney.com/gdg-logo-dark.png';

export default function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-black-02 text-off-white min-h-screen font-sans flex flex-col">
      <header className="max-w-5xl w-full mx-auto px-4 sm:px-6 h-20 flex items-center">
        <Link href="/" aria-label="GDG Sydney, sign in" className="rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-google-blue">
          <Image src={GDG_LOGO_URL} alt="" width={1700} height={215} priority className="h-6 sm:h-8 w-auto" />
        </Link>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 pt-10 pb-16 sm:pt-20 sm:pb-24 animate-page-in">{children}</main>

      <footer className="max-w-5xl w-full mx-auto px-4 sm:px-6 pb-10 text-sm text-white/60 flex flex-wrap gap-x-6 gap-y-2">
        <a href="https://gdgsydney.com" aria-label="Our events, on gdgsydney.com" className="hover:text-off-white underline-offset-4 hover:underline">
          Looking for our events? gdgsydney.com
        </a>
        <Link href="/privacy" aria-label="Privacy policy" className="hover:text-off-white underline-offset-4 hover:underline">Privacy</Link>
        <a href="mailto:hello@gdgsydney.com" aria-label="Email hello@gdgsydney.com" className="hover:text-off-white underline-offset-4 hover:underline">hello@gdgsydney.com</a>
      </footer>
    </div>
  );
}
