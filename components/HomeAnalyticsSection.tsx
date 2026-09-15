"use client";
import dynamic from "next/dynamic";

const AnalyticsChart = dynamic(() => import("@/components/AnalyticsChart"), { ssr: false });

interface Feedback {
  createdAt: string;
  totalScore: number;
}

export default function HomeAnalyticsSection({ feedbacks }: { feedbacks: Feedback[] }) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-purple-500 bg-gradient-to-br from-[#181824]/90 via-[#1a1625]/80 to-[#181824]/90 p-6 shadow-xl">
      <h3 className="mb-4 text-2xl font-extrabold tracking-tight text-purple-300 drop-shadow-lg">
        Your Interview Analytics
      </h3>
      <AnalyticsChart feedbacks={feedbacks} />
      <p className="mt-4 text-base font-medium text-white">Streak and scores for the past 7 days</p>
    </div>
  );
}
