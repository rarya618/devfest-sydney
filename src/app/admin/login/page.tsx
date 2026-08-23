import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { adminAuth } from '@/lib/firebase-admin';
import LoginForm from './LoginForm';

export const metadata = {
  title: 'Admin Login — DevFest Sydney 2026',
  openGraph: { title: 'Admin Login — DevFest Sydney 2026', images: ['/admin/opengraph-image'] },
  twitter: { card: 'summary_large_image', title: 'Admin Login — DevFest Sydney 2026', images: ['/admin/opengraph-image'] },
};

export default async function AdminLoginPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('__session')?.value;

  if (sessionCookie) {
    try {
      await adminAuth.verifySessionCookie(sessionCookie, true);
      redirect('/admin');
    } catch {
      // Cookie is invalid or expired — fall through to the login form
    }
  }

  return (
    <main className="min-h-screen bg-[#202124] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center hover:opacity-80 transition-opacity" aria-label="Back to DevFest Sydney home">
            <Image
              src="/logo-wordmark.png"
              alt="DevFest Sydney"
              width={1331}
              height={240}
              className="h-10 w-auto object-contain"
              priority
            />
          </Link>
          <p className="text-sm text-off-white/40">Admin</p>
        </div>

        <div className="bg-white rounded-2xl p-8 py-10">
          <p className="text-base text-black-02/55 text-center mb-6 leading-relaxed">
            Sign in with an authorised Google account to access the dashboard.
          </p>
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
