import dayjs from "dayjs";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";

import { getCurrentUser } from "@/lib/actions/auth.action";
import { getFeedbackByInterviewId, getInterviewById } from "@/lib/actions/general.action";

const Feedback = async ({ params }: RouteParams<{ id: string }>) => {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const interview = await getInterviewById(id);
  if (!interview) redirect("/");

  const feedback = await getFeedbackByInterviewId({
    interviewId: id,
    userId: user.id,
  });

  return (
    <section className="section-feedback">
      <div className="flex flex-row justify-center">
        <h1 className="text-4xl font-semibold">
          Feedback on the Interview - <span className="capitalize">{interview.role}</span> Interview
        </h1>
      </div>

      <div className="flex flex-row justify-center">
        <div className="flex flex-row gap-5">
          {/* Overall Impression */}
          <div className="flex flex-row items-center gap-2">
            <Image src="/star.svg" width={22} height={22} alt="star" />
            <p>
              Overall Impression:{" "}
              <span className="font-bold text-primary-200">{feedback?.totalScore}</span>
              /100
            </p>
          </div>

          {/* Date */}
          <div className="flex flex-row gap-2">
            <Image src="/calendar.svg" width={22} height={22} alt="calendar" />
            <p>
              {feedback?.createdAt ? dayjs(feedback.createdAt).format("MMM D, YYYY h:mm A") : "N/A"}
            </p>
          </div>
        </div>
      </div>

      <hr />

      <p>{feedback?.finalAssessment}</p>

      {/* Interview Breakdown */}
      <div className="flex flex-col gap-4">
        <h2>Breakdown of the Interview:</h2>
        {feedback?.categoryScores.map((category, index) => (
          <div key={index}>
            <p className="font-bold">
              {index + 1}. {category.name} ({category.score}/100)
            </p>
            <p>{category.comment}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <h3>Strengths</h3>
        <ul>
          {feedback?.strengths.map((strength, index) => (
            <li key={index}>{strength}</li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-3">
        <h3>Areas for Improvement</h3>
        <ul>
          {feedback?.areasForImprovement.map((area, index) => (
            <li key={index}>{area}</li>
          ))}
        </ul>
      </div>

      {/* Links to Practice Section */}
      <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-green-600 bg-neutral-900 p-4">
        <h3 className="mb-2 text-lg font-bold text-green-400">Links to Practice</h3>
        <ul className="list-inside list-disc space-y-1">
          <li>
            <a
              href="https://www.coursera.org/learn/wharton-communication-skills"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-300 underline hover:text-green-400"
            >
              Communication Skills
            </a>
          </li>
          <li>
            <a
              href="https://www.interviewbit.com/technical-interview-questions/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-300 underline hover:text-green-400"
            >
              Technical Knowledge
            </a>
          </li>
          <li>
            <a
              href="https://leetcode.com/problemset/all/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-300 underline hover:text-green-400"
            >
              Problem Solving
            </a>
          </li>
          <li>
            <a
              href="https://www.indeed.com/career-advice/interviewing/cultural-fit-interview-questions"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-300 underline hover:text-green-400"
            >
              Cultural Fit
            </a>
          </li>
          <li>
            <a
              href="https://www.topinterview.com/interview-advice/confidence-in-job-interviews"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-300 underline hover:text-green-400"
            >
              Confidence and Clarity
            </a>
          </li>
        </ul>
      </div>

      <div className="buttons">
        <Button className="btn-secondary flex-1">
          <Link href="/" className="flex w-full justify-center">
            <p className="text-center text-sm font-semibold text-primary-200">Back to dashboard</p>
          </Link>
        </Button>

        <Button className="btn-primary flex-1">
          <Link href={`/interview/${id}`} className="flex w-full justify-center">
            <p className="text-center text-sm font-semibold text-black">Retake Interview</p>
          </Link>
        </Button>
      </div>
    </section>
  );
};

export default Feedback;
