import { redirect } from 'next/navigation';

// This app is the GDG Sydney back office: its public pages moved to gdgsydney.com in stage 3
// of the plan in PM.md. In production the root never reaches here (siteRedirects sends the
// app host to /admin and the old DevFest host to the 2026 archive); this covers localhost
// and the App Hosting preview URL the same way as the app host.
export default function RootPage() {
  redirect('/admin');
}
