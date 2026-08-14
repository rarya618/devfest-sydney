'use client';

import { useEffect, useState } from 'react';

interface Section {
  slug: string;
  title: string;
}

export function PrivacyPolicyMobileNav({ sections }: { sections: Section[] }) {
  const [activeSection, setActiveSection] = useState<string>(sections[0]?.slug ?? '');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveSection(visible[0].target.id);
      },
      { rootMargin: '-15% 0px -70% 0px', threshold: 0 }
    );
    sections.forEach(({ slug }) => {
      const el = document.getElementById(slug);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [sections]);

  return (
    <nav
      aria-label="Sections"
      className="lg:hidden sticky top-[88px] z-40 mt-10 bg-[#202124] border-y border-white/8 px-6 py-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
    >
      <ul className="flex items-center gap-1.5 w-max">
        {sections.map((section, i) => {
          const isActive = activeSection === section.slug;
          return (
            <li key={section.slug}>
              <a
                href={`#${section.slug}`}
                aria-current={isActive ? 'true' : undefined}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold text-white whitespace-nowrap transition-colors
                  ${isActive ? 'bg-white/[0.06]' : 'hover:bg-white/5'}`}
              >
                <span className="text-white/40" aria-hidden="true">0{i + 1}</span>
                {section.title}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function PrivacyPolicySidebar({ sections }: { sections: Section[] }) {
  const [activeSection, setActiveSection] = useState<string>(sections[0]?.slug ?? '');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveSection(visible[0].target.id);
      },
      { rootMargin: '-15% 0px -70% 0px', threshold: 0 }
    );
    sections.forEach(({ slug }) => {
      const el = document.getElementById(slug);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [sections]);

  return (
    <nav aria-label="Sections" className="hidden lg:block sticky top-28 w-64 shrink-0 self-start">
      <ul className="space-y-1">
        {sections.map((section, i) => {
          const isActive = activeSection === section.slug;
          return (
            <li key={section.slug}>
              <a
                href={`#${section.slug}`}
                aria-current={isActive ? 'true' : undefined}
                className={`flex items-center gap-6 px-6 py-3 rounded-lg border border-l-4 text-sm font-bold text-white transition-colors
                  ${isActive ? 'bg-white/[0.06] border-[#555555]' : 'border-transparent hover:bg-white/5'}`}
              >
                <span className="text-xs text-white/40 leading-none self-center tabular-nums" aria-hidden="true">0{i + 1}</span>
                <span className="leading-none self-center">{section.title}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
