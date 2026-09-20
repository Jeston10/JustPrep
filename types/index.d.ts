interface Feedback {
  id: string;
  interviewId: string;
  totalScore: number;
  categoryScores: {
    name: string;
    score: number;
    comment: string;
  }[];
  strengths: string[];
  areasForImprovement: string[];
  finalAssessment: string;
  createdAt: string;
}

interface Interview {
  id: string;
  role: string;
  level: string;
  questions: string[];
  techstack: string[];
  createdAt: string;
  userId: string;
  type: string;
  finalized: boolean;
}

interface CreateFeedbackParams {
  interviewId: string;
  userId: string;
  transcript: { role: string; content: string }[];
  feedbackId?: string | undefined;
}

interface User {
  name: string;
  email: string;
  id: string;
  dailyLogins?: Record<string, boolean>;
  lastLoginDate?: string;
  loginStreak?: number;
  description?: string;
  photoURL?: string;
}

interface InterviewCardProps {
  interviewId?: string | undefined;
  userId?: string | undefined;
  role: string;
  type: string;
  techstack: string[];
  createdAt?: string | undefined;
}

interface RouteParams<TParams extends Record<string, string> = Record<string, string>> {
  params: Promise<TParams>;
  searchParams: Promise<Record<string, string | undefined>>;
}

interface GetFeedbackByInterviewIdParams {
  interviewId: string;
  userId: string;
}

interface GetLatestInterviewsParams {
  userId: string;
  limit?: number;
}

type FormType = "sign-in" | "sign-up";

interface InterviewFormProps {
  interviewId: string;
  role: string;
  level: string;
  type: string;
  techstack: string[];
  amount: number;
}

interface TechIconProps {
  techStack: string[];
}
