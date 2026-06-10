'use client';

import { useState } from 'react';
import Link from 'next/link';

const faqs = [
  {
    q: 'When and where is DevFest Sydney 2026?',
    a: 'DevFest Sydney 2026 takes place on Saturday, 10 October 2026 in Sydney CBD. The exact venue will be announced shortly.',
  },
  {
    q: 'How do I register to attend?',
    a: 'Tickets will be available via Humanitix closer to the event. We expect 150–300+ attendees.',
  },
  {
    q: 'How do I submit a talk or workshop?',
    a: 'Our Call for Speakers is open! Head to the Call for Speakers page to submit your proposal. We welcome talks, workshops, and lightning talks across both the Developer and Builder tracks.',
  },
  {
    q: 'What tracks are at DevFest Sydney?',
    a: 'We have two main tracks: the Developer Track for engineers, and the Builder Track for product managers, designers, and founders. There\'s also a Builder Showcase (5-min demos with audience voting) and the Agentathon.',
  },
  {
    q: 'What is the Agentathon?',
    a: 'The Agentathon is a 2-hour structured team challenge in the afternoon where participants use Gemini to solve real problems. It features a live leaderboard and prizes for the top teams.',
  },
  {
    q: 'What is Builder\'s Space?',
    a: 'Builder\'s Space is a dedicated room available throughout the day with Google Developer Experts (GDEs) and mentors providing hands-on support for whatever you\'re building.',
  },
  {
    q: 'Is there a Code of Conduct?',
    a: 'Yes. DevFest Sydney is committed to providing a harassment-free experience for everyone, regardless of background or experience level.',
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="space-y-2">
      {faqs.map((faq, i) => (
        <div
          key={i}
          className="border border-white/7 rounded-xl overflow-hidden transition-colors hover:border-white/12"
        >
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full px-6 py-4 flex justify-between items-center text-left gap-6 hover:bg-white/[0.02] transition-colors"
          >
            <span className="font-medium text-white/90">{faq.q}</span>
            <span
              className={`text-white/30 text-xl flex-shrink-0 transition-transform duration-200 ${
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
            <p className="px-6 pb-5 text-white/50 leading-relaxed text-sm">
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
