"use client";

import { useState, useEffect, useCallback } from "react";

interface UserProfileData {
  name: string;
  email: string;
  college?: string;
  branch?: string;
  graduationYear?: number;
  cgpa?: number;
  targetRoles: string[];
  preferredLocations: string[];
  preferredWorkMode: string;
  headline?: string;
  bio?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  skillsJson: any[];
  resumeId?: string;
  currentResume?: any;
  profile?: any;
}

export function useProfile() {
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users/me");
      if (!res.ok) throw new Error("Failed to load profile");
      const data = await res.json();
      if (data.user) {
        setProfile({
          ...data.user,
          headline: data.user.profile?.headline || "",
          bio: data.user.profile?.bio || "",
          githubUrl: data.user.profile?.githubUrl || "",
          linkedinUrl: data.user.profile?.linkedinUrl || "",
          portfolioUrl: data.user.profile?.portfolioUrl || "",
          skillsJson: data.user.profile?.skillsJson || [],
        });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const saveProfile = async (updates: Partial<UserProfileData>) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }
      const data = await res.json();
      setProfile((prev) => (prev ? { ...prev, ...updates } : prev));
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  return { profile, loading, saving, error, saveProfile, refreshProfile: fetchProfile };
}
