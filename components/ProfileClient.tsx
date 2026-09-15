"use client";
import Image from "next/image";
import { useState } from "react";
import { FaStar, FaRegStar } from "react-icons/fa";

import { Button } from "@/components/ui/button";

export default function ProfileClient({
  user,
  averageScore,
}: {
  user: User | null;
  averageScore?: number | null;
}) {
  const [description, setDescription] = useState(user?.description ?? "");
  const [profilePic, setProfilePic] = useState(user?.photoURL ?? "/profile.svg");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
  };

  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result;
        if (typeof result === "string") setProfilePic(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, photoURL: profilePic }),
      });
      const data = (await res.json()) as { success: boolean; message?: string };
      if (data.success) {
        setEditing(false);
        setSuccess("Profile updated!");
      } else {
        setError(data.message ?? "Failed to update profile.");
      }
    } catch {
      setError("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  // Convert averageScore (0-100) to 0-5 stars
  const starCount = averageScore ? Math.round((averageScore / 100) * 5) : 0;

  return (
    <div className="card mx-auto flex max-w-xl flex-col gap-6 p-8">
      <h2 className="mb-4 text-2xl font-bold">Your Profile</h2>
      {/* User Rating Section */}
      <div className="mb-4 flex flex-col items-center">
        <span className="mb-1 font-semibold">User Rating</span>
        <div className="flex gap-1">
          {Array.from({ length: 5 }, (_, i) =>
            i < starCount ? (
              <FaStar key={i} className="text-yellow-400" />
            ) : (
              <FaRegStar key={i} className="text-gray-400" />
            ),
          )}
        </div>
        {averageScore !== null && averageScore !== undefined && (
          <span className="mt-1 text-sm text-gray-500">
            Avg. Score: {averageScore.toFixed(1)} / 100
          </span>
        )}
      </div>
      {error && <p className="text-red-500">{error}</p>}
      {success && <p className="text-green-500">{success}</p>}
      <div className="flex flex-col items-center gap-4">
        <Image
          src={profilePic}
          alt="Profile Picture"
          width={100}
          height={100}
          className="rounded-full object-cover"
        />
        {editing && <input type="file" accept="image/*" onChange={handleProfilePicChange} />}
      </div>
      <div>
        <label className="mb-1 block font-semibold">Email</label>
        <input type="text" value={user?.email ?? ""} disabled className="input w-full" />
      </div>
      <div>
        <label className="mb-1 block font-semibold">Short Description</label>
        {editing ? (
          <textarea
            value={description}
            onChange={handleDescriptionChange}
            className="input min-h-24 w-full"
          />
        ) : (
          <p className="text-light-100">{description || "No description set."}</p>
        )}
      </div>
      <div className="mt-4 flex gap-4">
        {editing ? (
          <>
            <Button className="btn-primary" onClick={() => void handleSave()} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
            <Button
              className="btn-secondary"
              onClick={() => {
                setEditing(false);
              }}
              disabled={saving}
            >
              Cancel
            </Button>
          </>
        ) : (
          <Button
            className="btn-primary"
            onClick={() => {
              setEditing(true);
            }}
          >
            Edit Profile
          </Button>
        )}
      </div>

      {/* Learn & Prepare Section */}
      <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-primary-200/30 bg-white/10 p-6 shadow">
        <h3 className="mb-2 text-xl font-bold">Learn & Prepare</h3>
        <div>
          <h4 className="mb-1 font-semibold">Behavioral Interview Prep</h4>
          <ul className="ml-4 list-inside list-disc text-primary-100">
            <li>
              <a
                href="https://www.themuse.com/advice/interview-questions-and-answers"
                target="_blank"
                rel="noopener noreferrer"
              >
                Top Behavioral Interview Questions & Answers (The Muse)
              </a>
            </li>
            <li>
              <a
                href="https://www.indeed.com/career-advice/interviewing/behavioral-interview-questions"
                target="_blank"
                rel="noopener noreferrer"
              >
                Behavioral Interview Guide (Indeed)
              </a>
            </li>
            <li>
              <a
                href="https://www.coursera.org/articles/behavioral-interview-questions"
                target="_blank"
                rel="noopener noreferrer"
              >
                Behavioral Interview Tips (Coursera)
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="mb-1 font-semibold">Top Tech Skills</h4>
          <ul className="ml-4 list-inside list-disc text-primary-100">
            <li>
              <a href="https://react.dev/learn" target="_blank" rel="noopener noreferrer">
                React (Official Docs)
              </a>
            </li>
            <li>
              <a href="https://nodejs.org/en/docs" target="_blank" rel="noopener noreferrer">
                Node.js (Official Docs)
              </a>
            </li>
            <li>
              <a
                href="https://developer.mozilla.org/en-US/docs/Web/JavaScript"
                target="_blank"
                rel="noopener noreferrer"
              >
                JavaScript (MDN)
              </a>
            </li>
            <li>
              <a href="https://www.python.org/doc/" target="_blank" rel="noopener noreferrer">
                Python (Official Docs)
              </a>
            </li>
            <li>
              <a href="https://soliditylang.org/docs/" target="_blank" rel="noopener noreferrer">
                Solidity (Blockchain)
              </a>
            </li>
            <li>
              <a href="https://www.mongodb.com/docs/" target="_blank" rel="noopener noreferrer">
                MongoDB (Official Docs)
              </a>
            </li>
            <li>
              <a href="https://www.postgresql.org/docs/" target="_blank" rel="noopener noreferrer">
                PostgreSQL (Official Docs)
              </a>
            </li>
            <li>
              <a
                href="https://www.docker.com/101-tutorial"
                target="_blank"
                rel="noopener noreferrer"
              >
                Docker (Official Tutorial)
              </a>
            </li>
            <li>
              <a href="https://kubernetes.io/docs/home/" target="_blank" rel="noopener noreferrer">
                Kubernetes (Official Docs)
              </a>
            </li>
            <li>
              <a
                href="https://www.coursera.org/courses?query=blockchain"
                target="_blank"
                rel="noopener noreferrer"
              >
                Blockchain (Coursera)
              </a>
            </li>
          </ul>
        </div>
        <p className="mt-2 text-sm text-light-400">
          Explore these resources to boost your confidence and skills for your next interview!
        </p>
      </div>
    </div>
  );
}
