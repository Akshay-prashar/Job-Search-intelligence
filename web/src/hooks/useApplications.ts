"use client";

import { useState, useEffect, useCallback } from "react";
import type { Application, ApplicationStatus } from "@/types/application";

export function useApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/applications");
      if (!res.ok) throw new Error("Failed to fetch applications");
      const data = await res.json();
      setApplications(data.applications || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const createApplication = async (jobId: string, status: ApplicationStatus = "to_apply", notes?: string) => {
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, status, notes }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create application");
      }
      const data = await res.json();
      setApplications((prev) => [data.application, ...prev]);
      return data.application;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const updateStatus = async (id: string, status: ApplicationStatus, notes?: string) => {
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, notes }),
      });
      if (!res.ok) throw new Error("Failed to update");
      const data = await res.json();
      setApplications((prev) =>
        prev.map((a) => (a.id === id ? data.application : a))
      );
      return data.application;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const deleteApplication = async (id: string) => {
    try {
      await fetch(`/api/applications/${id}`, { method: "DELETE" });
      setApplications((prev) => prev.filter((a) => a.id !== id));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getByStatus = (status: ApplicationStatus) =>
    applications.filter((a) => a.status === status);

  return {
    applications,
    loading,
    error,
    createApplication,
    updateStatus,
    deleteApplication,
    getByStatus,
    refresh: fetchApplications,
  };
}
