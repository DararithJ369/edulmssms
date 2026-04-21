import { useState, useCallback, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { API } from "@/lib/endpoints";
import { toast } from "sonner";

export interface Lesson {
  id: number;
  course_id?: number;
  title: string;
  description?: string;
  content?: string;
  order?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface LessonMaterial {
  id: number;
  lesson_id: number;
  title: string;
  description?: string;
  file_url?: string;
  file_type?: string;
  file_size?: number;
  created_at?: string;
  updated_at?: string;
}

export interface UseLessonsReturn {
  lessons: Lesson[];
  meta: {
    page: number;
    total: number;
    limit: number;
  };
  loading: boolean;
  error: string | null;
  fetchLessons: () => Promise<void>;
  createLesson: (data: Partial<Lesson>) => Promise<Lesson | null>;
  updateLesson: (lessonId: number, data: Partial<Lesson>) => Promise<Lesson | null>;
  deleteLesson: (lessonId: number) => Promise<boolean>;
  addMaterial: (lessonId: number, formData: FormData) => Promise<LessonMaterial | null>;
  deleteMaterial: (materialId: number) => Promise<boolean>;
  setPage: (page: number) => void;
}

export function useLessons(): UseLessonsReturn {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [meta, setMeta] = useState({ page: 1, total: 0, limit: 10 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPageState] = useState(1);
  const hasInitialized = useRef(false);

  const fetchLessons = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", "10");

      const { data } = await api.get(`${API.LESSONS.GET_ALL}?${params.toString()}`);

      if (data.data) {
        setLessons(data.data);
        setMeta(data.meta || { page, total: data.data.length, limit: 10 });
      } else if (Array.isArray(data)) {
        setLessons(data);
      }
    } catch (err: any) {
      const message = err.response?.data?.detail || err.message || "Failed to load lessons";
      setError(message);
      console.error("Error fetching lessons:", message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [page]);

  const createLesson = useCallback(
    async (lessonData: Partial<Lesson>) => {
      try {
        setLoading(true);
        const { data } = await api.post(API.LESSONS.CREATE, lessonData);
        toast.success("Lesson created successfully");
        await fetchLessons();
        return data;
      } catch (err: any) {
        const message = err.response?.data?.detail || "Failed to create lesson";
        toast.error(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [fetchLessons]
  );

  const updateLesson = useCallback(
    async (lessonId: number, lessonData: Partial<Lesson>) => {
      try {
        setLoading(true);
        const { data } = await api.put(API.LESSONS.UPDATE(lessonId), lessonData);
        toast.success("Lesson updated successfully");
        await fetchLessons();
        return data;
      } catch (err: any) {
        const message = err.response?.data?.detail || "Failed to update lesson";
        toast.error(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [fetchLessons]
  );

  const deleteLesson = useCallback(
    async (lessonId: number) => {
      try {
        setLoading(true);
        await api.delete(API.LESSONS.DELETE(lessonId));
        toast.success("Lesson deleted successfully");
        await fetchLessons();
        return true;
      } catch (err: any) {
        const message = err.response?.data?.detail || "Failed to delete lesson";
        toast.error(message);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [fetchLessons]
  );

  const addMaterial = useCallback(
    async (lessonId: number, formData: FormData) => {
      try {
        setLoading(true);
        const { data } = await api.post(API.LESSONS.ADD_MATERIAL(lessonId), formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Material added successfully");
        return data;
      } catch (err: any) {
        const message = err.response?.data?.detail || "Failed to add material";
        toast.error(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteMaterial = useCallback(async (materialId: number) => {
    try {
      setLoading(true);
      await api.delete(API.LESSONS.DELETE_MATERIAL(materialId));
      toast.success("Material deleted successfully");
      return true;
    } catch (err: any) {
      const message = err.response?.data?.detail || "Failed to delete material";
      toast.error(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch with ref guard
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      fetchLessons();
    }
  }, [page, fetchLessons]);

  return {
    lessons,
    meta,
    loading,
    error,
    fetchLessons,
    createLesson,
    updateLesson,
    deleteLesson,
    addMaterial,
    deleteMaterial,
    setPage: setPageState,
  };
}
