"use client";
import { useEffect, useState } from "react";

const quotes = [
  "Success is not the key to happiness. Happiness is the key to success. – Albert Schweitzer",
  "Choose a job you love, and you will never have to work a day in your life. – Confucius",
  "Opportunities don't happen, you create them. – Chris Grosser",
  "The future depends on what you do today. – Mahatma Gandhi",
  "Dreams are extremely important. You can't do it unless you imagine it. – George Lucas",
  "Don't watch the clock; do what it does. Keep going. – Sam Levenson",
  "The only way to do great work is to love what you do. – Steve Jobs",
  "Your time is limited, so don't waste it living someone else's life. – Steve Jobs",
  "Strive not to be a success, but rather to be of value. – Albert Einstein",
  "The best way to predict the future is to create it. – Peter Drucker",
];

export default function DynamicCareerQuote() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % quotes.length);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto mt-4 mb-6 px-6 py-3 bg-gray-900 text-primary-100 border border-primary-200 rounded-xl shadow-lg text-center text-lg font-semibold animate-fadeIn">
      <span className="block">{quotes[index]}</span>
    </div>
  );
} 