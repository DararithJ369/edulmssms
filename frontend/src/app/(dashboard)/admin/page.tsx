import { Suspense } from "react";
import Announcements from "@/components/Announcements";
import AttendanceChartContainer from "@/components/AttendanceChartContainer";
import CountChartContainer from "@/components/CountChartContainer";
import EventCalendarContainer from "@/components/EventCalendarContainer";
import FinanceChart from "@/components/FinanceChart";
import UserCard from "@/components/UserCard";
import Link from "next/link";
import { Plus } from "lucide-react";
import { UserCardSkeleton, ChartSkeleton, CalendarSkeleton } from "@/components/student/WidgetSkeleton";
import PageHeader from "@/components/PageHeader";

const AdminPage = ({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) => {
  return (
    <div className="flex-1 p-6 space-y-6 bg-[#F7F8FA] min-h-screen relative font-sans text-left transition-all duration-300 animate-fade-in">
      {/* PAGE HEADER */}
      <PageHeader
        eyebrow="System Administration"
        title="Admin Overview"
        breadcrumbs={[{ label: "Dashboard" }]}
        actions={
          <Link
            href="/list/courses/create"
            className="flex items-center gap-1.5 px-4 py-2 bg-brand hover:bg-brand-dark text-white text-xs font-semibold rounded-xl transition-all shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Create Course
          </Link>
        }
      />

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
            <div className="w-full lg:w-1/3 h-[450px]">
              <Suspense fallback={<ChartSkeleton height="h-[450px]" />}>
                <CountChartContainer />
              </Suspense>
            </div>
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
          <Suspense fallback={<div className="h-48 bg-card border border-border/60 rounded-2xl animate-pulse" />}>
            <Announcements />
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
