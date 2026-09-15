"use client";
import { useCallback, useEffect, useState } from "react";
import { FaStar, FaRegStar } from "react-icons/fa";

interface CheckResponse {
  success: boolean;
  hasLoggedInToday: boolean;
}

interface StreakResponse {
  success: boolean;
  streak: number;
}

interface DailyLoginStarProps {
  userId: string;
  initialHasLoggedInToday?: boolean;
  initialStreak?: number;
}

export default function DailyLoginStar({
  userId,
  initialHasLoggedInToday = false,
  initialStreak = 0,
}: DailyLoginStarProps) {
  const [hasLoggedInToday, setHasLoggedInToday] = useState(initialHasLoggedInToday);
  const [loginStreak, setLoginStreak] = useState(initialStreak);
  const [error, setError] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  // Fetch in the background, but never show a loading state
  const checkDailyLogin = useCallback(async () => {
    if (!userId) return;
    try {
      setError(null);
      const [todayLoginResponse, streakResponse] = await Promise.all([
        fetch(`/api/daily-login/check?userId=${userId}`),
        fetch(`/api/daily-login/streak?userId=${userId}`),
      ]);
      if (!todayLoginResponse.ok || !streakResponse.ok)
        throw new Error("Failed to fetch daily login data");
      const [todayLogin, streak] = (await Promise.all([
        todayLoginResponse.json(),
        streakResponse.json(),
      ])) as [CheckResponse, StreakResponse];
      if (todayLogin.success && streak.success) {
        setHasLoggedInToday(todayLogin.hasLoggedInToday);
        setLoginStreak(streak.streak);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch {
      setError("Failed to load login data");
    }
  }, [userId]);

  useEffect(() => {
    void checkDailyLogin();
    // Refresh in the background every 5 minutes
    const interval = setInterval(() => void checkDailyLogin(), 5 * 60 * 1000);
    return () => {
      clearInterval(interval);
    };
  }, [checkDailyLogin]);

  // Always show the star, never a loading dot
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
      {/* Tooltip and error handling as before */}
      {showTooltip && (
        <div className="absolute top-full left-0 z-50 mt-2 w-64 rounded-xl border border-purple-500 bg-[#1a1625]/95 p-4 shadow-xl backdrop-blur-md">
          <h4 className="mb-2 text-lg font-bold text-purple-300">Daily Login Status</h4>
          <div className="space-y-2">
            {error ? (
              <div className="text-sm text-red-400">
                {error}
                <button
                  onClick={() => void checkDailyLogin()}
                  className="ml-2 text-purple-400 underline hover:text-purple-300"
                >
                  Retry
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm ${hasLoggedInToday ? "text-green-400" : "text-gray-400"}`}
                  >
                    {hasLoggedInToday ? "✅ Logged in today!" : "❌ Not logged in today"}
                  </span>
                </div>
                <div className="border-t border-purple-700 pt-2">
                  <p className="text-sm text-purple-200">Current Streak</p>
                  <p className="text-xl font-bold text-purple-300">{loginStreak} days</p>
                </div>
                {!hasLoggedInToday && (
                  <p className="mt-2 text-xs text-purple-400">
                    Come back tomorrow to keep your streak alive!
                  </p>
                )}
                {hasLoggedInToday && loginStreak > 1 && (
                  <p className="mt-2 animate-pulse text-xs text-green-400">
                    Amazing! You&apos;ve logged in for {loginStreak} days in a row! 🔥
                  </p>
                )}
                {hasLoggedInToday && loginStreak === 1 && (
                  <p className="mt-2 text-xs text-green-400">Great start! Keep it up! 💪</p>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
