'use client';

import { useState } from 'react';
import Link from 'next/link';
import CfsLink from './CfsLink';

const faqs = [
  {
    q: 'When and where is DevFest Sydney 2026?',
    a: 'DevFest Sydney 2026 will take place in Sydney CBD. The exact date and venue will be announced shortly.',
  },
  {
    q: 'Who can attend?',
    a: 'Everyone. DevFest Sydney welcomes engineers, designers, product managers, and founders of all experience levels, from students to senior leaders.',
  },
  {
    q: 'How do I register to attend?',
    a: 'Registration details will be announced closer to the event.',
  },
  {
    q: 'How do I submit a talk or workshop?',
    a: 'Our Call for Speakers is open! We welcome talks, workshops, and lightning talks across the Developer, Builder, and Workshops tracks.',
  },
  {
    q: 'What tracks are at DevFest Sydney?',
    a: 'We have three tracks: the Developer Track for engineers, the Builder Track for product managers, designers, and founders, and the Workshops Track for hands-on, build-along sessions.',
  },
  {
    q: 'What is GDG Sydney?',
    a: 'Google Developer Group Sydney is a community of over 2,000 developers and builders. DevFest Sydney is our flagship annual event, organised by volunteers and presented by Google.',
  },
  {
    q: 'How can my company sponsor DevFest Sydney?',
    a: 'We\'d love to hear from you. Reach out to hello@gdgsydney.com and we\'ll share our sponsorship options.',
  },
  {
    q: 'Can I volunteer at DevFest Sydney?',
    a: 'Yes, we\'re always looking for volunteers to help run the day. Email hello@gdgsydney.com to get involved.',
  },
  {
    q: 'Is there a Code of Conduct?',
    a: 'Yes. DevFest Sydney is committed to providing a harassment-free experience for everyone, regardless of background or experience level.',
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="divide-y divide-black-02/10 border-t border-b border-black-02/10">
      {faqs.map((faq, i) => (
        <div key={i}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full py-5 flex justify-between items-center text-left gap-6 hover:opacity-70 transition-opacity"
          >
            <span className="font-medium text-black-02/90">{faq.q}</span>
            <span
              className={`text-black-02/35 text-xl flex-shrink-0 transition-transform duration-200 ${
                open === i ? 'rotate-45' : ''
              }`}
            >
              +
            </span>
          </button>
          <div
            className={`overflow-hidden transition-all duration-300 ${
              open === i ? 'max-h-48' : 'max-h-0'
            }`}
          >
            <p className="pb-5 text-black-02/60 leading-relaxed text-sm">
              {faq.a}
              {faq.q.includes('Code of Conduct') && (
                <>
                  {' '}
                  <Link href="/code-of-conduct" className="text-google-blue hover:underline">
                    Read the full Code of Conduct.
                  </Link>
                </>
              )}
              {faq.q.includes('submit a talk') && (
                <>
                  {' Visit the '}
                  <CfsLink className="text-google-blue hover:underline">
                    Call for Speakers page
                  </CfsLink>
                  {'.'}
                </>
              )}
              {faq.q.includes('What is GDG Sydney') && (
                <>
                  {' Visit '}
                  <a
                    href="https://gdgsydney.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-google-blue hover:underline"
                  >
                    gdgsydney.com
                  </a>
                  {'.'}
                </>
              )}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
