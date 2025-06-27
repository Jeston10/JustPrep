"use client";
import { useEffect, useState } from "react";

interface Job {
  id: number;
  title: string;
  url: string;
  company_name: string;
  salary: string | null;
}

const JOBS_PER_PAGE = 5;

export default function HighPayingJobsSection() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    async function fetchJobs() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("https://remotive.com/api/remote-jobs?limit=50&category=software-dev");
        const data = await res.json();
        // Sort by highest salary if available, else by date
        const sorted = data.jobs.sort((a: Job, b: Job) => {
          if (a.salary && b.salary) {
            // Extract numbers from salary string
            const aNum = parseInt(a.salary.replace(/[^0-9]/g, "")) || 0;
            const bNum = parseInt(b.salary.replace(/[^0-9]/g, "")) || 0;
            return bNum - aNum;
          }
          return 0;
        });
        setJobs(sorted);
      } catch (err) {
        setError("Failed to fetch jobs. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    fetchJobs();
  }, []);

  const totalPages = Math.ceil(jobs.length / JOBS_PER_PAGE);
  const jobsToShow = jobs.slice((page - 1) * JOBS_PER_PAGE, page * JOBS_PER_PAGE);

  return (
    <div className="rounded-3xl bg-gradient-to-br from-[#181824]/90 via-[#1a1625]/80 to-[#181824]/90 border border-purple-500 shadow-xl p-6 mt-8 flex flex-col items-center">
      <h3 className="text-2xl font-extrabold text-purple-300 mb-4 tracking-tight drop-shadow-lg">High Paying Jobs</h3>
      {loading ? (
        <p className="text-white">Loading jobs...</p>
      ) : error ? (
        <p className="text-red-400">{error}</p>
      ) : (
        <>
          <ul className="w-full flex flex-col gap-4">
            {jobsToShow.map((job) => (
              <li key={job.id} className="bg-[#1a1625]/80 rounded-xl p-4 border border-purple-900 flex flex-col gap-1">
                <a href={job.url} target="_blank" rel="noopener noreferrer" className="text-lg font-bold text-purple-200 hover:underline">
                  {job.title}
                </a>
                <span className="text-white text-sm">{job.company_name}</span>
                {job.salary && <span className="text-purple-400 text-xs">{job.salary}</span>}
              </li>
            ))}
          </ul>
          <div className="flex gap-2 mt-6">
            <button
              className="px-3 py-1 rounded-lg bg-purple-700 text-white font-semibold disabled:opacity-40"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </button>
            <span className="text-white px-2">Page {page} of {totalPages}</span>
            <button
              className="px-3 py-1 rounded-lg bg-purple-700 text-white font-semibold disabled:opacity-40"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
} 