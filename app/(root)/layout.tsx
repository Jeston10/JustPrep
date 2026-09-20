import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { type ReactNode } from "react";
import { FaLinkedin, FaInstagram, FaGithub } from "react-icons/fa";
import { FiHome, FiUser } from "react-icons/fi";

import { getCurrentUser } from "@/server/auth/session";
import { calendarDate, recordDailyLogin } from "@/server/services/streak.service";

import AIChatbot from "@/components/AIChatbot";
import DailyLoginStar from "@/components/DailyLoginStar";
import DynamicCareerQuote from "@/components/DynamicCareerQuote";
import LiveDateTime from "@/components/LiveDateTime";
import SettingsMenu from "@/components/SettingsMenu";

// Every route under (root) requires a session; the cookie is verified once per request
// (React.cache) so pages below can call getCurrentUser() freely.
const Rootlayout = async ({ children }: { children: ReactNode }) => {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  // First authenticated request of the day records the login (best-effort; no write when already
  // recorded). Streak widget is removed in P3.5.
  await recordDailyLogin(user.id);
  const hasLoggedInToday = user.lastLoginDate === calendarDate(new Date());
  const streak = user.loginStreak ?? 0;

  // Restore to simple layout
  return (
    <div className="root-layout">
      <nav className="mb-8 flex flex-col items-center">
        <div className="mb-2 flex w-full items-center gap-4">
          {/* Live DateTime at the very left */}
          <LiveDateTime />
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.svg" alt="logo" height={32} width={38} />
            <h2 className="text-primary-100">JustPrep</h2>
          </Link>
          {/* Daily Login Star next to JustPrep */}
          <DailyLoginStar hasLoggedInToday={hasLoggedInToday} loginStreak={streak} />
          <DynamicCareerQuote />
        </div>
        <div className="mt-2 flex items-center gap-2">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-full px-4 py-2 font-bold text-primary-100 transition hover:bg-primary-200/20"
            aria-label="Home"
          >
            <FiHome className="text-xl" />
            <span className="hidden sm:inline">Home</span>
          </Link>
          <Link
            href="/profile"
            className="flex items-center gap-2 rounded-full px-4 py-2 font-bold text-primary-100 transition hover:bg-primary-200/20"
            aria-label="Profile"
          >
            <FiUser className="text-xl" />
            <span className="hidden sm:inline">Profile</span>
          </Link>
          <SettingsMenu />
        </div>
      </nav>
      {children}
      <footer className="mt-16 flex flex-col items-center gap-1 border-t border-primary-200/30 py-8 text-center text-sm text-light-400">
        <span>&copy; {new Date().getFullYear()} JustPrep™. All rights reserved.</span>
        <span>
          Contact:{" "}
          <a href="mailto:sjestonsingh@gmail.com" className="underline hover:text-primary-100">
            sjestonsingh@gmail.com
          </a>
        </span>
        <span>
          Created by <b>S.Jeston Singh</b>
        </span>
        <div className="mt-3 flex gap-4">
          <a
            href="https://www.linkedin.com/in/jeston-singh/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            className="text-2xl text-white transition-colors hover:text-purple-400"
          >
            <FaLinkedin />
          </a>
          <a
            href="https://www.instagram.com/_just_shut_da_fuk_up_/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="text-2xl text-white transition-colors hover:text-purple-400"
          >
            <FaInstagram />
          </a>
          <a
            href="https://github.com/Jeston10"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="text-2xl text-white transition-colors hover:text-purple-400"
          >
            <FaGithub />
          </a>
        </div>
      </footer>
      <AIChatbot />
    </div>
  );
};

export default Rootlayout;
