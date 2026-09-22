"use client";

import { useState, useEffect, useCallback } from "react";
import type { Job, JobFilter } from "@/types/job";

interface UseJobsOptions {
  initialPage?: number;
  pageSize?: number;
  initialFilters?: JobFilter;
}

interface UseJobsReturn {
  jobs: Job[];
  loading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  totalJobs: number;
  filters: JobFilter;
  setPage: (page: number) => void;
  setFilters: (filters: JobFilter) => void;
  search: (query: string) => void;
  refresh: () => void;
}

export function useJobs(options: UseJobsOptions = {}): UseJobsReturn {
  const {
    initialPage = 1,
    pageSize = 20,
    initialFilters = {},
  } = options;

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const [filters, setFilters] = useState<JobFilter>(initialFilters);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", pageSize.toString());

      if (filters.search) params.set("search", filters.search);
      if (filters.roleType?.length)
        params.set("roleType", filters.roleType.join(","));
      if (filters.experienceLevel?.length)
        params.set("experienceLevel", filters.experienceLevel.join(","));
      if (filters.remoteType?.length)
        params.set("remoteType", filters.remoteType.join(","));
      if (filters.source?.length)
        params.set("source", filters.source.join(","));

      const res = await fetch(`/api/jobs?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch jobs");
      const data = await res.json();

      setJobs(data.jobs || []);
      setTotalPages(data.totalPages || 1);
      setTotalJobs(data.total || 0);
    } catch (err: any) {
      setError(err.message);
      // Keep existing jobs on error
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filters]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const search = useCallback((query: string) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, search: query }));
  }, []);

  return {
    jobs,
    loading,
    error,
    page,
    totalPages,
    totalJobs,
    filters,
    setPage,
    setFilters: (newFilters: JobFilter) => {
      setPage(1);
      setFilters(newFilters);
    },
    search,
    refresh: fetchJobs,
  };
}
