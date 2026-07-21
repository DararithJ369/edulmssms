export const dynamic = "force-dynamic";

import FormContainer from "@/components/FormContainer";
import TableRowActions from "@/components/TableRowActions";
import Pagination from "@/components/Pagination";
import TableSearch from "@/components/TableSearch";
import { serverFetch } from "@/lib/server-api";
import { ITEM_PER_PAGE } from "@/lib/settings";
import Link from "next/link";
import { cookies } from "next/headers";
import { 
  BookOpen, 
  CheckCircle2, 
  ListFilter, 
  ArrowUpDown,
  FileUp,
  Calendar,
  Users,
  UserCheck
} from "lucide-react";
import { normalizeRole } from "@/lib/auth";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import StatusBadge from "@/components/StatusBadge";
import ListFilterSort from "@/components/ListFilterSort";
import prisma from "@/lib/prisma";


type LessonList = {
  id: number;
  title: string;
  type?: "lesson" | "url" | "file" | null;
  day?: string | null;
  subject?: string | null;
  className?: string | null;
  teacher?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  duration?: string | null;
  order?: number | null;
  material_type?: string | null;
  module_name?: string | null;
  course_name?: string | null;
  course_id?: number | string | null; 
  module_id?: number | string | null; 
  meta_value?: string | null;
  // 🛠️ Nested API object fallbacks to ensure frontend stability
  course?: { id: number | string; course_name?: string } | null;
  module?: { id: number | string; title?: string } | null;
};

const LessonListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const cookieStore = cookies();
  const role = normalizeRole(cookieStore.get("user_role")?.value);

  const { page, classId, courseId, sortBy, sortOrder } = searchParams;
  const p = page ? parseInt(page) : 1;

  const exactToken = cookieStore.get("access_token")?.value || cookieStore.get("token")?.value || "";
  const fetchOptions = { token: exactToken };

  let rawData: LessonList[] = [];
  let count = 0;

  const queryParams = new URLSearchParams();
  queryParams.set("page", String(p));
  queryParams.set("limit", String(ITEM_PER_PAGE));
  if (classId) {
    queryParams.set("class_id", classId);
  }

  const lessonsResponse = await serverFetch<{
    data: LessonList[];
    meta: { total: number };
  }>(`/lessons?${queryParams.toString()}`, fetchOptions).catch(() => ({
    data: [],
    meta: { total: 0 }
  }));

  rawData = lessonsResponse.data || [];

  const classesList = await prisma.class.findMany({ select: { id: true, name: true } });
  const coursesRes = await serverFetch<{ data: any[] }>("/courses?limit=250", fetchOptions).catch(() => ({ data: [] }));
  const coursesList = coursesRes.data || [];

  let filteredData = rawData;
  if (courseId) {
    filteredData = filteredData.filter((item) => {
      const cId = item.course_id || item.course?.id;
      return String(cId) === courseId;
    });
  }
  if (sortBy) {
    const isAsc = sortOrder !== "desc";
    filteredData = [...filteredData].sort((a, b) => {
      if (sortBy === "name") {
        return isAsc ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title);
      }
      if (sortBy === "subject") {
        const sa = a.subject || "";
        const sb = b.subject || "";
        return isAsc ? sa.localeCompare(sb) : sb.localeCompare(sa);
      }
      return 0;
    });
  }

  count = filteredData.length;


  const formatTimeInterval = (start: string | null | undefined, end: string | null | undefined) => {
    if (!start) return null;
    try {
      const sDate = new Date(start);
      const timeStr = sDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (end) {
        const eDate = new Date(end);
        const endStr = eDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return `${timeStr} - ${endStr}`;
      }
      return timeStr;
    } catch {
      return null;
    }
  };

  return (
    <div className="flex-1 p-6 space-y-6 bg-[#F7F8FA] min-h-screen relative font-sans text-left transition-all duration-300 animate-fade-in">
      {/* PAGE HEADER */}
      <PageHeader
        eyebrow="Syllabus Activity Database"
        title="Lectures & Page Activities"
        breadcrumbs={[{ label: "Lessons" }]}
        actions={
          (role === "admin" || role === "teacher") && (
            <FormContainer table="lesson" type="create" triggerText="Add Lesson" />
          )
        }
      />

      {/* FILTER & SEARCH UTILITY */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-3 select-none">
        <div className="flex items-center gap-2 text-xs font-extrabold text-muted-foreground">
          <span className="px-2.5 py-1 bg-white dark:bg-muted border border-border/80 text-foreground rounded-lg shadow-sm">
            {count} Total Activities
          </span>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <TableSearch />
          <ListFilterSort
            filters={[
              {
                key: "classId",
                label: "Class",
                allLabel: "All Classes",
                options: classesList.map((c) => ({ id: c.id, label: c.name })),
              },
              {
                key: "courseId",
                label: "Course",
                allLabel: "All Courses",
                options: coursesList.map((c) => ({ id: c.id, label: c.course_name })),
              },
            ]}
            sortOptions={[
              { label: "Default Order", value: "" },
              { label: "Lesson Name (A-Z)", value: "name-asc" },
              { label: "Lesson Name (Z-A)", value: "name-desc" },
              { label: "Subject (A-Z)", value: "subject-asc" },
              { label: "Subject (Z-A)", value: "subject-desc" },
            ]}
          />
        </div>
      </div>

      {/* LESSON ACTIVITIES LIST */}
      {filteredData.length > 0 ? (
        <div className="space-y-3 w-full">
          {filteredData.map((item) => {
            const isDone = item.id % 2 === 0;
            const isFileResource = item.type === "file" || !!item.meta_value;
            const timeRange = formatTimeInterval(item.startTime, item.endTime);

            // 🛠️ UPGRADED: Handles both flat keys and nested backend sub-objects safely
            const finalCourseContext = item.course_id || item.course?.id || "";
            const finalModuleContext = item.module_id || item.module?.id || "";
            const finalCourseName = item.course_name || item.course?.course_name || "";
            const finalModuleName = item.module_name || item.module?.title || "";

            return (
              <div 
                key={item.id} 
                className="relative flex flex-col sm:flex-row sm:items-center justify-between p-5 gap-4 bg-card hover:bg-card border border-border/60 hover:border-brand/45 rounded-3xl transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.02)] group overflow-hidden"
              >
                {/* Left Accent indicator strip */}
                <span className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-3xl bg-brand opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="flex items-start gap-4 max-w-full sm:max-w-[75%] z-10">
                  <div className="flex flex-col text-left gap-1 min-w-0">
                    <Link 
                      href={`/list/lessons/${item.id}?courseId=${finalCourseContext}&moduleId=${finalModuleContext}`}
                      className="text-sm font-extrabold text-foreground tracking-tight leading-snug hover:text-[#0038A8] dark:hover:text-[#4f88ef] transition-colors truncate block"
                    >
                      {item.title}
                    </Link>

                    {/* Meta Info Row */}
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap font-medium leading-none pt-0.5">
                      {item.subject && (
                        <span className="text-slate-800 dark:text-slate-200 font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                          {item.subject}
                        </span>
                      )}
                      {finalCourseName && (
                        <span className="text-[#0038A8] dark:text-[#4f88ef] font-bold">
                          {finalCourseName}
                        </span>
                      )}
                      {finalModuleName && (
                        <span className="opacity-80">{finalModuleName}</span>
                      )}
                      
                      {/* Operational Schedule Meta tags */}
                      {(item.day || timeRange) && (
                        <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold bg-amber-500/5 px-1.5 py-0.5 rounded border border-amber-500/10">
                          <Calendar className="h-3 w-3" />
                          <span>{item.day ? `${item.day} ` : ""}{timeRange ? `(${timeRange})` : ""}</span>
                        </div>
                      )}

                      {/* Targeted Class Meta Tag */}
                      {item.className && (
                        <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-500/5 px-1.5 py-0.5 rounded border border-indigo-500/10">
                          <Users className="h-3 w-3" />
                          <span>{item.className}</span>
                        </div>
                      )}

                      {/* Assigned Teacher Meta Tag */}
                      {item.teacher && (
                        <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400 font-semibold bg-slate-500/5 px-1.5 py-0.5 rounded border border-slate-500/10 capitalize">
                          <UserCheck className="h-3 w-3" />
                          <span>{item.teacher}</span>
                        </div>
                      )}

                      {item.meta_value && (
                        <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 px-1.5 py-0.5 rounded max-w-[180px] truncate">
                          {item.meta_value}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Side Actions and Completion tracking */}
                <div className="flex items-center justify-between sm:justify-end gap-4 z-10 shrink-0 border-t sm:border-0 border-border/40 pt-3 sm:pt-0">
                  <TableRowActions
                    id={item.id}
                    table="lesson"
                    viewUrl={`/list/lessons/${item.id}?courseId=${finalCourseContext}&moduleId=${finalModuleContext}`}
                    editData={item}
                    role={role}
                  />

                  <div className="flex items-center gap-3 ml-auto sm:ml-0">
                    <Link href={`/list/lessons/${item.id}?courseId=${finalCourseContext}&moduleId=${finalModuleContext}`}>
                      <button className="px-4 py-1.5 bg-[#0038A8]/10 hover:bg-[#0038A8]/20 border border-[#0038A8]/20 text-[#0038A8] dark:text-sky-300 font-extrabold text-[9px] rounded-lg shadow-sm transition-colors active:scale-[0.98] uppercase tracking-wider">
                        Open Activity
                      </button>
                    </Link>

                    {isDone ? (
                      <div className="h-6 w-6 rounded-full border border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-sm" title="Done">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </div>
                    ) : (
                      <div className="h-6 w-6 rounded-full border border-dashed border-gray-300 dark:border-gray-800 flex items-center justify-center shrink-0 shadow-sm" title="To do">
                        <div className="h-1.5 w-1.5 rounded-full bg-gray-300 dark:bg-gray-800" />
                      </div>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={BookOpen}
          title="No Lessons Found"
          description="Syllabus lectures and learning activities will appear here. Start by creating a lesson node."
          action={
            (role === "admin" || role === "teacher") && (
              <FormContainer table="lesson" type="create" triggerText="Add Lesson" />
            )
          }
        />
      )}

      {/* PAGINATION PANEL */}
      <div className="flex justify-center select-none shrink-0 pt-2">
        <Pagination page={p} count={count} />
      </div>
    </div>
  );
};

export default LessonListPage;