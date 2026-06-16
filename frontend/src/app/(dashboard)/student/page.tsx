import { Suspense } from "react";
import Announcements from "@/components/Announcements";
import BigCalendarContainer from "@/components/BigCalendarContainer";
import EventCalendar from "@/components/EventCalendar";

import { cookies } from "next/headers";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

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

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

const StudentPage = async ({ searchParams }: PageProps) => {
  const cookieStore = cookies();
  const userId = cookieStore.get("user_id")?.value || null;
  const token =
    cookieStore.get("access_token")?.value ||
    cookieStore.get("token")?.value ||
    "";

  if (!userId) {
    return (
      <div className="p-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h1 className="text-xl font-bold text-slate-800">Student Dashboard</h1>
          <p className="text-slate-500 mt-2 text-sm">
            Please sign in to view your learning schedule.
          </p>
        </div>
      </div>
    );
  }

  // Today's date info
  const now = new Date();
  const monthYear = now.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex-1 min-h-screen bg-[#F4F6FA] font-sans text-left">


      {/* ── Page content ─────────────────────────────────────────── */}
      <div className="p-6 space-y-6">

        {/* ── TOP ROW: Greeting + Date + Streak ─────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Student Dashboard
            </p>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-tight mt-0.5">
              {monthYear}
            </h1>
          </div>
          <Suspense fallback={<div className="h-10 w-36 bg-slate-100 rounded-2xl animate-pulse" />}>
            <StreakWidget />
          </Suspense>
        </div>

        {/* ── STATS ROW ─────────────────────────────────────────── */}
        <Suspense
          fallback={
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          }
        >
          <StatsOverviewWidget />
        </Suspense>

        {/* ── RESUME LEARNING HERO ─────────────────────────────── */}
        <Suspense fallback={<HeroSkeleton />}>
          <ResumeLearningWidget />
        </Suspense>

        {/* ── MAIN 3-COLUMN GRID ───────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">

          {/* ── COL 1+2: Schedule + Courses ─────────────────────── */}
          <div className="xl:col-span-2 space-y-6">

            {/* Weekly Schedule */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-5">
              <Suspense fallback={<CalendarSkeleton />}>
                <BigCalendarContainer type="studentId" id={userId} />
              </Suspense>
            </div>

            {/* My Courses — Continue Learning */}
            <Suspense fallback={<CourseCardGridSkeleton />}>
              <ContinueLearningWidget />
            </Suspense>

            {/* Recommended Courses */}
            <Suspense fallback={<RecommendedGridSkeleton />}>
              <RecommendedCoursesWidget />
            </Suspense>
          </div>

          {/* ── COL 3: Right Panel ───────────────────────────────── */}
          <div className="space-y-6">

            {/* Mini Event Calendar */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <EventCalendar />
            </div>

            {/* Announcements */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-4">
              <Suspense fallback={<div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}</div>}>
                <Announcements />
              </Suspense>
            </div>

            {/* Recently Viewed Lessons */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-4">
              <Suspense fallback={<RecentlyViewedSkeleton />}>
                <RecentlyViewedWidget />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentPage;