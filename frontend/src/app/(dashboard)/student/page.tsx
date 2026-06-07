import { Suspense } from "react";
import Announcements from "@/components/Announcements";
import BigCalendarContainer from "@/components/BigCalendarContainer";
import EventCalendar from "@/components/EventCalendar";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import Link from "next/link";
import { Globe } from "lucide-react";

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

const StudentPage = async () => {
  const cookieStore = cookies();
  const userId = cookieStore.get("user_id")?.value || null;

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
