import type { Metadata } from 'next';
import PublicShell from '@/components/PublicShell';
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
    <PublicShell minimal>
      <div className="max-w-xl">
        <h1 className="text-[clamp(2.25rem,6vw,3.5rem)] font-bold leading-[1.02] tracking-[-0.02em] mb-5">Stop volunteer invites?</h1>
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
    </PublicShell>
  );
}
