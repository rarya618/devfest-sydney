import { adminDb } from '@/lib/firebase-admin';
import { getVerifiedSession } from '@/lib/adminSession';
import AdminShell from '../AdminShell';
import AdminsView from './AdminsView';
import type { AdminUser } from '@/lib/types';
import type { Timestamp } from 'firebase-admin/firestore';

export const metadata = { title: 'Admins — DevFest Sydney 2026' };

async function fetchAdmins(): Promise<AdminUser[]> {
  const snapshot = await adminDb.collection('admins').orderBy('addedAt', 'asc').get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    const timestamp = data.addedAt as Timestamp | undefined;
    return {
      email: doc.id,
      name: data.name ?? doc.id,
      addedBy: data.addedBy ?? '',
      addedAt: timestamp ? timestamp.toDate().toISOString() : new Date().toISOString(),
    } satisfies AdminUser;
  });
}

export default async function AdminsPage() {
  const admin = await getVerifiedSession();
  const admins = await fetchAdmins();

  return (
    <AdminShell adminEmail={admin.email} adminName={admin.name}>
      <AdminsView admins={admins} currentAdminEmail={admin.email} />
    </AdminShell>
  );
}
