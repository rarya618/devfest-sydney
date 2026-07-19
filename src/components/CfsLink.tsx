'use client';

import { useState, useEffect, type ReactNode, type AnchorHTMLAttributes } from 'react';
import Link from 'next/link';
import { getTrackingParams } from '@/lib/tracking';

interface CfsLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  children: ReactNode;
}

export default function CfsLink({ children, ...rest }: CfsLinkProps) {
  const [href, setHref] = useState('/call-for-speakers');

  useEffect(() => {
    const tracking = getTrackingParams();
    const query = new URLSearchParams(tracking).toString();
    if (query) setHref(`/call-for-speakers?${query}`);
  }, []);

  return (
    <Link href={href} {...rest}>
      {children}
    </Link>
  );
}
