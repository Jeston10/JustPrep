import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/server/auth/session";

import AllInterviewsSection from "@/components/AllInterviewsSection";
import HighPayingJobsSection from "@/components/HighPayingJobsSection";
import HomeAnalyticsSection from "@/components/HomeAnalyticsSection";
import NewsSection from "@/components/NewsSection";
import { Button } from "@/components/ui/button";

import {
  getInterviewsByUserId,
  getLatestInterviews,
  getUserFeedbackForPast5Days,
} from "@/lib/actions/general.action";

interface HomeProps {
  searchParams: Promise<{ page?: string }>;
}

async function Home({ searchParams }: HomeProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in");
  }

  const [userInterviews, allInterview, feedbacks] = await Promise.all([
    getInterviewsByUserId(user.id),
    getLatestInterviews({ userId: user.id }),
    getUserFeedbackForPast5Days(user.id),
  ]);

  // Combine both interview arrays and remove duplicates
  const combinedInterviews = [...(userInterviews ?? []), ...(allInterview ?? [])];
  const uniqueInterviews = combinedInterviews.filter(
    (interview, index, self) => index === self.findIndex((i) => i.id === interview.id),
  );

  // Pagination logic
  const params = await searchParams;
  const currentPage = Math.max(1, parseInt(params.page ?? "1", 10));
  const itemsPerPage = 6;
  const totalPages = Math.max(1, Math.ceil(uniqueInterviews.length / itemsPerPage));

  // Ensure currentPage doesn't exceed totalPages
  const validCurrentPage = Math.min(currentPage, totalPages);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-primary-200/40 via-white to-primary-100/60 pb-24 dark:from-dark-200 dark:via-dark-100 dark:to-dark-300">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 md:flex-row md:items-start">
        {/* Main Content Centered */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Hero Section */}
          <section
            id="hero-card"
            className="card-cta mx-auto mt-4 flex min-h-[420px] max-w-5xl animate-fadeIn flex-col items-center justify-between gap-10 rounded-3xl border border-primary-200/30 bg-white/80 px-10 py-14 shadow-2xl backdrop-blur-md md:flex-row dark:bg-dark-200/80"
            style={{ height: "auto" }}
          >
            <div className="flex max-w-lg flex-col gap-6">
              <h1 className="mb-2 text-4xl leading-tight font-extrabold text-primary-100 md:text-5xl">
                Get Interview-Ready with <span className="text-primary-200">AI-Powered</span>{" "}
                Practice & Feedback
              </h1>
              <p className="mb-4 text-xl text-light-400">
                Practice real interview questions & get instant feedback. Level up your skills and
                confidence for your dream job!
              </p>
              <Button
                asChild
                className="btn-primary shadow-lg transition-transform duration-200 hover:scale-105 max-sm:w-full"
              >
                <Link href="/interview">Start an Interview</Link>
              </Button>
            </div>
            <div className="flex flex-col items-center justify-center">
              <Image
                src="/robot.png"
                alt="robo-dude"
                width={520}
                height={800}
                className="animate-fadeIn rounded-3xl border-4 border-primary-200/30 shadow-2xl"
                priority
              />
            </div>
          </section>

          {/* Divider */}
          <div className="my-12 flex w-full justify-center">
            <div className="h-1 w-32 rounded-full bg-gradient-to-r from-primary-200 via-primary-100 to-primary-200 opacity-60" />
          </div>

          {/* All Interviews Section */}
          <AllInterviewsSection
            userInterviews={userInterviews ?? []}
            allInterviews={allInterview ?? []}
            userId={user.id}
            currentPage={validCurrentPage}
            totalPages={totalPages}
          />
        </div>
        {/* Right Analytics Section */}
        <aside className="flex w-full flex-shrink-0 md:mt-[2.5rem] md:h-full md:w-96 md:flex-col">
          <div className="h-full w-full">
            <HomeAnalyticsSection feedbacks={feedbacks} />
            <HighPayingJobsSection />
            <NewsSection />
          </div>
        </aside>
      </div>
    </div>
  );
}

export default Home;
