import { useState, useCallback, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";

export interface FetchListOptions {
  page?: number;
  limit?: number;
  search?: string;
  [key: string]: any;
}

export interface UseFetchListReturn<T> {
  data: T[];
  meta: {
    page: number;
    total: number;
    limit: number;
  };
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  setPage: (page: number) => void;
  setSearch: (search: string) => void;
}

/**
 * Generic hook for fetching paginated lists from API
 * Follows the useRef initialization pattern to prevent duplicate API calls
 * 
 * @param endpoint - API endpoint to fetch from (e.g., "/classes", "/courses")
 * @param initialPage - Starting page (default: 1)
 * @param initialLimit - Items per page (default: 10)
 */
export function useFetchList<T = any>(
  endpoint: string,
  initialPage: number = 1,
  initialLimit: number = 10
): UseFetchListReturn<T> {
  const [data, setData] = useState<T[]>([]);
  const [meta, setMeta] = useState({ page: initialPage, total: 0, limit: initialLimit });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPageState] = useState(initialPage);
  const [search, setSearchState] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const hasInitialized = useRef(false);

  // Handle debounce for search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPageState(1); // Reset to page 1 on search change
    }, 500);

    return () => clearTimeout(handler);
  }, [search]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", initialLimit.toString());
      if (debouncedSearch) {
        params.append("search", debouncedSearch);
      }

      const { data: response } = await api.get(`${endpoint}?${params.toString()}`);

      // Handle different response structures
      if (response.data) {
        setData(response.data);
        setMeta(response.meta || { page, total: response.data.length, limit: initialLimit });
      } else if (Array.isArray(response)) {
        setData(response);
      } else {
        setData([]);
      }
    } catch (err: any) {
      const message = err.response?.data?.detail || err.message || "Failed to load data";
      setError(message);
      console.error(`Error fetching from ${endpoint}:`, message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [endpoint, page, debouncedSearch, initialLimit]);

  // Initial fetch
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      fetchData();
    }
  }, [page, debouncedSearch, fetchData]);

  return {
    data,
    meta,
    loading,
    error,
    refetch: fetchData,
    setPage: setPageState,
    setSearch: setSearchState,
  };
}
