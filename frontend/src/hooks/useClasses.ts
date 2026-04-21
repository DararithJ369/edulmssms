import { useState, useCallback, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { API } from "@/lib/endpoints";
import { toast } from "sonner";

export interface Class {
  id: number;
  name: string;
  description?: string;
  grade_level_id?: number;
  instructor_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UseClassesReturn {
  classes: Class[];
  meta: {
    page: number;
    total: number;
    limit: number;
  };
  loading: boolean;
  error: string | null;
  fetchClasses: () => Promise<void>;
  createClass: (data: Partial<Class>) => Promise<Class | null>;
  updateClass: (classId: number, data: Partial<Class>) => Promise<Class | null>;
  deleteClass: (classId: number) => Promise<boolean>;
  setPage: (page: number) => void;
}

export function useClasses(): UseClassesReturn {
  const [classes, setClasses] = useState<Class[]>([]);
  const [meta, setMeta] = useState({ page: 1, total: 0, limit: 10 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPageState] = useState(1);
  const hasInitialized = useRef(false);

  const fetchClasses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", "10");

      const { data } = await api.get(`${API.CLASSES.GET_ALL}?${params.toString()}`);

      if (data.data) {
        setClasses(data.data);
        setMeta(data.meta || { page, total: data.data.length, limit: 10 });
      } else if (Array.isArray(data)) {
        setClasses(data);
      }
    } catch (err: any) {
      const message = err.response?.data?.detail || err.message || "Failed to load classes";
      setError(message);
      console.error("Error fetching classes:", message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [page]);

  const createClass = useCallback(async (classData: Partial<Class>) => {
    try {
      setLoading(true);
      const { data } = await api.post(API.CLASSES.CREATE, classData);
      toast.success("Class created successfully");
      await fetchClasses();
      return data;
    } catch (err: any) {
      const message = err.response?.data?.detail || "Failed to create class";
      toast.error(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchClasses]);

  const updateClass = useCallback(async (classId: number, classData: Partial<Class>) => {
    try {
      setLoading(true);
      const { data } = await api.put(API.CLASSES.UPDATE(classId), classData);
      toast.success("Class updated successfully");
      await fetchClasses();
      return data;
    } catch (err: any) {
      const message = err.response?.data?.detail || "Failed to update class";
      toast.error(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchClasses]);

  const deleteClass = useCallback(async (classId: number) => {
    try {
      setLoading(true);
      await api.delete(API.CLASSES.DELETE(classId));
      toast.success("Class deleted successfully");
      await fetchClasses();
      return true;
    } catch (err: any) {
      const message = err.response?.data?.detail || "Failed to delete class";
      toast.error(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchClasses]);

  // Initial fetch with ref guard
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      fetchClasses();
    }
  }, [page, fetchClasses]);

  return {
    classes,
    meta,
    loading,
    error,
    fetchClasses,
    createClass,
    updateClass,
    deleteClass,
    setPage: setPageState,
  };
}
