"use client";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FiLogOut, FiTrash2, FiSettings } from "react-icons/fi";
import { toast } from "sonner";

import { auth } from "@/firebase/client";

export default function SettingsMenu() {
  const [open, setOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      // Sign out from Firebase client
      await signOut(auth);

      // Call server-side signOut to clear session cookie
      const response = await fetch("/api/auth/signout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        router.push("/sign-in");
        toast.success("Logged out successfully.");
      } else {
        throw new Error("Failed to clear session");
      }
    } catch {
      toast.error("Failed to log out.");
    }
  };

  const handleDeleteAccount = () => {
    setShowDeleteConfirm(false);
    // TODO: Implement delete account logic
    toast("Delete account feature coming soon.");
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
      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="flex w-full max-w-sm animate-fadeIn flex-col items-center gap-6 rounded-2xl bg-white p-8 shadow-2xl dark:bg-dark-200">
            <FiTrash2 className="mb-2 text-4xl text-red-600" />
            <h3 className="text-xl font-bold text-red-600">Delete Account?</h3>
            <p className="text-center text-gray-700 dark:text-primary-100">
              This action is <b>permanent</b> and cannot be undone. Are you sure you want to delete
              your account?
            </p>
            <div className="mt-2 flex w-full gap-4">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                }}
                className="dark:hover:bg-dark-400 flex-1 rounded-lg bg-gray-200 py-2 font-semibold text-gray-800 transition hover:bg-gray-300 dark:bg-dark-300 dark:text-primary-100"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="flex-1 rounded-lg bg-red-600 py-2 font-semibold text-white transition hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
