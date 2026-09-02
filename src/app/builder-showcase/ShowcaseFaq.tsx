'use client';

import { useState } from 'react';

export interface ShowcaseFaqItem {
  q: string;
  a: string;
}

// Mirrors the accordion on /faq (src/components/FAQ.tsx) so the two read as one site.
// Kept separate rather than shared because that component hardcodes its own questions
// and a pile of per-question link special-cases; this one just takes its content in.
export default function ShowcaseFaq({ faqs }: { faqs: ShowcaseFaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="grid gap-4">
      {faqs.map((faq, index) => {
        const isOpen = openIndex === index;
        return (
          <div
            key={faq.q}
            className="bg-white/[0.02] border border-white/10 rounded-2xl px-8 self-start transition-colors duration-200 hover:border-white/20"
          >
            <button
              onClick={() => setOpenIndex(isOpen ? null : index)}
              aria-expanded={isOpen}
              aria-controls={`showcase-faq-answer-${index}`}
              className={`w-full pt-5 flex justify-between items-center text-left gap-6 hover:opacity-70 transition-[padding-bottom,opacity] duration-300 ${
                isOpen ? 'pb-3' : 'pb-5'
              }`}
            >
              <span className="font-bold text-white/90 text-lg leading-relaxed">{faq.q}</span>
              <span
                className={`text-white/35 text-3xl leading-none flex-shrink-0 self-center transition-transform duration-200 ${
                  isOpen ? 'rotate-45' : ''
                }`}
                aria-hidden="true"
              >
                +
              </span>
            </button>
            <div
              id={`showcase-faq-answer-${index}`}
              className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
                isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
              }`}
            >
              <div className="overflow-hidden">
                <p className="pb-5 text-white/55 leading-relaxed text-base">{faq.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
