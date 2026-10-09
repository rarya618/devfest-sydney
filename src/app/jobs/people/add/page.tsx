import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/metadata';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { areTicketsOpen } from '@/lib/tickets';
import JobFormHero from '../../JobFormHero';
import JobSeekerForm from './JobSeekerForm';

export const dynamic = 'force-dynamic';

const title = 'Add your profile';
const description = 'Looking for work? Add a short profile to the DevFest Sydney 2026 job board so the teams at the event can find you.';

export const metadata: Metadata = buildPageMetadata({ title, description, path: '/jobs/people/add' });

export default function AddJobSeekerPage() {
  return (
    <div className="bg-[#010103] text-white min-h-screen">
      <Navbar areTicketsOpen={areTicketsOpen()} />

      <JobFormHero activeForm="seeking" backHref="/jobs/people" backLabel="Back to the people open to work" title="Add your profile">
        <p>
          A short profile so the teams at DevFest can find you. We never show your email: employers reach you
          through LinkedIn. To change or remove your profile, email{' '}
          <a href="mailto:hello@gdgsydney.com" className="text-white hover:text-white/80 underline underline-offset-2">
            hello@gdgsydney.com
          </a>
          .
        </p>
      </JobFormHero>

      <section className="pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <JobSeekerForm />
        </div>
      </section>

      <Footer />
    </div>
  );
}
