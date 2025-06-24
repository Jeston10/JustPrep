import Link from "next/link";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import InterviewCard from "@/components/InterviewCard";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/actions/auth.action";
import {
  getInterviewsByUserId,
  getLatestInterviews,
} from "@/lib/actions/general.action";

async function Home() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/sign-in');
  }

  const [userInterviews, allInterview] = await Promise.all([
    getInterviewsByUserId(user?.id!),
    getLatestInterviews({ userId: user?.id! }),
  ]);

  const hasPastInterviews = userInterviews?.length! > 0;
  const hasUpcomingInterviews = allInterview?.length! > 0;

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-primary-200/40 via-white to-primary-100/60 dark:from-dark-200 dark:via-dark-100 dark:to-dark-300 pb-24">
      {/* Hero Section */}
      <section className="card-cta shadow-2xl rounded-3xl bg-white/80 dark:bg-dark-200/80 backdrop-blur-md border border-primary-200/30 flex flex-col md:flex-row items-center justify-between gap-10 px-10 py-14 mt-4 mx-auto max-w-5xl animate-fadeIn">
        <div className="flex flex-col gap-6 max-w-lg">
          <h1 className="text-4xl md:text-5xl font-extrabold text-primary-100 leading-tight mb-2">
            Get Interview-Ready with <span className="text-primary-200">AI-Powered</span> Practice & Feedback
          </h1>
          <p className="text-xl text-light-400 mb-4">
            Practice real interview questions & get instant feedback. Level up your skills and confidence for your dream job!
          </p>
          <Button asChild className="btn-primary max-sm:w-full transition-transform duration-200 hover:scale-105 shadow-lg">
            <Link href="/interview">Start an Interview</Link>
          </Button>
        </div>
        <div className="flex flex-col items-center justify-center">
          <Image
            src="/robot.png"
            alt="robo-dude"
            width={400}
            height={400}
            className="rounded-3xl shadow-2xl border-4 border-primary-200/30 animate-fadeIn"
            priority
          />
        </div>
      </section>

      {/* Divider */}
      <div className="w-full flex justify-center my-12">
        <div className="h-1 w-32 bg-gradient-to-r from-primary-200 via-primary-100 to-primary-200 rounded-full opacity-60" />
      </div>

      {/* Your Interviews Section */}
      <section className="flex flex-col gap-6 mt-8 max-w-5xl mx-auto animate-fadeIn">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-2 h-8 bg-primary-200 rounded-full" />
          <h2 className="text-2xl md:text-3xl font-bold text-primary-100 tracking-tight">Your Interviews</h2>
        </div>
        <div className="interviews-section">
          {hasPastInterviews ? (
            userInterviews?.map((interview) => (
              <InterviewCard
                key={interview.id}
                userId={user?.id}
                interviewId={interview.id}
                role={interview.role}
                type={interview.type}
                techstack={interview.techstack}
                createdAt={interview.createdAt}
              />
            ))
          ) : (
            <p className="text-lg text-light-400">You haven&apos;t taken any interviews yet</p>
          )}
        </div>
      </section>

      {/* Divider */}
      <div className="w-full flex justify-center my-12">
        <div className="h-1 w-32 bg-gradient-to-r from-primary-200 via-primary-100 to-primary-200 rounded-full opacity-60" />
      </div>

      {/* Take Interviews Section */}
      <section className="flex flex-col gap-6 mt-8 max-w-5xl mx-auto animate-fadeIn">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-2 h-8 bg-primary-200 rounded-full" />
          <h2 className="text-2xl md:text-3xl font-bold text-primary-100 tracking-tight">Take Interviews</h2>
        </div>
        <div className="interviews-section">
          {hasUpcomingInterviews ? (
            allInterview?.map((interview) => (
              <InterviewCard
                key={interview.id}
                userId={user?.id}
                interviewId={interview.id}
                role={interview.role}
                type={interview.type}
                techstack={interview.techstack}
                createdAt={interview.createdAt}
              />
            ))
          ) : (
            <p className="text-lg text-light-400">There are no interviews available</p>
          )}
        </div>
      </section>
    </div>
  );
}

export default Home;