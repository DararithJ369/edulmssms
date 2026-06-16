import React from "react";
import { cookies } from "next/headers";
import Link from "next/link";
import { Sparkles, User, BookOpen } from "lucide-react";
import { getImageUrl } from "@/lib/image-url";

type RecommendedCourse = {
  id: number;
  course_name: string;
  description?: string;
  teacher_name?: string;
  image?: string;
};

const RecommendedCoursesWidget = async () => {
  const cookieStore = cookies();
  const userId = cookieStore.get("user_id")?.value;
  const token = cookieStore.get("access_token")?.value || cookieStore.get("token")?.value || "";

  if (!userId || !token) return null;

  let recommendedCourses: RecommendedCourse[] = [];
  let errorMsg = "";

  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
    const res = await fetch(`${baseUrl}/progress/recommended-courses`, {
      headers: { "Authorization": `Bearer ${token}` },
      cache: "no-store",
    });

    if (res.ok) {
      recommendedCourses = await res.json();
    } else {
      errorMsg = "Unable to load recommendations at the moment.";
    }
  } catch (e) {
    console.error("Failed to fetch recommended courses in widget:", e);
    errorMsg = "Something went wrong while connecting to the engine.";
  }

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] space-y-4 select-none animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4.5 w-4.5 text-slate-500" />
        <h2 className="text-lg font-black text-slate-800 tracking-tight">
          Recommended for You
        </h2>
      </div>

      {errorMsg ? (
        <div className="py-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <p className="text-xs text-slate-400 font-semibold">{errorMsg}</p>
        </div>
      ) : recommendedCourses.length === 0 ? (
        <div className="py-6 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-150 p-4">
          <p className="text-xs text-slate-400 font-bold">No course recommendations available.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendedCourses.map((course) => (
            <div 
              key={course.id}
              className="flex gap-4 p-4 border border-slate-100 hover:border-slate-200 bg-slate-50/10 hover:bg-white rounded-2xl transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.02)]"
            >
              {course.image ? (
                <img 
                  src={getImageUrl(course.image) || ""} 
                  alt={course.course_name} 
                  className="w-16 h-16 rounded-xl object-cover border border-slate-100 shrink-0" 
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-150 flex items-center justify-center text-slate-450 shrink-0">
                  <BookOpen className="h-5 w-5" />
                </div>
              )}
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-black text-slate-800 truncate leading-tight hover:text-slate-900 transition-colors">
                    {course.course_name}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5 line-clamp-2 leading-normal">
                    {course.description || "Learn new skills with this course catalog."}
                  </p>
                </div>
                <div className="mt-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[9px] text-slate-400 font-bold font-mono">
                    <User className="h-3 w-3 text-slate-400" />
                    <span className="truncate max-w-[100px]">{course.teacher_name || "LMS Faculty"}</span>
                  </div>
                  <Link 
                    href={`/list/courses/${course.id}`}
                    className="text-[10px] text-slate-600 font-black hover:underline"
                  >
                    Learn More
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecommendedCoursesWidget;
