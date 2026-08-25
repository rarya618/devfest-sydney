'use client';

import type { ReactNode } from 'react';
import { useMobileBarHidden } from './MobileBarContext';

interface Props {
  children: ReactNode;
  className: string;
}

export default function StickyAdminHeader({ children, className }: Props) {
  const mobileBarHidden = useMobileBarHidden();

  return (
    <div className={`sticky ${mobileBarHidden ? 'top-0' : 'top-[4.25rem]'} md:top-0 transition-[top] duration-300 ease-in-out ${className}`}>
      {children}
    </div>
  );
}
