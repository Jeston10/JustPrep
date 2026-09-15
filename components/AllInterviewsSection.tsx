import InterviewCard from "./InterviewCard";
import PaginationControls from "./PaginationControls";

interface Interview {
  id: string;
  role: string;
  type: string;
  techstack: string[];
  createdAt?: string;
}

interface AllInterviewsSectionProps {
  userInterviews: Interview[];
  allInterviews: Interview[];
  userId: string;
  currentPage: number;
  totalPages: number;
}

export default function AllInterviewsSection({
  userInterviews,
  allInterviews,
  userId,
  currentPage,
  totalPages,
}: AllInterviewsSectionProps) {
  // Combine both interview arrays
  const combinedInterviews = [...userInterviews, ...allInterviews];

  // Remove duplicates based on interview ID
  const uniqueInterviews = combinedInterviews.filter(
    (interview, index, self) => index === self.findIndex((i) => i.id === interview.id),
  );

  // Sort by creation date (newest first)
  const sortedInterviews = uniqueInterviews.sort((a, b) => {
    const dateA = new Date(a.createdAt ?? 0).getTime();
    const dateB = new Date(b.createdAt ?? 0).getTime();
    return dateB - dateA;
  });

  const itemsPerPage = 6;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageInterviews = sortedInterviews.slice(startIndex, endIndex);

  return (
    <section
      id="all-interviews-section"
      className="mx-auto mt-8 flex max-w-5xl animate-fadeIn flex-col gap-6"
    >
      <div className="mb-2 flex items-center gap-3">
        <div className="h-8 w-2 rounded-full bg-primary-200" />
        <h2 className="text-2xl font-bold tracking-tight text-primary-100 md:text-3xl">
          All Interviews
        </h2>
      </div>

      <div className="interviews-section">
        {currentPageInterviews.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {currentPageInterviews.map((interview) => (
                <InterviewCard
                  key={interview.id}
                  userId={userId}
                  interviewId={interview.id}
                  role={interview.role}
                  type={interview.type}
                  techstack={interview.techstack}
                  createdAt={interview.createdAt}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                sectionId="all-interviews-section"
              />
            )}
          </>
        ) : (
          <p className="text-lg text-light-400">No interviews available</p>
        )}
      </div>
    </section>
  );
}
