"use client";
import { useEffect, useState } from "react";

interface NewsArticle {
  title: string;
  url: string;
  source: { name: string };
  publishedAt: string;
}

const NEWS_PER_PAGE = 7;

export default function NewsSection() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    async function fetchNews() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/news");
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = (await res.json()) as { articles?: NewsArticle[] };
        setArticles(data.articles ?? []);
      } catch {
        setError("Failed to fetch news. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    void fetchNews();
  }, []);

  const totalPages = Math.ceil(articles.length / NEWS_PER_PAGE);
  const articlesToShow = articles.slice((page - 1) * NEWS_PER_PAGE, page * NEWS_PER_PAGE);

  return (
    <div className="mt-8 flex flex-col items-center rounded-3xl border border-purple-500 bg-gradient-to-br from-[#181824]/90 via-[#1a1625]/80 to-[#181824]/90 p-6 shadow-xl">
      <h3 className="mb-4 text-2xl font-extrabold tracking-tight text-purple-300 drop-shadow-lg">
        News
      </h3>
      {loading ? (
        <p className="text-white">Loading news...</p>
      ) : error ? (
        <p className="text-red-400">{error}</p>
      ) : (
        <>
          <ul className="flex w-full flex-col gap-4">
            {articlesToShow.map((article, idx) => (
              <li
                key={idx}
                className="flex flex-col gap-1 rounded-xl border border-purple-900 bg-[#1a1625]/80 p-4"
              >
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lg font-bold text-purple-200 hover:underline"
                >
                  {article.title}
                </a>
                <span className="text-xs text-white">
                  {article.source.name || "Unknown Source"}
                </span>
                <span className="text-xs text-purple-400">
                  {new Date(article.publishedAt).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex gap-2">
            <button
              className="rounded-lg bg-purple-700 px-3 py-1 font-semibold text-white disabled:opacity-40"
              onClick={() => {
                setPage((p) => Math.max(1, p - 1));
              }}
              disabled={page === 1}
            >
              Previous
            </button>
            <span className="px-2 text-white">
              Page {page} of {totalPages}
            </span>
            <button
              className="rounded-lg bg-purple-700 px-3 py-1 font-semibold text-white disabled:opacity-40"
              onClick={() => {
                setPage((p) => Math.min(totalPages, p + 1));
              }}
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
