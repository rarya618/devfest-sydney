import type { ReactNode, AnchorHTMLAttributes } from 'react';
import Link from 'next/link';

interface CfsLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  children: ReactNode;
}

// Tracking attribution doesn't need to ride the visible URL: TrackingCapture
// persists UTM params to localStorage on landing, and CfsForm reads them from
// there at submit time. Keeping this link plain avoids showing the visitor's
// own tracking source (e.g. "linkedin") in a link they can hover, copy, or share.
export default function CfsLink({ children, ...rest }: CfsLinkProps) {
  return (
    <Link href="/call-for-speakers" {...rest}>
      {children}
    </Link>
  );
}
