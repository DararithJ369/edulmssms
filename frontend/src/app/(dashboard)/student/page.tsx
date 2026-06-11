import { Suspense } from "react";
import Announcements from "@/components/Announcements";
import BigCalendarContainer from "@/components/BigCalendarContainer";
import EventCalendar from "@/components/EventCalendar";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import Link from "next/link";
import { Globe, Video, ArrowLeft, AlertCircle } from "lucide-react";

// Widgets
import StreakWidget from "@/components/student/StreakWidget";
import ResumeLearningWidget from "@/components/student/ResumeLearningWidget";
import ContinueLearningWidget from "@/components/student/ContinueLearningWidget";
import RecommendedCoursesWidget from "@/components/student/RecommendedCoursesWidget";
import RecentlyViewedWidget from "@/components/student/RecentlyViewedWidget";
import StatsOverviewWidget from "@/components/student/StatsOverviewWidget";

// Skeletons
import {
  HeroSkeleton,
  CourseCardGridSkeleton,
  RecommendedGridSkeleton,
  RecentlyViewedSkeleton,
  CalendarSkeleton,
} from "@/components/student/WidgetSkeleton";

interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

const StudentPage = async ({ searchParams }: PageProps) => {
  const cookieStore = cookies();
  const userId = cookieStore.get("user_id")?.value || null;
  const token = cookieStore.get("access_token")?.value || cookieStore.get("token")?.value || "";

  if (!userId) {
    return (
      <div className="p-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h1 className="text-xl font-bold text-slate-800">Student Dashboard</h1>
          <p className="text-slate-500 mt-2 text-sm">Please sign in to view your learning schedule.</p>
        </div>
      </div>
    );
  }

  const activeLessonId = searchParams?.lessonId;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

  // Quick lookup of lesson metadata to display an elegant layout headline
  let lessonTitle = `Lesson #${activeLessonId}`;
  if (activeLessonId) {
    try {
      const lessonRes = await fetch(`${baseUrl}/lessons/${activeLessonId}`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (lessonRes.ok) {
        const lessonData = await lessonRes.json();
        lessonTitle = lessonData.title || lessonTitle;
      }
    } catch (e) {
      console.error("Failed to pre-fetch lesson details:", e);
    }
  }

  // Quick check for student class
  const classItem = await prisma.class.findMany({
    where: {
      students: { some: { id: userId } },
    },
  });

  return (
    <div className="flex-1 p-6 space-y-6 bg-[#F7F8FA] min-h-screen relative font-sans text-left transition-colors duration-300">
      {/* BREADCRUMB */}
      <div className="flex items-center gap-1 text-[11px] font-extrabold text-muted-foreground uppercase tracking-wider mb-2 select-none">
        <Link href="/" className="hover:text-foreground flex items-center gap-1">
          <Globe className="h-3 w-3" />
          Home
        </Link>
        <span>/</span>
        <span className="text-foreground">Dashboard</span>
      </div>

      {/* ── 🍏 ACTUAL INTERACTIVE VIDEO LEARNING HUB WORKSPACE ── */}
      {activeLessonId && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.015)] space-y-4 animate-in fade-in zoom-in-95 duration-300">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-[#0038A8]/10 text-[#0038A8] rounded-xl">
                <Video className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wide leading-tight">
                  {lessonTitle}
                </h2>
                <p className="text-[10px] text-slate-400 font-bold font-mono mt-0.5">RESOURCE ENDPOINT SPECIFIER: ID #{activeLessonId}</p>
              </div>
            </div>
            
            <Link 
              href="/student" 
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 text-xs font-bold rounded-xl border border-slate-200/60 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Dashboard</span>
            </Link>
          </div>

          {/* Dynamic Video Media Stream Wrapper Block */}
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-900 shadow-inner flex items-center justify-center">
            <video 
              src={`${baseUrl}/lessons/${activeLessonId}/video/stream`}
              controls
              autoPlay
              className="w-full h-full object-contain"
              poster="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1200"
            >
              {/* Fallback component template if backend throws an unhandled stream asset block */}
              <div className="p-6 text-center text-white flex flex-col items-center gap-2">
                <AlertCircle className="h-8 w-8 text-amber-500" />
                <p className="text-xs font-bold">Media Resource Offline</p>
              </div>
            </video>
          </div>
          
          <div className="p-4 bg-amber-50/40 border border-amber-200/50 rounded-2xl flex items-start gap-3">
            <span className="text-sm">⚠️</span>
            <p className="text-[11px] text-amber-800 font-semibold leading-relaxed">
              If the media player above stays gray or shows an empty wheel, the lesson record is active but **no raw video file has been uploaded on the teacher's dashboard yet**. Please report this to your instructor for asset synchronization.
            </p>
          </div>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 select-none mb-6">
        <div>
          <span className="text-xs font-extrabold text-[#0038A8] uppercase tracking-wider font-mono">
            Academic Classroom Catalog
          </span>
          <h1 className="text-xl md:text-3xl font-black text-slate-800 tracking-tight leading-tight mt-0.5">
            Student Learning Hub
          </h1>
        </div>

        {/* Async Streak Widget */}
        <Suspense fallback={<div className="h-12 w-44 bg-slate-100 rounded-2xl animate-pulse" />}>
          <StreakWidget />
        </Suspense>
      </div>

      {/* STATS OVERVIEW */}
      <Suspense fallback={<div className="grid grid-cols-2 md:grid-cols-4 gap-4"><div className="h-24 bg-slate-100 rounded-2xl animate-pulse" /><div className="h-24 bg-slate-100 rounded-2xl animate-pulse" /><div className="h-24 bg-slate-100 rounded-2xl animate-pulse" /><div className="h-24 bg-slate-100 rounded-2xl animate-pulse" /></div>}>
        <StatsOverviewWidget />
      </Suspense>

      {/* RESUME LEARNING HERO CARD */}
      <Suspense fallback={<HeroSkeleton />}>
        <ResumeLearningWidget />
      </Suspense>

      {/* DASHBOARD GRID */}
      <div className="flex gap-6 flex-col xl:flex-row">
        {/* LEFT PANEL */}
        <div className="w-full xl:w-2/3 space-y-6">
          {/* Continue Learning Section */}
          <Suspense fallback={<CourseCardGridSkeleton />}>
            <ContinueLearningWidget />
          </Suspense>

          {/* Recommended Section */}
          <Suspense fallback={<RecommendedGridSkeleton />}>
            <RecommendedCoursesWidget />
          </Suspense>

          {/* Schedule Section */}
          <Suspense fallback={<CalendarSkeleton />}>
            <div className="bg-white p-6 rounded-3xl border border-slate-150 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
              <h2 className="text-lg font-black text-slate-850 tracking-tight mb-4">
                Academic Schedule
              </h2>
              {classItem[0] ? (
                <BigCalendarContainer type="studentId" id={userId} />
              ) : (
                <p className="text-slate-400 text-xs font-semibold py-4">No academic schedule found for this account.</p>
              )}
            </div>
          </Suspense>
        </div>

        {/* RIGHT PANEL */}
        <div className="w-full xl:w-1/3 space-y-6">
          {/* Recently Viewed Lessons */}
          <Suspense fallback={<RecentlyViewedSkeleton />}>
            <RecentlyViewedWidget />
          </Suspense>

          <EventCalendar />
          <Announcements />
        </div>
      </div>
    </div>
  );
};

export default StudentPage;