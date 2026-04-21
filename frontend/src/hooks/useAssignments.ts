import { useState, useCallback, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { API } from "@/lib/endpoints";
import { toast } from "sonner";

export interface Assignment {
  id: number;
  course_id: number;
  title: string;
  description?: string;
  due_date?: string;
  total_marks?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UseAssignmentsReturn {
  assignments: Assignment[];
  meta: {
    page: number;
    total: number;
    limit: number;
  };
  loading: boolean;
  error: string | null;
  fetchAssignments: () => Promise<void>;
  createAssignment: (data: FormData) => Promise<Assignment | null>;
  updateAssignment: (assignmentId: number, data: FormData) => Promise<Assignment | null>;
  deleteAssignment: (assignmentId: number) => Promise<boolean>;
  setPage: (page: number) => void;
}

export function useAssignments(): UseAssignmentsReturn {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [meta, setMeta] = useState({ page: 1, total: 0, limit: 10 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPageState] = useState(1);
  const hasInitialized = useRef(false);

  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", "10");

      const { data } = await api.get(`${API.ASSIGNMENTS.GET_ALL}?${params.toString()}`);

      if (data.data) {
        setAssignments(data.data);
        setMeta(data.meta || { page, total: data.data.length, limit: 10 });
      } else if (Array.isArray(data)) {
        setAssignments(data);
      }
    } catch (err: any) {
      const message = err.response?.data?.detail || err.message || "Failed to load assignments";
      setError(message);
      console.error("Error fetching assignments:", message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [page]);

  const createAssignment = useCallback(async (formData: FormData) => {
    try {
      setLoading(true);
      const { data } = await api.post(API.ASSIGNMENTS.CREATE, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Assignment created successfully");
      await fetchAssignments();
      return data;
    } catch (err: any) {
      const message = err.response?.data?.detail || "Failed to create assignment";
      toast.error(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchAssignments]);

  const updateAssignment = useCallback(
    async (assignmentId: number, formData: FormData) => {
      try {
        setLoading(true);
        const { data } = await api.put(API.ASSIGNMENTS.UPDATE(assignmentId), formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Assignment updated successfully");
        await fetchAssignments();
        return data;
      } catch (err: any) {
        const message = err.response?.data?.detail || "Failed to update assignment";
        toast.error(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [fetchAssignments]
  );

  const deleteAssignment = useCallback(async (assignmentId: number) => {
    try {
      setLoading(true);
      await api.delete(API.ASSIGNMENTS.DELETE(assignmentId));
      toast.success("Assignment deleted successfully");
      await fetchAssignments();
      return true;
    } catch (err: any) {
      const message = err.response?.data?.detail || "Failed to delete assignment";
      toast.error(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchAssignments]);

  // Initial fetch with ref guard
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      fetchAssignments();
    }
  }, [page, fetchAssignments]);

  return {
    assignments,
    meta,
    loading,
    error,
    fetchAssignments,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    setPage: setPageState,
  };
}
