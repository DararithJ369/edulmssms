"use client";

import { useRouter } from "next/navigation";
import LessonForm from "@/components/forms/LessonForm";
import BackButton from "@/components/BackButton";

export default function CreateLessonPage() {
  const router = useRouter();

  return (
    <div className="flex-1 p-6 bg-[#F7F8FA] dark:bg-[#121212] min-h-screen space-y-6">
      <div className="flex items-center gap-3 select-none text-left">
        <BackButton />
        <div>
          <h1 className="text-xl font-black tracking-tight text-gray-900 dark:text-white">
            Create Activity
          </h1>
          <p className="text-xs text-muted-foreground">Add a new lesson node to your course module hierarchy</p>
        </div>
      </div>

      <div className="flex justify-center">
        <LessonForm type="create" onCancel={() => router.push("/list/lessons")} />
      </div>
    </div>
  );
}