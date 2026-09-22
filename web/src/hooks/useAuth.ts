"use client";

import { useState, useEffect, useCallback } from "react";
import type { User, UserProfile } from "@/types/user";

interface AuthState {
  user: (User & { profile?: UserProfile }) | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/users/me");
      if (!res.ok) {
        setState({ user: null, loading: false, error: null });
        return;
      }
      const data = await res.json();
      setState({ user: data.user, loading: false, error: null });
    } catch {
      setState({ user: null, loading: false, error: "Failed to fetch user" });
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email: string, password: string) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      await fetchUser();
      return data;
    } catch (err: any) {
      setState((s) => ({ ...s, loading: false, error: err.message }));
      throw err;
    }
  };

  const register = async (data: {
    name: string;
    email: string;
    password: string;
    college: string;
    branch: string;
    graduationYear: number;
  }) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Registration failed");
      await fetchUser();
      return result;
    } catch (err: any) {
      setState((s) => ({ ...s, loading: false, error: err.message }));
      throw err;
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "DELETE" });
    setState({ user: null, loading: false, error: null });
    window.location.href = "/login";
  };

  const updateProfile = async (profileData: Record<string, any>) => {
    setState((s) => ({ ...s, loading: true }));
    try {
      const res = await fetch("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      setState((s) => ({ ...s, user: data.user, loading: false }));
      return data;
    } catch (err: any) {
      setState((s) => ({ ...s, loading: false, error: err.message }));
      throw err;
    }
  };

  return {
    user: state.user,
    loading: state.loading,
    error: state.error,
    login,
    register,
    logout,
    updateProfile,
    refreshUser: fetchUser,
  };
}
