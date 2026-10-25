"use client";

// Export and deletion UI (docs/SECURITY.md §2.11). Deletion is deliberately slow: the user types
// DELETE, re-enters their password, and only then does the client re-authenticate with Firebase
// and hand the server a fresh ID token. Edged surfaces, no rounded cards (DESIGN_SYSTEM §2).

import { EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { toast } from "sonner";

import { deleteAccount, exportData } from "@/features/account/actions";
import { DELETE_CONFIRMATION } from "@/features/account/schema";
import { signOut as signOutServer } from "@/features/auth/actions";

import { auth } from "@/firebase/client";

import { resetUser } from "@/lib/observability/client";

export default function DangerZone({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const titleId = useId();
  const confirmationId = useId();
  const passwordId = useId();
  const [confirmation, setConfirmation] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<"export" | "delete" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canDelete = confirmation === DELETE_CONFIRMATION && password.length > 0 && busy === null;

  const handleExport = async () => {
    setBusy("export");
    setError(null);
    try {
      const result = await exportData();
      if (!result.success) {
        setError(result.message);
        return;
      }
      const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `justprep-export-${result.data.exportedAt.slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Your data has been downloaded.");
    } catch {
      setError("Could not export your data. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = async () => {
    setBusy("delete");
    setError(null);
    try {
      const user = auth.currentUser;
      if (!user?.email) {
        setError("Please sign in again before deleting your account.");
        return;
      }
      // Proves the password now, so the ID token below carries a fresh auth_time.
      await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));
      const idToken = await user.getIdToken(true);

      const result = await deleteAccount({ idToken, confirmation });
      if (!result.success) {
        setError(result.message);
        return;
      }
      // The Auth user is gone; clear the local session, cookie, and analytics identity.
      await signOutServer();
      resetUser();
      toast.success(result.message);
      router.push("/sign-in");
    } catch {
      setError("That password did not match. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4">
      {/* A modal has to announce itself as one, and name itself by its heading: the menu that
          opened it stays mounted behind, so without this both it and the dialog look alike. */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex w-full max-w-md flex-col gap-5 border border-dark-300 bg-dark-200 p-6 sm:p-8"
      >
        <div>
          <p className="text-xs tracking-[0.08em] text-light-400">DANGER ZONE</p>
          <h3 id={titleId} className="mt-1 text-xl font-semibold text-primary-100">
            Delete your account
          </h3>
        </div>

        <p className="text-sm leading-relaxed text-light-100">
          This removes your profile, every interview you created, and all of their feedback. It
          cannot be undone. Download a copy first if you want to keep it.
        </p>

        <button
          type="button"
          onClick={() => void handleExport()}
          disabled={busy !== null}
          className="border border-primary-200 px-4 py-2 text-sm font-semibold text-primary-200 transition hover:bg-primary-200/10 disabled:opacity-50"
        >
          {busy === "export" ? "Preparing…" : "Download my data (JSON)"}
        </button>

        <div className="flex flex-col gap-2">
          <label htmlFor={confirmationId} className="text-sm text-light-100">
            Type <span className="font-semibold text-primary-100">{DELETE_CONFIRMATION}</span> to
            confirm
          </label>
          <input
            id={confirmationId}
            // The visible label styles DELETE in a <span>, which some accessibility-name
            // computations drop; this keeps the field findable by its full name.
            aria-label={`Type ${DELETE_CONFIRMATION} to confirm`}
            value={confirmation}
            onChange={(event) => {
              setConfirmation(event.target.value);
            }}
            autoComplete="off"
            className="border border-dark-300 bg-dark-300 px-3 py-2 text-primary-100 outline-none focus:border-primary-200"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor={passwordId} className="text-sm text-light-100">
            Confirm your password
          </label>
          <input
            id={passwordId}
            type="password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
            }}
            autoComplete="current-password"
            className="border border-dark-300 bg-dark-300 px-3 py-2 text-primary-100 outline-none focus:border-primary-200"
          />
        </div>

        {error ? (
          <p role="alert" className="text-sm text-red-400">
            {error}
          </p>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onClose}
            disabled={busy !== null}
            className="flex-1 border border-dark-300 px-4 py-2 font-semibold text-primary-100 transition hover:bg-dark-300 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleDelete()}
            disabled={!canDelete}
            className="flex-1 bg-red-600 px-4 py-2 font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
          >
            {busy === "delete" ? "Deleting…" : "Delete account"}
          </button>
        </div>
      </div>
    </div>
  );
}
