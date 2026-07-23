'use client';

import { useState } from 'react';
import Link from 'next/link';
import CfsLink from './CfsLink';

function buildFaqs(isCfsOpen: boolean) {
  return [
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
    a: isCfsOpen
      ? 'Our Call for Speakers is open! We welcome talks, workshops, and lightning talks across the Developer, Builder, and Workshops tracks.'
      : 'Our Call for Speakers is currently closed. We welcome talks, workshops, and lightning talks across the Developer, Builder, and Workshops tracks when it reopens.',
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
}

export default function FAQ({ isCfsOpen }: { isCfsOpen: boolean }) {
  const [open, setOpen] = useState<number | null>(null);
  const faqs = buildFaqs(isCfsOpen);

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {faqs.map((faq, i) => (
        <div
          key={i}
          className="bg-white border border-black-02/8 rounded-2xl px-6 self-start"
        >
          <button
            onClick={() => setOpen(open === i ? null : i)}
            aria-expanded={open === i}
            className={`w-full pt-5 flex justify-between items-center text-left gap-6 hover:opacity-70 transition-[padding-bottom,opacity] duration-300 ${
              open === i ? 'pb-2' : 'pb-5'
            }`}
          >
            <span className="font-bold text-black-02/90 text-base">{faq.q}</span>
            <span
              className={`text-black-02/35 text-xl flex-shrink-0 transition-transform duration-200 ${
                open === i ? 'rotate-45' : ''
              }`}
              aria-hidden="true"
            >
              +
            </span>
          </button>
          <div
            className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
              open === i ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
            }`}
          >
            <div className="overflow-hidden">
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
        </div>
      ))}
    </div>
  );
}
