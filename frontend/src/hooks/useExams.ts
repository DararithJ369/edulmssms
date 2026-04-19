import { useState, useCallback, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { API } from "@/lib/endpoints";
import { toast } from "sonner";

export interface Exam {
  id: number;
  course_id?: number;
  title: string;
  description?: string;
  total_marks?: number;
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UseExamsReturn {
  exams: Exam[];
  meta: {
    page: number;
    total: number;
    limit: number;
  };
  loading: boolean;
  error: string | null;
  fetchExams: () => Promise<void>;
  createExam: (data: Partial<Exam>) => Promise<Exam | null>;
  updateExam: (examId: number, data: Partial<Exam>) => Promise<Exam | null>;
  deleteExam: (examId: number) => Promise<boolean>;
  submitExam: (examId: number, answers: any) => Promise<boolean>;
  getExamResults: (examId: number) => Promise<any>;
  setPage: (page: number) => void;
}

export function useExams(): UseExamsReturn {
  const [exams, setExams] = useState<Exam[]>([]);
  const [meta, setMeta] = useState({ page: 1, total: 0, limit: 10 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPageState] = useState(1);
  const hasInitialized = useRef(false);

  const fetchExams = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", "10");

      const { data } = await api.get(`${API.EXAMS.GET_ALL}?${params.toString()}`);

      if (data.data) {
        setExams(data.data);
        setMeta(data.meta || { page, total: data.data.length, limit: 10 });
      } else if (Array.isArray(data)) {
        setExams(data);
      }
    } catch (err: any) {
      const message = err.response?.data?.detail || err.message || "Failed to load exams";
      setError(message);
      console.error("Error fetching exams:", message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [page]);

  const createExam = useCallback(
    async (examData: Partial<Exam>) => {
      try {
        setLoading(true);
        const { data } = await api.post(API.EXAMS.CREATE, examData);
        toast.success("Exam created successfully");
        await fetchExams();
        return data;
      } catch (err: any) {
        const message = err.response?.data?.detail || "Failed to create exam";
        toast.error(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [fetchExams]
  );

  const updateExam = useCallback(
    async (examId: number, examData: Partial<Exam>) => {
      try {
        setLoading(true);
        const { data } = await api.put(API.EXAMS.UPDATE(examId), examData);
        toast.success("Exam updated successfully");
        await fetchExams();
        return data;
      } catch (err: any) {
        const message = err.response?.data?.detail || "Failed to update exam";
        toast.error(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [fetchExams]
  );

  const deleteExam = useCallback(
    async (examId: number) => {
      try {
        setLoading(true);
        await api.delete(API.EXAMS.DELETE(examId));
        toast.success("Exam deleted successfully");
        await fetchExams();
        return true;
      } catch (err: any) {
        const message = err.response?.data?.detail || "Failed to delete exam";
        toast.error(message);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [fetchExams]
  );

  const submitExam = useCallback(async (examId: number, answers: any) => {
    try {
      setLoading(true);
      await api.post(API.EXAMS.SUBMIT(examId), { answers });
      toast.success("Exam submitted successfully");
      return true;
    } catch (err: any) {
      const message = err.response?.data?.detail || "Failed to submit exam";
      toast.error(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const getExamResults = useCallback(async (examId: number) => {
    try {
      setLoading(true);
      const { data } = await api.get(API.EXAMS.GET_RESULTS(examId));
      return data;
    } catch (err: any) {
      const message = err.response?.data?.detail || "Failed to fetch exam results";
      toast.error(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch with ref guard
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      fetchExams();
    }
  }, [page, fetchExams]);

  return {
    exams,
    meta,
    loading,
    error,
    fetchExams,
    createExam,
    updateExam,
    deleteExam,
    submitExam,
    getExamResults,
    setPage: setPageState,
  };
}
