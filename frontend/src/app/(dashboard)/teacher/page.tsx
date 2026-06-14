import { Suspense } from "react";
import Announcements from "@/components/Announcements";
import BigCalendarContainer from "@/components/BigCalendarContainer";
import { cookies } from "next/headers";
import Link from "next/link";
import { Globe, Plus } from "lucide-react";
import { CalendarSkeleton } from "@/components/student/WidgetSkeleton";
import { normalizeRole } from "@/lib/auth";

const TeacherPage = () => {
  const userId = cookies().get("user_id")?.value || null;
  const role = normalizeRole(cookies().get("user_role")?.value);

  if (!userId) {
    return (
      <div className="p-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h1 className="text-xl font-bold text-slate-800 font-sans">Teacher Dashboard</h1>
          <p className="text-slate-500 mt-2 text-sm">Please sign in to view your academic schedules.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 space-y-6 bg-[#F7F8FA] min-h-screen relative font-sans text-left transition-all duration-300 animate-in fade-in">
      {/* BREADCRUMB */}
      <div className="flex items-center gap-1 text-[11px] font-extrabold text-muted-foreground uppercase tracking-wider mb-2 select-none">
        <Link href="/" className="hover:text-foreground flex items-center gap-1">
          <Globe className="h-3 w-3" />
          Home
        </Link>
        <span>/</span>
        <span className="text-foreground">Dashboard</span>
      </div>

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 select-none mb-6">
        <div>
          <span className="text-xs font-extrabold text-[#0038A8] uppercase tracking-wider font-mono">
            Faculty Control Console
          </span>
          <h1 className="text-xl md:text-3xl font-black text-slate-800 tracking-tight leading-tight mt-0.5">
            Teacher Lecture Workspace
          </h1>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/list/courses/create">
            <button className="px-4 py-2 bg-[#0038A8] text-white hover:bg-[#002D86] font-black text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer">
              <Plus className="h-4 w-4" />
              <span>Create New Course</span>
            </button>
          </Link>
        </div>
      </div>

      <div className="flex gap-6 flex-col xl:flex-row">
        {/* LEFT */}
        <div className="w-full xl:w-2/3">
          <Suspense fallback={<CalendarSkeleton />}>
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
              <h2 className="text-lg font-black text-slate-800 tracking-tight mb-4 select-none">
                Academic Timetable
              </h2>
              <div className="h-[480px]">
                <BigCalendarContainer type="teacherId" id={userId} />
              </div>
            </div>
          </Suspense>
        </div>
        
        {/* RIGHT */}
        <div className="w-full xl:w-1/3 flex flex-col gap-6">
          <Announcements />
        </div>
      </div>
    </div>
  );
};

export default TeacherPage;
