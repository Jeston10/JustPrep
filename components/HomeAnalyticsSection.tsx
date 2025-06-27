"use client";
import dynamic from "next/dynamic";

const AnalyticsChart = dynamic(() => import("@/components/AnalyticsChart"), { ssr: false });

interface Feedback {
  createdAt: string;
  totalScore: number;
}

export default function HomeAnalyticsSection({ feedbacks }: { feedbacks: Feedback[] }) {
  return (
    <div className="rounded-3xl bg-gradient-to-br from-[#181824]/90 via-[#1a1625]/80 to-[#181824]/90 border border-purple-500 shadow-xl p-6 flex flex-col items-center">
      <h3 className="text-2xl font-extrabold text-purple-300 mb-4 tracking-tight drop-shadow-lg">Your Interview Analytics</h3>
      <AnalyticsChart feedbacks={feedbacks || []} />
      <p className="text-base text-white mt-4 font-medium">Streak and scores for the past 7 days</p>
    </div>
  );
} 