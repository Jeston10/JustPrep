"use client";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FiLogOut, FiTrash2, FiSettings } from "react-icons/fi";
import { toast } from "sonner";

import DangerZone from "@/features/account/components/DangerZone";
import { signOut as signOutServer } from "@/features/auth/actions";

import { auth } from "@/firebase/client";

import { resetUser } from "@/lib/observability/client";

export default function SettingsMenu() {
  const [open, setOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      // Sign out from Firebase client
      await signOut(auth);

      // Server action clears the session cookie and revokes refresh tokens.
      const result = await signOutServer();
      if (!result.success) throw new Error("Failed to clear session");
      resetUser();
      router.push("/sign-in");
      toast.success("Logged out successfully.");
    } catch {
      toast.error("Failed to log out.");
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => {
          setOpen((v) => !v);
        }}
        className="flex items-center gap-2 rounded-full px-4 py-2 font-bold text-primary-100 transition hover:bg-primary-200/20"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Settings"
      >
        <FiSettings className="text-xl" />
        <span className="hidden sm:inline">Settings</span>
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-56 animate-fadeIn rounded-xl border border-gray-200 bg-white shadow-xl dark:border-dark-300 dark:bg-dark-200">
          <button
            onClick={() => void handleLogout()}
            className="flex w-full items-center gap-3 rounded-t-xl px-5 py-3 text-left text-base text-gray-800 transition hover:bg-primary-200/20 dark:text-primary-100"
          >
            <FiLogOut className="text-lg" />
            Log Out
          </button>
          <button
            onClick={() => {
              setShowDeleteConfirm(true);
            }}
            className="flex w-full items-center gap-3 rounded-b-xl px-5 py-3 text-left text-base text-red-600 transition hover:bg-red-100 dark:hover:bg-red-900"
          >
            <FiTrash2 className="text-lg" />
            Delete Account
          </button>
        </div>
      )}
      {showDeleteConfirm && (
        <DangerZone
          onClose={() => {
            setShowDeleteConfirm(false);
          }}
        />
      )}
    </div>
  );
}
