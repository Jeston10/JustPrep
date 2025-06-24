"use client";
import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

export default function ProfileClient({ user }: { user: any }) {
  const [description, setDescription] = useState(user?.description || '');
  const [profilePic, setProfilePic] = useState(user?.photoURL || '/profile.svg');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
  };

  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        setProfilePic(ev.target?.result as string);
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
      const data = await res.json();
      if (data.success) {
        setEditing(false);
        setSuccess("Profile updated!");
      } else {
        setError(data.message || "Failed to update profile.");
      }
    } catch (err) {
      setError("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto card p-8 flex flex-col gap-6">
      <h2 className="text-2xl font-bold mb-4">Your Profile</h2>
      {error && <p className="text-red-500">{error}</p>}
      {success && <p className="text-green-500">{success}</p>}
      <div className="flex flex-col items-center gap-4">
        <Image src={profilePic} alt="Profile Picture" width={100} height={100} className="rounded-full object-cover" />
        {editing && (
          <input type="file" accept="image/*" onChange={handleProfilePicChange} />
        )}
      </div>
      <div>
        <label className="block font-semibold mb-1">Email</label>
        <input type="text" value={user?.email || ''} disabled className="input w-full" />
      </div>
      <div>
        <label className="block font-semibold mb-1">Short Description</label>
        {editing ? (
          <textarea value={description} onChange={handleDescriptionChange} className="input w-full min-h-24" />
        ) : (
          <p className="text-light-100">{description || 'No description set.'}</p>
        )}
      </div>
      <div className="flex gap-4 mt-4">
        {editing ? (
          <>
            <Button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
            <Button className="btn-secondary" onClick={() => setEditing(false)} disabled={saving}>Cancel</Button>
          </>
        ) : (
          <Button className="btn-primary" onClick={() => setEditing(true)}>Edit Profile</Button>
        )}
      </div>
    </div>
  );
} 