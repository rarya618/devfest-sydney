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
      className="lg:hidden sticky top-0 z-40 mt-10 -mx-4 sm:-mx-6 bg-black-02 border-y border-white/10 px-4 sm:px-6 py-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
    >
      <ul className="flex items-center gap-1.5 w-max">
        {sections.map((section) => {
          const isActive = activeSection === section.slug;
          return (
            <li key={section.slug}>
              <a
                href={`#${section.slug}`}
                aria-current={isActive ? 'true' : undefined}
                aria-label={`Jump to ${section.title}`}
                className={`flex items-center px-3 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors
                  ${isActive ? 'bg-white/[0.08] text-off-white' : 'text-white/65 hover:text-off-white hover:bg-white/5'}`}
              >
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
    <nav aria-label="Sections" className="hidden lg:block sticky top-10 w-56 shrink-0 self-start">
      <ul className="space-y-1">
        {sections.map((section) => {
          const isActive = activeSection === section.slug;
          return (
            <li key={section.slug}>
              <a
                href={`#${section.slug}`}
                aria-current={isActive ? 'true' : undefined}
                aria-label={`Jump to ${section.title}`}
                className={`block px-4 py-2 rounded-full text-sm font-bold transition-colors
                  ${isActive ? 'bg-white/[0.08] text-off-white' : 'text-white/65 hover:text-off-white hover:bg-white/5'}`}
              >
                {section.title}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
