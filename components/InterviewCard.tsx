import dayjs from "dayjs";
import Image from "next/image";
import Link from "next/link";

import { getFeedbackByInterviewId } from "@/lib/actions/general.action";
import { cn, getRandomInterviewCover } from "@/lib/utils";

import DisplayTechIcons from "./DisplayTechIcons";
import { Button } from "./ui/button";

interface InterviewCardProps {
  interviewId?: string | undefined;
  userId?: string | undefined;
  role: string;
  type: string;
  techstack: string[];
  createdAt?: string | undefined;
}

const InterviewCard = async ({
  interviewId,
  userId,
  role,
  type,
  techstack,
  createdAt,
}: InterviewCardProps) => {
  const feedback =
    userId && interviewId
      ? await getFeedbackByInterviewId({
          interviewId,
          userId,
        })
      : null;

  const normalizedType = /mix/i.test(type) ? "Mixed" : type;

  const badgeColor =
    {
      Behavioral: "bg-light-400",
      Mixed: "bg-light-600",
      Technical: "bg-light-800",
    }[normalizedType] ?? "bg-light-600";

  const cardDate = feedback?.createdAt ?? createdAt;
  const formattedDate = cardDate ? dayjs(cardDate).format("MMM D, YYYY") : "—";

  return (
    <div className="card-border min-h-96 w-[360px] max-sm:w-full">
      <div className="card-interview">
        <div>
          {/* Type Badge */}
          <div className={cn("absolute top-0 right-0 w-fit rounded-bl-lg px-4 py-2", badgeColor)}>
            <p className="badge-text">{normalizedType}</p>
          </div>

          {/* Cover Image */}
          <Image
            src={getRandomInterviewCover()}
            alt="cover-image"
            width={90}
            height={90}
            className="object-fit size-[90px] rounded-full"
          />

          {/* Interview Role */}
          <h3 className="mt-5 capitalize">{role} Interview</h3>

          {/* Date & Score */}
          <div className="mt-3 flex flex-row gap-5">
            <div className="flex flex-row gap-2">
              <Image src="/calendar.svg" width={22} height={22} alt="calendar" />
              <p>{formattedDate}</p>
            </div>

            <div className="flex flex-row items-center gap-2">
              <Image src="/star.svg" width={22} height={22} alt="star" />
              <p>{feedback?.totalScore ?? "---"}/100</p>
            </div>
          </div>

          {/* Feedback or Placeholder Text */}
          <p className="mt-5 line-clamp-2">
            {feedback?.finalAssessment ??
              "You haven't taken this interview yet. Take it now to improve your skills."}
          </p>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-light-100">Required Tech:</span>
            <DisplayTechIcons techStack={techstack} iconSize={32} maxIcons={5} />
          </div>
          <div className="mt-2 flex justify-end">
            <Button className="btn-primary">
              <Link
                href={feedback ? `/interview/${interviewId}/feedback` : `/interview/${interviewId}`}
              >
                {feedback ? "Check Feedback" : "View Interview"}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewCard;
