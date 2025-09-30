import Link from "next/link";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import InterviewCard from "@/components/InterviewCard";
import { redirect } from "next/navigation";

import { getCurrentUser, recordDailyLogin } from "@/lib/actions/auth.action";
import {
  getInterviewsByUserId,
  getLatestInterviews,
  getUserFeedbackForPast5Days,
} from "@/lib/actions/general.action";

import HomeAnalyticsSection from "@/components/HomeAnalyticsSection";
import HighPayingJobsSection from "@/components/HighPayingJobsSection";
import NewsSection from "@/components/NewsSection";
import AllInterviewsSection from "@/components/AllInterviewsSection";

interface HomeProps {
  searchParams: Promise<{ page?: string }>;
}

async function Home({ searchParams }: HomeProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/sign-in');
  }

  // Record daily login when user visits the home page
  await recordDailyLogin(user.id);

  const [userInterviews, allInterview, feedbacks] = await Promise.all([
    getInterviewsByUserId(user?.id!),
    getLatestInterviews({ userId: user?.id! }),
    getUserFeedbackForPast5Days(user?.id!),
  ]);

  // Combine both interview arrays and remove duplicates
  const combinedInterviews = [...(userInterviews || []), ...(allInterview || [])];
  const uniqueInterviews = combinedInterviews.filter((interview, index, self) => 
    index === self.findIndex(i => i.id === interview.id)
  );

  // Pagination logic
  const params = await searchParams;
  const currentPage = Math.max(1, parseInt(params.page || '1', 10));
  const itemsPerPage = 6;
  const totalPages = Math.max(1, Math.ceil(uniqueInterviews.length / itemsPerPage));
  
  // Ensure currentPage doesn't exceed totalPages
  const validCurrentPage = Math.min(currentPage, totalPages);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-primary-200/40 via-white to-primary-100/60 dark:from-dark-200 dark:via-dark-100 dark:to-dark-300 pb-24">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8 md:items-start">
        {/* Main Content Centered */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Hero Section */}
          <section id="hero-card" className="card-cta shadow-2xl rounded-3xl bg-white/80 dark:bg-dark-200/80 backdrop-blur-md border border-primary-200/30 flex flex-col md:flex-row items-center justify-between gap-10 px-10 py-14 mt-4 mx-auto max-w-5xl animate-fadeIn min-h-[420px]" style={{height: 'auto'}}>
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
                width={520}
                height={800}
                className="rounded-3xl shadow-2xl border-4 border-primary-200/30 animate-fadeIn"
                priority
              />
            </div>
          </section>

          {/* Divider */}
          <div className="w-full flex justify-center my-12">
            <div className="h-1 w-32 bg-gradient-to-r from-primary-200 via-primary-100 to-primary-200 rounded-full opacity-60" />
          </div>

          {/* All Interviews Section */}
          <AllInterviewsSection
            userInterviews={userInterviews || []}
            allInterviews={allInterview || []}
            userId={user?.id!}
            currentPage={validCurrentPage}
            totalPages={totalPages}
          />
        </div>
        {/* Right Analytics Section */}
        <aside className="w-full md:w-96 flex-shrink-0 md:mt-[2.5rem] md:h-full flex md:flex-col">
          <div className="w-full h-full">
            <HomeAnalyticsSection feedbacks={feedbacks || []} />
            <HighPayingJobsSection />
            <NewsSection />
          </div>
        </aside>
      </div>
    </div>
  );
}

export default Home;