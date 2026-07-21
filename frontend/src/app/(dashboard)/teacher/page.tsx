import { Suspense } from "react";
import Announcements from "@/components/Announcements";
import BigCalendarContainer from "@/components/BigCalendarContainer";
import { cookies } from "next/headers";
import Link from "next/link";
import { Plus, BookOpen, Users, GraduationCap, ClipboardList, Megaphone, Calendar } from "lucide-react";
import { CalendarSkeleton } from "@/components/student/WidgetSkeleton";
import { normalizeRole } from "@/lib/auth";
import PageHeader from "@/components/PageHeader";
import { serverFetch } from "@/lib/server-api";

const TeacherPage = async () => {
  const userId = cookies().get("user_id")?.value || null;
  const role = normalizeRole(cookies().get("user_role")?.value);

  if (!userId) {
    return (
      <div className="p-6">
        <div className="bg-card p-6 rounded-2xl border border-border/60 shadow-sm">
          <h1 className="text-xl font-bold text-foreground font-sans">Teacher Dashboard</h1>
          <p className="text-muted-foreground mt-2 text-sm">Please sign in to view your academic schedules.</p>
        </div>
      </div>
    );
  }

  // Fetch dynamic stats for the instructor
  const exactToken = cookies().get("access_token")?.value || cookies().get("token")?.value || "";
  const fetchOptions = { token: exactToken };

  const coursesRes = await serverFetch<{ data: any[] }>(`/courses?limit=100`, fetchOptions).catch(() => ({ data: [] }));
  const allCourses = coursesRes.data || [];
  const myCourses = allCourses.filter((c: any) => c.instructor_id === userId);
  const totalCourses = myCourses.length;

  const lessonsRes = await serverFetch<{ data: any[] }>(`/lessons?limit=500`, fetchOptions).catch(() => ({ data: [] }));
  const allLessons = lessonsRes.data || [];
  const myLessons = allLessons.filter((l: any) => {
    const cid = l.course_id || l.module?.course_id;
    return myCourses.some((c: any) => c.id === cid);
  });
  const totalLessons = myLessons.length;

  const totalStudents = myCourses.reduce((sum, c) => sum + (c.student_enrolled || 0), 0);

  return (
    <div className="flex-1 p-6 space-y-6 bg-[#F7F8FA] min-h-screen relative font-sans text-left transition-all duration-300 animate-fade-in">
      {/* PAGE HEADER */}
      <PageHeader
        eyebrow="Faculty Control Console"
        title="Teacher Lecture Workspace"
        breadcrumbs={[{ label: "Dashboard" }]}
        actions={
          <Link
            href="/list/courses/create"
            className="flex items-center gap-1.5 px-4 py-2 bg-brand hover:bg-brand-dark text-white text-xs font-semibold rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Create Course
          </Link>
        }
      />

      {/* STATS OVERVIEW SECTION */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Courses */}
        <div className="rounded-2xl border border-border/60 bg-card p-5 transition-all hover:shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <BookOpen className="h-4.5 w-4.5 text-brand" />
            </div>
            <span className="text-[10px] font-semibold text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
              Active Courses
            </span>
          </div>
          <p className="text-3xl font-black text-foreground tracking-tight">{totalCourses}</p>
          <p className="text-xs text-muted-foreground mt-1.5 font-medium">Courses under instruction</p>
        </div>

        {/* Lessons */}
        <div className="rounded-2xl border border-border/60 bg-card p-5 transition-all hover:shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <GraduationCap className="h-4.5 w-4.5 text-brand" />
            </div>
            <span className="text-[10px] font-semibold text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
              Syllabus Units
            </span>
          </div>
          <p className="text-3xl font-black text-foreground tracking-tight">{totalLessons}</p>
          <p className="text-xs text-muted-foreground mt-1.5 font-medium">Lecture nodes published</p>
        </div>

        {/* Students */}
        <div className="rounded-2xl border border-border/60 bg-card p-5 transition-all hover:shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <Users className="h-4.5 w-4.5 text-brand" />
            </div>
            <span className="text-[10px] font-semibold text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
              Active Registry
            </span>
          </div>
          <p className="text-3xl font-black text-foreground tracking-tight">{totalStudents}</p>
          <p className="text-xs text-muted-foreground mt-1.5 font-medium">Total enrolled attendees</p>
        </div>
      </div>

      {/* QUICK ACTIONS BAR */}
      <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quick Management Actions</h3>
        <div className="flex flex-wrap gap-2.5">
          <Link
            href="/list/assignments?action=create"
            className="flex items-center gap-2 px-4 py-2.5 border border-border/60 hover:border-brand/30 bg-slate-50/50 hover:bg-brand/5 text-slate-700 hover:text-brand text-xs font-semibold rounded-xl transition-all"
          >
            <ClipboardList className="h-4 w-4" />
            New Assignment
          </Link>
          <Link
            href="/list/announcements?action=create"
            className="flex items-center gap-2 px-4 py-2.5 border border-border/60 hover:border-brand/30 bg-slate-50/50 hover:bg-brand/5 text-slate-700 hover:text-brand text-xs font-semibold rounded-xl transition-all"
          >
            <Megaphone className="h-4 w-4" />
            New Announcement
          </Link>
          <Link
            href="/list/courses"
            className="flex items-center gap-2 px-4 py-2.5 border border-border/60 hover:border-brand/30 bg-slate-50/50 hover:bg-brand/5 text-slate-700 hover:text-brand text-xs font-semibold rounded-xl transition-all"
          >
            <BookOpen className="h-4 w-4" />
            View Gradebook
          </Link>
        </div>
      </div>

      {/* LOWER PANEL TIMETABLE */}
      <div className="flex gap-6 flex-col xl:flex-row">
        {/* LEFT TIMETABLE */}
        <div className="w-full xl:w-2/3">
          <Suspense fallback={<CalendarSkeleton />}>
            <div className="bg-card p-5 rounded-2xl border border-border/60 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2 mb-4 select-none">
                <Calendar className="h-4.5 w-4.5 text-brand" />
                Academic Timetable
              </h2>
              <div className="h-[480px]">
                <BigCalendarContainer type="teacherId" id={userId} />
              </div>
            </div>
          </Suspense>
        </div>

        {/* RIGHT ANNOUNCEMENTS */}
        <div className="w-full xl:w-1/3 flex flex-col gap-6">
          <Announcements />
        </div>
      </div>
    </div>
  );
};

export default TeacherPage;
