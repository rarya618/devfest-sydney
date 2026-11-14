import { redirect } from 'next/navigation';

// The admin's front door. Its DevFest pages live under /admin/devfest (moved 2026-11-14);
// signing in still lands on talk proposals, as it always has.
export default function AdminHomePage() {
  redirect('/admin/devfest/proposals');
}
