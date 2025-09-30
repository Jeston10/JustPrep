"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { auth } from '@/firebase/client';
import { signOut } from 'firebase/auth';
import { FiLogOut, FiTrash2, FiSettings } from 'react-icons/fi';

export default function SettingsMenu() {
  const [open, setOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      // Sign out from Firebase client
      await signOut(auth);
      
      // Call server-side signOut to clear session cookie
      const response = await fetch('/api/auth/signout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        router.push('/sign-in');
        toast.success('Logged out successfully.');
      } else {
        throw new Error('Failed to clear session');
      }
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to log out.');
    }
  };

  const handleDeleteAccount = async () => {
    setShowDeleteConfirm(false);
    // TODO: Implement delete account logic
    toast('Delete account feature coming soon.');
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 font-bold text-primary-100 px-4 py-2 rounded-full hover:bg-primary-200/20 transition"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Settings"
      >
        <FiSettings className="text-xl" />
        <span className="hidden sm:inline">Settings</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-dark-200 border border-gray-200 dark:border-dark-300 rounded-xl shadow-xl z-50 animate-fadeIn">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full text-left px-5 py-3 text-base text-gray-800 dark:text-primary-100 hover:bg-primary-200/20 rounded-t-xl transition"
          >
            <FiLogOut className="text-lg" />
            Log Out
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-3 w-full text-left px-5 py-3 text-base text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded-b-xl transition"
          >
            <FiTrash2 className="text-lg" />
            Delete Account
          </button>
        </div>
      )}
      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-dark-200 rounded-2xl shadow-2xl p-8 max-w-sm w-full flex flex-col items-center gap-6 animate-fadeIn">
            <FiTrash2 className="text-4xl text-red-600 mb-2" />
            <h3 className="text-xl font-bold text-red-600">Delete Account?</h3>
            <p className="text-center text-gray-700 dark:text-primary-100">This action is <b>permanent</b> and cannot be undone. Are you sure you want to delete your account?</p>
            <div className="flex gap-4 w-full mt-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 rounded-lg bg-gray-200 dark:bg-dark-300 text-gray-800 dark:text-primary-100 font-semibold hover:bg-gray-300 dark:hover:bg-dark-400 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="flex-1 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition"
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