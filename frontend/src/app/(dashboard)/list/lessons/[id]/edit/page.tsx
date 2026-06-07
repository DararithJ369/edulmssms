"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import LessonForm from "@/components/forms/LessonForm";
import { api } from "@/lib/api";
import BackButton from "@/components/BackButton";

export default function EditLessonPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [lessonData, setLessonData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLesson = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const { data } = await api.get(`/lessons/${id}`);
        setLessonData(data);
      } catch (err: any) {
        console.error("Failed loading lesson node:", err);
        setError(err.response?.data?.detail || "Syllabus tracking entity not found.");
      } finally {
        setLoading(false);
      }
    };

    fetchLesson();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F7F8FA] dark:bg-[#121212]">
        <div className="h-9 w-9 border-4 border-[#0038A8] border-t-transparent rounded-full animate-spin mb-2" />
        <p className="text-xs font-bold text-muted-foreground select-none">Syncing Database Workspace...</p>
      </div>
    );
  }

  if (error || !lessonData) {
    return (
      <div className="p-6 max-w-md mx-auto bg-white dark:bg-[#1c1c1c] border rounded-2xl text-center mt-12 space-y-3">
        <p className="text-sm font-bold text-red-500">{error || "Failed to parse system configurations."}</p>
        <button 
          onClick={() => router.push("/list/lessons")}
          className="px-4 py-1.5 bg-muted text-xs font-bold rounded-lg"
        >
          Back to Lessons
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 bg-[#F7F8FA] dark:bg-[#121212] min-h-screen space-y-6">
      <div className="flex items-center gap-3 select-none text-left">
        <BackButton />
        <div>
          <h1 className="text-xl font-black tracking-tight text-gray-900 dark:text-white">
            Modify Lesson Configurations
          </h1>
          <p className="text-xs text-muted-foreground">Editing target database record: Row ID {id}</p>
        </div>
      </div>

      <div className="flex justify-center">
        <LessonForm type="update" data={lessonData} onCancel={() => router.back()} />
      </div>
    </div>
  );
}