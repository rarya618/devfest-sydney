import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/metadata';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { areTicketsOpen } from '@/lib/tickets';
import JobFormHero from '../JobFormHero';
import JobListingForm from './JobListingForm';

// The navbar ticket CTA follows the on-sale date, so this is rendered per request.
export const dynamic = 'force-dynamic';

const title = 'Post a role';
const description = 'Post a role to the DevFest Sydney 2026 job board. Free for any team, checked by an organiser before it goes up.';

export const metadata: Metadata = buildPageMetadata({ title, description, path: '/jobs/post' });

export default function PostJobPage() {
  return (
    <div className="bg-[#010103] text-white min-h-screen">
      <Navbar areTicketsOpen={areTicketsOpen()} />

      <JobFormHero backHref="/jobs" backLabel="Back to the job board" title="Post a role">
        <p>
          Free for any team. An organiser checks every role before it goes up, and DevFest sponsors&apos;
          roles are listed first. Questions? Email{' '}
          <a href="mailto:hello@gdgsydney.com" className="text-white hover:text-white/80 underline underline-offset-2">
            hello@gdgsydney.com
          </a>
          .
        </p>
      </JobFormHero>

      <section className="pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <JobListingForm />
        </div>
      </section>

      <Footer />
    </div>
  );
}
