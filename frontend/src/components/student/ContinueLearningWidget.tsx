import React from "react";
import { cookies } from "next/headers";
import Link from "next/link";
import { BookOpen, GraduationCap, ChevronRight } from "lucide-react";

type ActiveCourse = {
  course_id: number;
  course_name: string;
  description?: string;
  progress_percentage: number;
};

const ContinueLearningWidget = async () => {
  const cookieStore = cookies();
  const userId = cookieStore.get("user_id")?.value;
  const token = cookieStore.get("access_token")?.value || cookieStore.get("token")?.value || "";

  if (!userId || !token) return null;

  let continueLearning: ActiveCourse[] = [];
  let errorMsg = "";

  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
    const res = await fetch(`${baseUrl}/progress/continue-learning`, {
      headers: { "Authorization": `Bearer ${token}` },
      cache: "no-store",
    });

    if (res.ok) {
      continueLearning = await res.json();
    } else {
      errorMsg = "Unable to load active courses at the moment.";
    }
  } catch (e) {
    console.error("Failed to fetch continue learning in widget:", e);
    errorMsg = "Something went wrong while connecting to the catalog.";
  }

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] space-y-4 select-none animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4.5 w-4.5 text-[#0038A8]" />
          <h2 className="text-lg font-black text-slate-800 tracking-tight">
            Continue Learning
          </h2>
        </div>
        <Link 
          href="/list/courses" 
          className="group/btn flex items-center gap-0.5 text-xs text-[#0038A8] font-bold hover:underline"
        >
          <span>All courses</span>
          <ChevronRight className="h-3 w-3 group-hover/btn:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {errorMsg ? (
        <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <p className="text-xs text-slate-400 font-semibold">{errorMsg}</p>
        </div>
      ) : continueLearning.length === 0 ? (
        <div className="py-8 text-center bg-slate-50/60 rounded-2xl border border-dashed border-slate-150 p-6 flex flex-col items-center gap-2">
          <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <GraduationCap className="h-5 w-5" />
          </div>
          <p className="text-xs text-slate-400 font-bold max-w-[240px]">
            You have no active courses. Find a subject and start learning!
          </p>
          <Link
            href="/list/courses"
            className="mt-2 inline-flex px-4 py-1.5 bg-slate-100 text-[#0038A8] hover:bg-slate-200 text-[10px] font-black rounded-lg transition-all"
          >
            Explore Catalog
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {continueLearning.map((course) => (
            <Link 
              key={course.course_id}
              href={`/list/courses/${course.course_id}`}
              className="group block p-4 border border-slate-100 bg-slate-50/20 hover:bg-white hover:border-[#0038A8]/30 rounded-2xl transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,56,168,0.04)] hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-black text-[#0038A8] uppercase tracking-wider font-mono">
                  Enrolled Class
                </span>
              </div>
              <h3 className="text-sm font-black text-slate-800 truncate mt-1 group-hover:text-[#0038A8] transition-colors leading-tight">
                {course.course_name}
              </h3>
              <p className="text-[11px] text-slate-400 font-semibold line-clamp-1 mt-0.5">
                {course.description || "No course description available."}
              </p>
              
              <div className="mt-4 flex items-center justify-between text-[10px] font-bold text-slate-400 mb-1 font-mono">
                <span>Progress</span>
                <span>{Math.round(course.progress_percentage)}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${course.progress_percentage}%` }}
                />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default ContinueLearningWidget;
