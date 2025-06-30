"use client";
import { useEffect, useState } from "react";
import { FaStar, FaRegStar } from "react-icons/fa";

interface DailyLoginStarProps {
  userId: string;
  initialHasLoggedInToday?: boolean;
  initialStreak?: number;
}

export default function DailyLoginStar({ 
  userId, 
  initialHasLoggedInToday = false, 
  initialStreak = 0 
}: DailyLoginStarProps) {
  const [hasLoggedInToday, setHasLoggedInToday] = useState(initialHasLoggedInToday);
  const [loginStreak, setLoginStreak] = useState(initialStreak);
  const [loading, setLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkDailyLogin = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const [todayLoginResponse, streakResponse] = await Promise.all([
        fetch(`/api/daily-login/check?userId=${userId}`),
        fetch(`/api/daily-login/streak?userId=${userId}`)
      ]);

      if (!todayLoginResponse.ok || !streakResponse.ok) {
        throw new Error('Failed to fetch daily login data');
      }

      const [todayLogin, streak] = await Promise.all([
        todayLoginResponse.json(),
        streakResponse.json()
      ]);
      
      if (todayLogin.success && streak.success) {
        setHasLoggedInToday(todayLogin.hasLoggedInToday);
        setLoginStreak(streak.streak);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error("Error checking daily login:", error);
      setError('Failed to load login data');
      // Keep existing values on error instead of resetting
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch if we don't have initial data
    if (userId && !initialHasLoggedInToday && !initialStreak) {
      checkDailyLogin();
    }
  }, [userId, initialHasLoggedInToday, initialStreak]);

  // Refresh data every 30 seconds to ensure it stays updated
  useEffect(() => {
    if (userId) {
      const interval = setInterval(checkDailyLogin, 30000);
      return () => clearInterval(interval);
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="relative">
        <div className="w-12 h-12 bg-purple-400/20 rounded-full animate-pulse flex items-center justify-center">
          <div className="w-6 h-6 bg-purple-400 rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Star Icon */}
      <div 
        className={`text-4xl transition-all duration-700 cursor-pointer ${
          hasLoggedInToday ? 'animate-bounce' : ''
        }`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {hasLoggedInToday ? (
          <FaStar className="text-yellow-400 drop-shadow-lg filter drop-shadow-[0_0_10px_rgba(255,255,0,0.5)]" />
        ) : (
          <FaRegStar className="text-gray-400 hover:text-gray-300 transition-colors duration-300" />
        )}
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-[#1a1625]/95 border border-purple-500 rounded-xl p-4 shadow-xl backdrop-blur-md z-50">
          <h4 className="text-lg font-bold text-purple-300 mb-2">Daily Login Status</h4>
          
          <div className="space-y-2">
            {error ? (
              <div className="text-red-400 text-sm">
                {error}
                <button 
                  onClick={checkDailyLogin}
                  className="ml-2 text-purple-400 hover:text-purple-300 underline"
                >
                  Retry
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${hasLoggedInToday ? 'text-green-400' : 'text-gray-400'}`}>
                    {hasLoggedInToday ? '✅ Logged in today!' : '❌ Not logged in today'}
                  </span>
                </div>
                
                <div className="border-t border-purple-700 pt-2">
                  <p className="text-purple-200 text-sm">Current Streak</p>
                  <p className="text-xl font-bold text-purple-300">{loginStreak} days</p>
                </div>
                
                {/* Motivational Message */}
                {!hasLoggedInToday && (
                  <p className="text-xs text-purple-400 mt-2">
                    Come back tomorrow to keep your streak alive!
                  </p>
                )}
                
                {hasLoggedInToday && loginStreak > 1 && (
                  <p className="text-xs text-green-400 mt-2 animate-pulse">
                    Amazing! You've logged in for {loginStreak} days in a row! 🔥
                  </p>
                )}
                
                {hasLoggedInToday && loginStreak === 1 && (
                  <p className="text-xs text-green-400 mt-2">
                    Great start! Keep it up! 💪
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 