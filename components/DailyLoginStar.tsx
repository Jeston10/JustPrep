"use client";
import { useEffect, useState } from "react";
import { FaStar, FaRegStar } from "react-icons/fa";

interface DailyLoginStarProps {
  userId: string;
}

export default function DailyLoginStar({ userId }: DailyLoginStarProps) {
  const [hasLoggedInToday, setHasLoggedInToday] = useState(false);
  const [loginStreak, setLoginStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkDailyLogin() {
      try {
        const [todayLogin, streak] = await Promise.all([
          fetch(`/api/daily-login/check?userId=${userId}`).then(res => res.json()),
          fetch(`/api/daily-login/streak?userId=${userId}`).then(res => res.json())
        ]);
        
        setHasLoggedInToday(todayLogin.hasLoggedInToday);
        setLoginStreak(streak.streak);
      } catch (error) {
        console.error("Error checking daily login:", error);
      } finally {
        setLoading(false);
      }
    }

    if (userId) {
      checkDailyLogin();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="rounded-3xl bg-gradient-to-br from-[#181824]/90 via-[#1a1625]/80 to-[#181824]/90 border border-purple-500 shadow-xl p-6 mt-8 flex flex-col items-center">
        <div className="animate-pulse">
          <div className="w-8 h-8 bg-purple-400 rounded-full mb-2"></div>
          <div className="w-24 h-4 bg-purple-400 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-gradient-to-br from-[#181824]/90 via-[#1a1625]/80 to-[#181824]/90 border border-purple-500 shadow-xl p-6 mt-8 flex flex-col items-center">
      <h3 className="text-2xl font-extrabold text-purple-300 mb-4 tracking-tight drop-shadow-lg">Daily Login</h3>
      
      <div className="flex flex-col items-center gap-3">
        {/* Star Icon with enhanced animation */}
        <div className={`text-6xl transition-all duration-700 ${hasLoggedInToday ? 'animate-bounce' : ''}`}>
          {hasLoggedInToday ? (
            <FaStar className="text-yellow-400 drop-shadow-lg filter drop-shadow-[0_0_10px_rgba(255,255,0,0.5)]" />
          ) : (
            <FaRegStar className="text-gray-400 hover:text-gray-300 transition-colors duration-300" />
          )}
        </div>
        
        {/* Status Text */}
        <p className={`text-lg font-semibold transition-colors duration-300 ${hasLoggedInToday ? 'text-green-400' : 'text-gray-400'}`}>
          {hasLoggedInToday ? 'Logged in today!' : 'Not logged in today'}
        </p>
        
        {/* Streak Information */}
        <div className="text-center">
          <p className="text-purple-200 text-sm">Current Streak</p>
          <p className="text-2xl font-bold text-purple-300">{loginStreak} days</p>
        </div>
        
        {/* Motivational Message */}
        {!hasLoggedInToday && (
          <p className="text-xs text-purple-400 text-center mt-2">
            Come back tomorrow to keep your streak alive!
          </p>
        )}
        
        {hasLoggedInToday && loginStreak > 1 && (
          <p className="text-xs text-green-400 text-center mt-2 animate-pulse">
            Amazing! You've logged in for {loginStreak} days in a row! 🔥
          </p>
        )}
        
        {hasLoggedInToday && loginStreak === 1 && (
          <p className="text-xs text-green-400 text-center mt-2">
            Great start! Keep it up! 💪
          </p>
        )}
      </div>
    </div>
  );
} 