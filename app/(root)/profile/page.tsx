import { getCurrentUser } from "@/server/auth/session";
import { averageFeedbackScore } from "@/server/services/stats.service";

import ProfileClient from "@/components/ProfileClient";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  // One aggregate query instead of one read per interview (GUARDRAILS B8).
  const averageScore = user ? await averageFeedbackScore(user.id) : null;

  return <ProfileClient user={user} averageScore={averageScore} />;
}
