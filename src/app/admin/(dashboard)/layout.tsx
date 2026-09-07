import type { ReactNode } from 'react';
import { getVerifiedSession } from '@/lib/adminSession';
import AdminShell from '../AdminShell';

// The shell (sidebar, mobile bar, account menu) renders once here rather than inside
// every page, so moving between admin sections keeps it on screen while the next
// page's data loads behind `loading.tsx`. The login page sits outside this group and
// stays shell-free. Each page still verifies the session itself; `verifyAdminSession`
// is request-cached so the two checks cost one lookup.
export default async function AdminDashboardLayout({ children }: { children: ReactNode }) {
  const admin = await getVerifiedSession();

  return (
    <AdminShell adminEmail={admin.email} adminName={admin.name}>
      {children}
    </AdminShell>
  );
}
