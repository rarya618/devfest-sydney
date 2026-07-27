import type { ReactNode, AnchorHTMLAttributes } from 'react';
import Link from 'next/link';
import { INTERNAL_UTM_SOURCE, INTERNAL_UTM_MEDIUM } from '@/lib/tracking';

interface CfsLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  children: ReactNode;
  // Labels which on-page CTA was clicked (e.g. "banner", "navbar"), sent as full UTM
  // params (utm_source=devfest-site, utm_medium=internal, ref=<source>). Safe to show
  // in the URL: unlike a visitor's own external UTM source, this is a label we chose
  // for our own element, not something we're echoing back at them.
  source?: string;
}

// External tracking attribution doesn't need to ride the visible URL: TrackingCapture
// persists UTM params to localStorage on landing, and CfsForm reads them from
// there at submit time. Keeping this link plain by default avoids showing the visitor's
// own tracking source (e.g. "linkedin") in a link they can hover, copy, or share.
export default function CfsLink({ children, source, ...rest }: CfsLinkProps) {
  const href = source
    ? `/call-for-speakers?${new URLSearchParams({
        utm_source: INTERNAL_UTM_SOURCE,
        utm_medium: INTERNAL_UTM_MEDIUM,
        ref: source,
      }).toString()}`
    : '/call-for-speakers';
  return (
    <Link href={href} {...rest}>
      {children}
    </Link>
  );
}
