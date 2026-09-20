"use client";
import { useState } from "react";
import { FaStar, FaRegStar } from "react-icons/fa";

// Legacy streak widget; data arrives from the (root) layout via the session user. Removed in P3.5.
interface DailyLoginStarProps {
  hasLoggedInToday: boolean;
  loginStreak: number;
}

export default function DailyLoginStar({ hasLoggedInToday, loginStreak }: DailyLoginStarProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative">
      <div
        className={`cursor-pointer text-4xl transition-all duration-700 ${
          hasLoggedInToday ? "animate-bounce" : ""
        }`}
        onMouseEnter={() => {
          setShowTooltip(true);
        }}
        onMouseLeave={() => {
          setShowTooltip(false);
        }}
      >
        {hasLoggedInToday ? (
          <FaStar className="text-yellow-400 drop-shadow-[0_0_10px_rgba(255,255,0,0.5)] drop-shadow-lg filter" />
        ) : (
          <FaRegStar className="text-gray-400 transition-colors duration-300 hover:text-gray-300" />
        )}
      </div>
      {showTooltip && (
        <div className="absolute top-full left-0 z-50 mt-2 w-64 rounded-xl border border-purple-500 bg-[#1a1625]/95 p-4 shadow-xl backdrop-blur-md">
          <h4 className="mb-2 text-lg font-bold text-purple-300">Daily Login Status</h4>
          <div className="space-y-2">
            <span className={`text-sm ${hasLoggedInToday ? "text-green-400" : "text-gray-400"}`}>
              {hasLoggedInToday ? "Logged in today" : "Not logged in today"}
            </span>
            <div className="border-t border-purple-700 pt-2">
              <p className="text-sm text-purple-200">Current Streak</p>
              <p className="text-xl font-bold text-purple-300">{loginStreak} days</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
