import { useState, useCallback, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { API } from "@/lib/endpoints";
import { toast } from "sonner";

export interface Course {
  id: number;
  name: string;
  code?: string;
  description?: string;
  instructor_id?: string;
  credits?: number;
  created_at?: string;
  updated_at?: string;
}

export interface UseCourseReturn {
  courses: Course[];
  meta: {
    page: number;
    total: number;
    limit: number;
  };
  loading: boolean;
  error: string | null;
  fetchCourses: () => Promise<void>;
  createCourse: (data: Partial<Course>) => Promise<Course | null>;
  updateCourse: (courseId: number, data: Partial<Course>) => Promise<Course | null>;
  deleteCourse: (courseId: number) => Promise<boolean>;
  setPage: (page: number) => void;
}

export function useCourses(): UseCourseReturn {
  const [courses, setCourses] = useState<Course[]>([]);
  const [meta, setMeta] = useState({ page: 1, total: 0, limit: 10 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPageState] = useState(1);
  const hasInitialized = useRef(false);

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", "10");

      const { data } = await api.get(`${API.COURSES.GET_ALL}?${params.toString()}`);

      if (data.data) {
        setCourses(data.data);
        setMeta(data.meta || { page, total: data.data.length, limit: 10 });
      } else if (Array.isArray(data)) {
        setCourses(data);
      }
    } catch (err: any) {
      const message = err.response?.data?.detail || err.message || "Failed to load courses";
      setError(message);
      console.error("Error fetching courses:", message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [page]);

  const createCourse = useCallback(async (courseData: Partial<Course>) => {
    try {
      setLoading(true);
      const { data } = await api.post(API.COURSES.CREATE, courseData);
      toast.success("Course created successfully");
      await fetchCourses();
      return data;
    } catch (err: any) {
      const message = err.response?.data?.detail || "Failed to create course";
      toast.error(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchCourses]);

  const updateCourse = useCallback(async (courseId: number, courseData: Partial<Course>) => {
    try {
      setLoading(true);
      const { data } = await api.put(API.COURSES.UPDATE(courseId), courseData);
      toast.success("Course updated successfully");
      await fetchCourses();
      return data;
    } catch (err: any) {
      const message = err.response?.data?.detail || "Failed to update course";
      toast.error(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchCourses]);

  const deleteCourse = useCallback(async (courseId: number) => {
    try {
      setLoading(true);
      await api.delete(API.COURSES.DELETE(courseId));
      toast.success("Course deleted successfully");
      await fetchCourses();
      return true;
    } catch (err: any) {
      const message = err.response?.data?.detail || "Failed to delete course";
      toast.error(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchCourses]);

  // Initial fetch with ref guard
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      fetchCourses();
    }
  }, [page, fetchCourses]);

  return {
    courses,
    meta,
    loading,
    error,
    fetchCourses,
    createCourse,
    updateCourse,
    deleteCourse,
    setPage: setPageState,
  };
}
