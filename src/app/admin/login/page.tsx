import { SITE_OG_IMAGE } from '@/lib/metadata';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { adminAuth } from '@/lib/firebase-admin';
import PublicShell from '@/components/PublicShell';
import LoginForm from './LoginForm';

export const metadata = {
  title: { absolute: 'Organiser sign-in — GDG Sydney' },
  openGraph: { title: 'Organiser sign-in — GDG Sydney', images: [SITE_OG_IMAGE] },
  twitter: { card: 'summary_large_image', title: 'Organiser sign-in — GDG Sydney', images: [SITE_OG_IMAGE] },
};

export default async function AdminLoginPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('__session')?.value;

  if (sessionCookie) {
    try {
      await adminAuth.verifySessionCookie(sessionCookie);
      redirect('/admin');
    } catch {
      // Cookie is invalid or expired — fall through to the login form
    }
  }

  return (
    <PublicShell>
      <div className="max-w-md">
        <h1 className="text-[clamp(2.25rem,6vw,3.5rem)] font-bold leading-[1.02] tracking-[-0.02em]">Organiser sign-in.</h1>
        <p className="mt-5 mb-10 text-white/70 leading-relaxed">
          Sign in with the Google account an admin has added. Not an organiser?{' '}
          <Link href="/speaker" aria-label="Go to speaker sign-in" className="text-google-blue-light underline hover:no-underline">
            Speakers sign in here
          </Link>
          .
        </p>
        <LoginForm />
      </div>
    </PublicShell>
  );
}
