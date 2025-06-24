import { getCurrentUser } from '@/lib/actions/auth.action';
import ProfileClient from '@/components/ProfileClient';

export default async function ProfilePage() {
  const user = await getCurrentUser();
  return <ProfileClient user={user} />;
} 