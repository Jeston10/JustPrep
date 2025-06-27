import { getCurrentUser } from '@/lib/actions/auth.action';
import ProfileClient from '@/components/ProfileClient';
import { getInterviewsByUserId, getFeedbackByInterviewId } from '@/lib/actions/general.action';

export default async function ProfilePage() {
  const user = await getCurrentUser();
  let averageScore = null;

  if (user?.id) {
    const interviews = await getInterviewsByUserId(user.id);
    if (interviews && interviews.length > 0) {
      let total = 0;
      let count = 0;
      for (const interview of interviews) {
        const feedback = await getFeedbackByInterviewId({ interviewId: interview.id, userId: user.id });
        if (feedback && typeof feedback.totalScore === 'number') {
          total += feedback.totalScore;
          count++;
        }
      }
      if (count > 0) {
        averageScore = total / count;
      }
    }
  }

  return <ProfileClient user={user} averageScore={averageScore} />;
} 