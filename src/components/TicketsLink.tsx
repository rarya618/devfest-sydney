import type { ReactNode, AnchorHTMLAttributes } from 'react';
import { ticketsHref } from '@/lib/tickets';

interface TicketsLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  children: ReactNode;
  // Labels which on-page CTA was clicked (e.g. "hero", "navbar"), sent to Humanitix as
  // UTM params so ticket sales can be attributed back to the CTA that drove them.
  source?: string;
}

export default function TicketsLink({ children, source, ...rest }: TicketsLinkProps) {
  return (
    <a href={ticketsHref(source)} target="_blank" rel="noopener noreferrer" {...rest}>
      {children}
    </a>
  );
}
