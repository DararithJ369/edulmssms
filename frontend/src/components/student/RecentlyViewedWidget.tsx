import React from "react";
import { cookies } from "next/headers";
import Link from "next/link";
import { Clock, BookOpen, ExternalLink } from "lucide-react";

type RecentlyViewed = {
  lesson_id: number;
  lesson_title: string;
  course_id: number;
  course_name: string;
  viewed_at: string;
};

const RecentlyViewedWidget = async () => {
  const cookieStore = cookies();
  const userId = cookieStore.get("user_id")?.value;
  const token = cookieStore.get("access_token")?.value || cookieStore.get("token")?.value || "";

  if (!userId || !token) return null;

  let recentlyViewed: RecentlyViewed[] = [];
  let errorMsg = "";

  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
    const res = await fetch(`${baseUrl}/progress/recently-viewed`, {
      headers: { "Authorization": `Bearer ${token}` },
      cache: "no-store",
    });

    if (res.ok) {
      recentlyViewed = await res.json();
    } else {
      errorMsg = "Unable to load recently viewed lessons.";
    }
  } catch (e) {
    console.error("Failed to fetch recently viewed in widget:", e);
    errorMsg = "Error connecting to recent activity feed.";
  }

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] space-y-4 select-none animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center gap-2">
        <Clock className="h-4.5 w-4.5 text-[#0038A8]" />
        <h2 className="text-base font-black text-slate-800 tracking-tight">
          Recently Viewed Lessons
        </h2>
      </div>

      {errorMsg ? (
        <div className="py-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <p className="text-xs text-slate-400 font-semibold">{errorMsg}</p>
        </div>
      ) : recentlyViewed.length === 0 ? (
        <div className="py-8 text-center bg-slate-50/60 rounded-2xl border border-dashed border-slate-150 p-4 flex flex-col items-center gap-1.5">
          <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <BookOpen className="h-4 w-4" />
          </div>
          <p className="text-xs text-slate-400 font-bold">No recently viewed lessons found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recentlyViewed.map((view) => (
            <Link 
              key={view.lesson_id}
              href={`/list/courses/${view.course_id}/learn?lesson=${view.lesson_id}`}
              className="group flex flex-col p-3 border border-slate-100 bg-slate-50/20 hover:bg-white hover:border-[#0038A8]/30 rounded-xl transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,56,168,0.02)]"
            >
              <div className="flex justify-between items-start">
                <span className="text-[9px] text-slate-400 font-bold truncate font-mono uppercase tracking-wider">
                  {view.course_name}
                </span>
                <ExternalLink className="h-3 w-3 text-slate-350 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <span className="text-xs font-black text-slate-800 mt-0.5 truncate group-hover:text-[#0038A8] transition-colors leading-tight">
                {view.lesson_title}
              </span>
              <span className="text-[9px] text-slate-400 font-bold font-mono mt-1.5 self-end">
                Viewed: {new Date(view.viewed_at).toLocaleDateString()}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentlyViewedWidget;
