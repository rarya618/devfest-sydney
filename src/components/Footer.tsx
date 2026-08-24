import Image from 'next/image';
import Link from 'next/link';
import VolunteerLink from './VolunteerLink';

const COLUMNS: { heading: string; links: { label: string; href: string; external?: boolean }[] }[] = [
  // {
  //   heading: 'Event',
  //   links: [
  //     { label: 'Agenda', href: '/#tracks' },
  //     { label: 'Speakers', href: '/' },
  //     { label: 'Venue', href: '/#venue' },
  //     { label: 'Sponsors', href: '/#sponsors' },
  //     { label: 'Tickets', href: '/' },
  //   ],
  // },
  {
    heading: 'Support',
    links: [
      { label: 'Volunteer', href: '/volunteer' },
      { label: 'FAQ', href: '/faq' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Code of Conduct', href: '/conduct' },
    ],
  },
  {
    heading: 'Social',
    links: [
      { label: 'Community page', href: 'https://gdg.community.dev/gdg-sydney/', external: true },
      { label: 'Meetup', href: 'https://www.meetup.com/gdgcloudsydney/', external: true },
      { label: 'Slack', href: 'https://join.slack.com/t/gdganz/shared_invite/zt-3acfakeqo-4KAJLoq~TISLD_2jYntmSg', external: true },
      { label: 'Instagram', href: 'https://www.instagram.com/gdgsydney', external: true },
      { label: 'LinkedIn', href: 'https://www.linkedin.com/company/gdg-sydney/', external: true },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="px-6 pb-8">
      <div className="bg-white/[0.06] rounded-[40px] pb-8 overflow-hidden">
        <div className="bg-white/10 py-3 px-6 flex items-center justify-center gap-2.5 text-base">
          <span className="font-bold text-white">Sat, 10 October 2026</span>
          <span className="w-1 h-1 rounded-full bg-white/70 shrink-0" aria-hidden="true" />
          <span className="font-bold text-white">Torrens University, Surry Hills</span>
        </div>

        <div className="flex flex-col items-center text-center md:items-start md:text-left md:flex-row md:justify-between gap-10 px-6 md:px-10 pt-8 pb-12">
          <div>
            <Link href="/" className="inline-flex items-center group" aria-label="DevFest Sydney home">
              <Image
                src="/logo-wordmark.png"
                alt="DevFest Sydney"
                width={1331}
                height={240}
                className="h-9 w-auto object-contain group-hover:opacity-80 transition-opacity"
              />
            </Link>
            <p className="text-sm text-white mt-1 max-w-xs leading-relaxed">
              Organised by{' '}
              <a
                href="https://gdgsydney.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-white/80 transition-colors underline underline-offset-2"
              >
                GDG Sydney
              </a>
            </p>
          </div>

          <div className="flex flex-wrap justify-center md:justify-start gap-x-16 gap-y-8">
            {COLUMNS.map((column) => (
              <div key={column.heading} className="min-w-[150px]">
                <p className="text-xl font-bold text-white mb-3">{column.heading}</p>
                <ul className="space-y-3">
                  {column.links.map((link) => {
                    if (link.label === 'Volunteer') {
                      return (
                        <li key={link.label}>
                          <VolunteerLink source="footer" className="text-sm text-white hover:text-white/70 transition-colors">
                            {link.label}
                          </VolunteerLink>
                        </li>
                      );
                    }
                    if (link.external) {
                      return (
                        <li key={link.label}>
                          <a
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-white hover:text-white/70 transition-colors"
                          >
                            {link.label}
                          </a>
                        </li>
                      );
                    }
                    return (
                      <li key={link.label}>
                        <Link href={link.href} className="text-sm text-white hover:text-white/70 transition-colors">
                          {link.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 md:px-10 pt-8 pb-4">
          <span className="text-sm font-bold text-white"><span className="font-mono">©</span> 2026 GDG Sydney. All rights reserved.</span>
          <div className="flex items-center gap-8">
            <a
              href="https://gdgsydney.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GDG Sydney website"
              className="text-white hover:text-white/80 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.6 9h16.8M3.6 15h16.8M11.5 3a17 17 0 0 0 0 18M12.5 3a17 17 0 0 1 0 18" />
              </svg>
            </a>
            <a
              href="https://gdg.community.dev/gdg-sydney/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GDG Sydney community"
              className="text-white hover:text-white/80 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
              </svg>
            </a>
            <a
              href="mailto:hello@gdgsydney.com"
              aria-label="Email GDG Sydney"
              className="text-white hover:text-white/80 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
