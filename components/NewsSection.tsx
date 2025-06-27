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
        const apiKey = process.env.NEXT_PUBLIC_GNEWS_API_KEY;
        const res = await fetch(
          `https://gnews.io/api/v4/top-headlines?category=technology&lang=en&max=28&apikey=${apiKey}`
        );
        const data = await res.json();
        setArticles(data.articles || []);
      } catch (err) {
        setError("Failed to fetch news. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    fetchNews();
  }, []);

  const totalPages = Math.ceil(articles.length / NEWS_PER_PAGE);
  const articlesToShow = articles.slice((page - 1) * NEWS_PER_PAGE, page * NEWS_PER_PAGE);

  return (
    <div className="rounded-3xl bg-gradient-to-br from-[#181824]/90 via-[#1a1625]/80 to-[#181824]/90 border border-purple-500 shadow-xl p-6 mt-8 flex flex-col items-center">
      <h3 className="text-2xl font-extrabold text-purple-300 mb-4 tracking-tight drop-shadow-lg">News</h3>
      {loading ? (
        <p className="text-white">Loading news...</p>
      ) : error ? (
        <p className="text-red-400">{error}</p>
      ) : (
        <>
          <ul className="w-full flex flex-col gap-4">
            {articlesToShow.map((article, idx) => (
              <li key={idx} className="bg-[#1a1625]/80 rounded-xl p-4 border border-purple-900 flex flex-col gap-1">
                <a href={article.url} target="_blank" rel="noopener noreferrer" className="text-lg font-bold text-purple-200 hover:underline">
                  {article.title}
                </a>
                <span className="text-white text-xs">{article.source?.name || "Unknown Source"}</span>
                <span className="text-purple-400 text-xs">{new Date(article.publishedAt).toLocaleString()}</span>
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