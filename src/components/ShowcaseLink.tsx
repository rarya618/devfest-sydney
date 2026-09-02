import type { ReactNode, AnchorHTMLAttributes } from 'react';
import Link from 'next/link';
import { INTERNAL_UTM_SOURCE, INTERNAL_UTM_MEDIUM } from '@/lib/tracking';

interface ShowcaseLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  children: ReactNode;
  // Labels which on-page CTA was clicked (e.g. "footer", "landing"), sent as full UTM
  // params (utm_source=devfest-site, utm_medium=internal, ref=<source>). Safe to show in
  // the URL: it is a label we chose for our own element, not the visitor's own source.
  source?: string;
}

// Same reasoning as VolunteerLink: TrackingCapture persists a visitor's own UTM params to
// localStorage on landing and ShowcaseForm reads them back at submit time, so the link
// itself stays plain unless we are labelling one of our own CTAs.
export default function ShowcaseLink({ children, source, ...rest }: ShowcaseLinkProps) {
  const href = source
    ? `/builder-showcase?${new URLSearchParams({
        utm_source: INTERNAL_UTM_SOURCE,
        utm_medium: INTERNAL_UTM_MEDIUM,
        ref: source,
      }).toString()}`
    : '/builder-showcase';
  return (
    <Link href={href} {...rest}>
      {children}
    </Link>
  );
}
