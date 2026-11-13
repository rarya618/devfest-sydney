interface PortalShellProps {
  // The page's width: the dashboard needs room for two columns, forms read better narrow.
  width?: 'wide' | 'narrow';
  children: React.ReactNode;
}

// A portal page's content area, below the header in layout.tsx. It mounts afresh on each page,
// so the content fades in as it arrives (animate-page-in, off under reduced motion).
export function portalMainClass(width: 'wide' | 'narrow'): string {
  return `mx-auto px-4 sm:px-6 pt-6 pb-16 sm:pt-10 sm:pb-24 ${width === 'wide' ? 'max-w-6xl' : 'max-w-2xl'}`;
}

export default function PortalShell({ width = 'wide', children }: PortalShellProps) {
  return <main className={`${portalMainClass(width)} animate-page-in`}>{children}</main>;
}
