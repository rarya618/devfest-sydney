import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// robots.txt only stops crawling; a linked admin URL could still be indexed without a
// snippet. This keeps every admin route out of the index outright, and gives them one
// title template so pages don't each repeat the site suffix.
export const metadata: Metadata = {
  title: {
    template: '%s · Admin — DevFest Sydney 2026',
    default: 'Admin — DevFest Sydney 2026',
  },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return children;
}
