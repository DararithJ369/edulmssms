import React from "react";
import { cookies } from "next/headers";
import Link from "next/link";
import { Globe, PlayCircle } from "lucide-react";

type ResumeLearningData = {
  lesson_id?: number;
  lesson_title?: string;
  course_id?: number;
  course_name?: string;
  course_progress?: number;
};

const ResumeLearningWidget = async () => {
  const cookieStore = cookies();
  const userId = cookieStore.get("user_id")?.value;
  const token = cookieStore.get("access_token")?.value || cookieStore.get("token")?.value || "";

  if (!userId || !token) return null;

  let resumeLearning: ResumeLearningData | null = null;
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
    const res = await fetch(`${baseUrl}/progress/resume-learning`, {
      headers: { "Authorization": `Bearer ${token}` },
      cache: "no-store",
    });

    if (res.ok) {
      resumeLearning = await res.json();
    }
  } catch (e) {
    console.error("Failed to fetch resume learning in widget:", e);
  }

  if (!resumeLearning || !resumeLearning.lesson_id) return null;

  const progress = Math.round(resumeLearning.course_progress || 0);

  return (
    <div className="bg-gradient-to-r from-[#0038A8] to-indigo-650 rounded-3xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden group select-none animate-in fade-in slide-in-from-bottom-3 duration-300">
      <div className="absolute right-0 top-0 opacity-10 transform translate-x-12 -translate-y-12 transition-transform duration-700 group-hover:scale-110 group-hover:rotate-12">
        <Globe className="h-64 w-64" />
      </div>
      <div className="relative z-10 max-w-xl flex flex-col justify-between h-full">
        <div>
          <span className="text-[10px] md:text-xs font-black tracking-widest uppercase bg-white/20 px-3 py-1 rounded-full backdrop-blur-md font-mono select-none">
            ⚡ Pick up where you left off
          </span>
          <h2 className="text-xl md:text-2xl font-black mt-4 tracking-tight leading-tight group-hover:translate-x-0.5 transition-transform duration-300">
            {resumeLearning.lesson_title}
          </h2>
          <p className="text-xs md:text-sm text-white/80 mt-1.5 font-medium">
            Course: <span className="font-extrabold text-white">{resumeLearning.course_name}</span>
          </p>
        </div>
        
        <div className="mt-6">
          <div className="flex justify-between text-[11px] font-bold text-white/90 mb-1.5 font-mono">
            <span>Overall Course Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden shadow-inner">
            <div 
              className="h-full bg-emerald-450 rounded-full transition-all duration-1000 ease-out" 
              style={{ width: `${progress}%` }} 
            />
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <Link 
            href={`/student?lessonId=${resumeLearning.lesson_id}`}
            className="inline-flex px-5 py-2.5 bg-white text-[#0038A8] hover:bg-slate-50 text-xs font-black rounded-xl shadow-md transition-all duration-200 items-center gap-1.5 hover:scale-[1.02] active:scale-[0.99]"
          >
            <PlayCircle className="h-4 w-4" />
            <span>Continue Watching</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResumeLearningWidget;
