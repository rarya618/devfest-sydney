import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { adminAuth } from '@/lib/firebase-admin';
import LoginForm from './LoginForm';

export const metadata = { title: 'Admin Login — DevFest Sydney 2026' };

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
    <main className="min-h-screen bg-off-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-0.5 hover:opacity-80 transition-opacity" aria-label="Back to DevFest Sydney home">
            <Image
              src="/logo.png"
              alt="GDG"
              width={120}
              height={32}
              className="h-8 w-auto object-contain"
              priority
            />
            <span className="font-bold text-black-02 text-xl tracking-wide">DevFest Sydney</span>
          </Link>
          <p className="text-sm text-black-02/40">Admin</p>
        </div>

        <div className="bg-white border border-black-02/8 rounded-2xl p-8">
          <p className="text-sm text-black-02/55 text-center mb-6 leading-relaxed">
            Sign in with an authorised Google account to access the dashboard.
          </p>
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
