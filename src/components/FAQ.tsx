'use client';

import { useState } from 'react';
import Link from 'next/link';

const faqs = [
  {
    q: 'When and where is DevFest Sydney 2026?',
    a: 'DevFest Sydney 2026 will take place in Sydney CBD. The exact date and venue will be announced shortly.',
  },
  {
    q: 'How do I register to attend?',
    a: 'Registration details will be announced closer to the event.',
  },
  {
    q: 'How do I submit a talk or workshop?',
    a: 'Our Call for Speakers is open! Head to the Call for Speakers page to submit your proposal. We welcome talks, workshops, and lightning talks across both the Developer and Builder tracks.',
  },
  {
    q: 'What tracks are at DevFest Sydney?',
    a: 'We have two main tracks: the Developer Track for engineers, and the Builder Track for product managers, designers, and founders.',
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
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
