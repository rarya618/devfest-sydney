import { getVerifiedSession } from '@/lib/adminSession';
import { fetchPeople } from '@/lib/people';
import PeopleDashboard from '../../PeopleDashboard';

export const metadata = {
  title: 'All speakers',
};

export default async function PeoplePage() {
  const [, people] = await Promise.all([getVerifiedSession(), fetchPeople()]);
  return <PeopleDashboard people={people} />;
}
