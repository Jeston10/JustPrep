"use client";
import { useEffect, useState } from "react";

const QUOTE_API = "https://api.quotable.io/random";

export default function DynamicQuote() {
  const [quote, setQuote] = useState<string>("");
  const [author, setAuthor] = useState<string>("");

  const fetchQuote = async () => {
    try {
      const res = await fetch(QUOTE_API);
      const data = await res.json();
      setQuote(data.content);
      setAuthor(data.author);
    } catch {
      setQuote("Inspiration is everywhere. JustPrep for it!");
      setAuthor("");
    }
  };

  useEffect(() => {
    fetchQuote();
    const interval = setInterval(fetchQuote, 5 * 60 * 1000); // 5 minutes
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-primary-200/10 rounded-xl px-4 py-2 shadow-sm max-w-xs md:max-w-md ml-2 flex flex-col items-start border-l-4 border-primary-200">
      <span className="mb-1 text-base md:text-lg font-semibold leading-snug text-primary-100 font-sans">
        {quote}
      </span>
      {author && (
        <span className="text-xs md:text-sm text-light-400 mt-1 self-end italic font-serif font-medium">
          — {author}
        </span>
      )}
    </div>
  );
} 