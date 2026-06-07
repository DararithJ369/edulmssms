import FormContainer from "@/components/FormContainer";
import TableRowActions from "@/components/TableRowActions";
import Pagination from "@/components/Pagination";
import TableSearch from "@/components/TableSearch";
import { serverFetch } from "@/lib/server-api";
import { ITEM_PER_PAGE } from "@/lib/settings";
import Link from "next/link";
import { cookies } from "next/headers";
import { 
  Globe, 
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

  const { page, classId } = searchParams;
  const p = page ? parseInt(page) : 1;

  const exactToken = cookieStore.get("access_token")?.value || cookieStore.get("token")?.value || "";
  const fetchOptions = { token: exactToken };

  let data: LessonList[] = [];
  let count = 0;

  if (classId) {
    let courseIds: number[] = [];
    const students = await serverFetch<any[]>(`/classes/${classId}/students`, fetchOptions).catch(() => []);
    if (students && students.length > 0) {
      const studentId = students[0].id || students[0].user_id;
      const overview = await serverFetch<any>(`/students/${studentId}/overview`, fetchOptions).catch(() => null);
      if (overview && overview.courses) {
        courseIds = overview.courses.map((c: any) => Number(c.course_id));
      }
    }

    const lessonsResponse = await serverFetch<{
      data: LessonList[];
      meta: { total: number };
    }>(`/lessons?limit=1000`, fetchOptions).catch(() => ({
      data: [],
      meta: { total: 0 }
    }));

    const allLessons = lessonsResponse.data || [];
    const filteredLessons = allLessons.filter((item) => {
      const cId = item.course_id || item.course?.id;
      return cId ? courseIds.includes(Number(cId)) : false;
    });

    count = filteredLessons.length;
    data = filteredLessons.slice((p - 1) * ITEM_PER_PAGE, p * ITEM_PER_PAGE);
  } else {
    const lessonsResponse = await serverFetch<{
      data: LessonList[];
      meta: { total: number };
    }>(`/lessons?page=${p}&limit=${ITEM_PER_PAGE}`, fetchOptions).catch(() => ({
      data: [],
      meta: { total: 0 }
    }));

    data = lessonsResponse.data || [];
    count = lessonsResponse.meta?.total ?? 0;
  }

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
    <div className="flex-1 p-6 space-y-6 bg-[#F7F8FA] min-h-screen relative font-sans text-left">
      {/* MOODLE BREADCRUMB */}
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-wider font-bold select-none">
        <Link href="/" className="hover:text-foreground flex items-center gap-1">
          <Globe className="h-3 w-3" />
          Home
        </Link>
        <span>/</span>
        <span className="text-foreground">My Lessons</span>
      </div>

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
        <div>
          <span className="text-xs font-extrabold text-[#0038A8] uppercase tracking-wider font-mono">
            Syllabus Activity Database
          </span>
          <h1 className="text-xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-tight mt-0.5">
            Lectures & Page Activities
          </h1>
        </div>

        {/* Administration Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {(role === "admin" || role === "teacher") && (
            <FormContainer table="lesson" type="create" triggerText="Add Lesson" />
          )}
        </div>
      </div>

      {/* FILTER & SEARCH UTILITY */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-3 select-none">
        <div className="flex items-center gap-2 text-xs font-extrabold text-muted-foreground">
          <span className="px-2.5 py-1 bg-white dark:bg-muted border border-border/80 text-foreground rounded-lg shadow-sm">
            {count} Total Activities
          </span>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <TableSearch />
          <button className="w-8 h-8 flex items-center justify-center rounded-xl bg-background border border-border/80 hover:bg-accent text-muted-foreground/80 transition-colors" title="Filters">
            <ListFilter className="h-4 w-4" />
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded-xl bg-background border border-border/80 hover:bg-accent text-muted-foreground/80 transition-colors" title="Sort Options">
            <ArrowUpDown className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* LESSON ACTIVITIES LIST */}
      {data.length > 0 ? (
        <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.01)] space-y-3">
          {data.map((item) => {
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
                className="relative flex flex-col sm:flex-row sm:items-center justify-between p-5 gap-4 bg-card/65 hover:bg-card border border-border/50 hover:border-sky-500/25 rounded-3xl transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.01)] group overflow-hidden"
              >
                {/* Left Accent indicator strip */}
                <span className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-l-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${isFileResource ? "bg-emerald-500" : "bg-sky-500"}`} />
                
                <div className="flex items-start gap-4 max-w-full sm:max-w-[75%] z-10">
                  {/* Dynamic Activity Icon Layout */}
                  <div className={`h-10 w-10 rounded-2xl border flex items-center justify-center shrink-0 shadow-sm transition-all duration-300 group-hover:scale-105 ${
                    isFileResource 
                      ? "bg-emerald-50 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-950/30 text-emerald-600 dark:text-emerald-400" 
                      : "bg-sky-50 border-sky-100 dark:bg-sky-950/20 dark:border-sky-950/30 text-sky-600 dark:text-sky-400"
                  }`}>
                    {isFileResource ? <FileUp className="h-5 w-5" /> : <BookOpen className="h-5 w-5" />}
                  </div>

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
        <div className="bg-card border border-border/60 rounded-3xl p-12 text-center text-muted-foreground select-none">
          <BookOpen className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-bold">No syllabus lessons registered in database.</p>
        </div>
      )}

      {/* PAGINATION PANEL */}
      <div className="bg-card border border-border/60 rounded-3xl p-4 shadow-sm flex justify-center select-none shrink-0">
        <Pagination page={p} count={count} />
      </div>
    </div>
  );
};

export default LessonListPage;