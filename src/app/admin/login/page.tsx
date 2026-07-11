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
    <main className="min-h-screen bg-[#0f0f0f] flex items-center justify-center px-4">
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
            <span className="font-bold text-white text-xl tracking-wide">DevFest Sydney</span>
          </Link>
          <p className="text-sm text-white/35">Admin</p>
        </div>

        <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-8">
          <p className="text-sm text-white/50 text-center mb-6 leading-relaxed">
            Sign in with an authorised Google account to access the dashboard.
          </p>
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
