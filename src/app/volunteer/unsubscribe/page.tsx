import type { Metadata } from 'next';
import Image from 'next/image';
import OptOutButton from './OptOutButton';

export const metadata: Metadata = {
  title: 'Volunteer invites',
  robots: { index: false, follow: false },
};

interface UnsubscribePageProps {
  searchParams: Promise<{ token?: string }>;
}

// The "Don't invite me again" link at the foot of every volunteer invite (stage 4d-2, PM.md).
// The token is checked when the button is pressed, so nothing here reads Firestore.
export default async function VolunteerUnsubscribePage({ searchParams }: UnsubscribePageProps) {
  const { token } = await searchParams;

  return (
    <main className="bg-[#010103] text-white min-h-screen flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-xl bg-white/[0.04] border border-white/10 rounded-3xl px-8 py-12 sm:px-12 text-center">
        <Image src="/logo-wordmark.png" alt="DevFest Sydney" width={1331} height={240} priority className="h-8 w-auto object-contain mx-auto mb-10" />
        <h1 className="text-[clamp(1.75rem,5vw,2.5rem)] font-bold leading-tight tracking-tight mb-5">Stop volunteer invites?</h1>
        {token ? (
          <>
            <p className="text-white/70 leading-relaxed mb-8">
              We&rsquo;ll stop emailing you to crew GDG Sydney events. Anything you&rsquo;ve already signed up for
              stays as it is.
            </p>
            <OptOutButton token={token} />
          </>
        ) : (
          <p className="text-white/70 leading-relaxed">
            This link is missing a part. Write to{' '}
            <a href="mailto:hello@gdgsydney.com" className="text-google-blue hover:underline">hello@gdgsydney.com</a> and
            we&rsquo;ll take you off the list.
          </p>
        )}
      </div>
    </main>
  );
}
