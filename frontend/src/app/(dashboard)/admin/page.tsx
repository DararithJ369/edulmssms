import { Suspense } from "react";
import Announcements from "@/components/Announcements";
import AttendanceChartContainer from "@/components/AttendanceChartContainer";
import CountChartContainer from "@/components/CountChartContainer";
import EventCalendarContainer from "@/components/EventCalendarContainer";
import FinanceChart from "@/components/FinanceChart";
import UserCard from "@/components/UserCard";
import Link from "next/link";
import { Globe, Plus } from "lucide-react";
import { UserCardSkeleton, ChartSkeleton, CalendarSkeleton } from "@/components/student/WidgetSkeleton";

const AdminPage = ({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) => {
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
            System Administration
          </span>
          <h1 className="text-xl md:text-3xl font-black text-slate-800 tracking-tight leading-tight mt-0.5">
            Admin Overview Control
          </h1>
        </div>

        {/* Administration Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/list/courses/1/edit">
            <button className="px-4 py-2.5 bg-[#8b5cf6] text-white hover:bg-[#7c3aed] font-extrabold text-xs rounded-xl transition-all shadow-md shadow-violet-500/10 flex items-center gap-1.5 active:scale-[0.98] hover:scale-[1.02]">
              <Plus className="h-4 w-4" />
              <span>Create New Activity</span>
            </button>
          </Link>
        </div>
      </div>

      {/* BODY GRID */}
      <div className="flex gap-6 flex-col xl:flex-row">
        {/* LEFT PANEL */}
        <div className="w-full xl:w-2/3 flex flex-col gap-6">
          {/* USER CARDS COUNTERS */}
          <div className="flex gap-4 justify-between flex-wrap">
            <Suspense fallback={<UserCardSkeleton />}>
              <UserCard type="admin" />
            </Suspense>
            <Suspense fallback={<UserCardSkeleton />}>
              <UserCard type="teacher" />
            </Suspense>
            <Suspense fallback={<UserCardSkeleton />}>
              <UserCard type="student" />
            </Suspense>
            <Suspense fallback={<UserCardSkeleton />}>
              <UserCard type="parent" />
            </Suspense>
          </div>
          
          {/* MIDDLE CHARTS */}
          <div className="flex gap-6 flex-col lg:flex-row">
            {/* COUNT CHART */}
            <div className="w-full lg:w-1/3 h-[450px]">
              <Suspense fallback={<ChartSkeleton height="h-[450px]" />}>
                <CountChartContainer />
              </Suspense>
            </div>
            {/* ATTENDANCE CHART */}
            <div className="w-full lg:w-2/3 h-[450px]">
              <Suspense fallback={<ChartSkeleton height="h-[450px]" />}>
                <AttendanceChartContainer />
              </Suspense>
            </div>
          </div>
          {/* BOTTOM CHART */}
          <div className="w-full h-[500px]">
            <Suspense fallback={<ChartSkeleton height="h-[500px]" />}>
              <FinanceChart />
            </Suspense>
          </div>
        </div>
        
        {/* RIGHT PANEL */}
        <div className="w-full xl:w-1/3 flex flex-col gap-6">
          <Suspense fallback={<CalendarSkeleton />}>
            <EventCalendarContainer searchParams={searchParams} />
          </Suspense>
          <Announcements />
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
