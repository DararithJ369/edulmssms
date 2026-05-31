import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import TableSearch from "@/components/TableSearch";
import { serverFetch } from "@/lib/server-api";
import { ITEM_PER_PAGE } from "@/lib/settings";
import Link from "next/link";
import { cookies } from "next/headers";
import { 
  Globe, 
  BookOpen, 
  Clock, 
  Tag, 
  Layers, 
  CheckCircle2, 
  Plus, 
  ListFilter, 
  ArrowUpDown 
} from "lucide-react";

const normalizeRole = (role: string | null | undefined) => {
  if (role === "instructor") {
    return "teacher";
  }
  return role ?? "";
};

type LessonList = {
  id: number;
  title: string;
  duration?: string | null;
  order?: number | null;
  material_type?: string | null;
  module_name?: string | null;
  course_name?: string | null;
};


const LessonListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const cookieStore = cookies();
  const role = normalizeRole(cookieStore.get("user_role")?.value);

  const { page } = searchParams;
  const p = page ? parseInt(page) : 1;

  const lessonsResponse = await serverFetch<{
    data: LessonList[];
    meta: { total: number };
  }>(`/lessons?page=${p}&limit=${ITEM_PER_PAGE}`).catch(() => ({
    data: [],
    meta: { total: 0 }
  }));

  const data = lessonsResponse.data || [];
  const count = lessonsResponse.meta?.total ?? 0;

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
          {role === "admin" && (
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
            // Mock completion check: even IDs are marked completed
            const isDone = item.id % 2 === 0;
            return (
              <div 
                key={item.id} 
                className="relative flex items-center justify-between p-5 bg-card/65 hover:bg-card border border-border/50 hover:border-sky-500/25 rounded-3xl transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.02)] hover:-translate-y-[1px] group overflow-hidden"
              >
                {/* Left Active/Hover Indicator Bar */}
                <span className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-3xl bg-sky-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="flex items-center gap-4 max-w-[70%] z-10">
                  {/* Blue Moodle Page Icon */}
                  <div className="h-10 w-10 rounded-2xl bg-sky-50 border border-sky-100 dark:bg-sky-950/20 dark:border-sky-950/30 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 shadow-sm transition-all duration-300 group-hover:scale-105">
                    <BookOpen className="h-5 w-5" />
                  </div>

                  <div className="flex flex-col text-left gap-1">
                    <Link 
                      href={`/list/lessons/${item.id}`}
                      className="text-sm font-extrabold text-foreground tracking-tight leading-snug hover:text-[#0038A8] dark:hover:text-[#4f88ef] transition-colors"
                    >
                      {item.title}
                    </Link>

                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap font-medium">
                      {item.course_name && (
                        <span className="text-[#0038A8] dark:text-[#4f88ef] font-bold">
                          {item.course_name}
                        </span>
                      )}
                      {item.course_name && <span className="text-muted-foreground/40">•</span>}
                      {item.module_name && (
                        <span>{item.module_name}</span>
                      )}
                      {(item.module_name || item.course_name) && <span className="text-muted-foreground/40">•</span>}
                      <span>Order {item.order || 1}</span>
                      {item.duration && (
                        <>
                          <span className="text-muted-foreground/40">•</span>
                          <span>{item.duration}</span>
                        </>
                      )}
                      {item.material_type && (
                        <>
                          <span className="text-muted-foreground/40">•</span>
                          <span className="uppercase text-[9px] font-extrabold tracking-wider text-sky-600 dark:text-sky-400">
                            {item.material_type}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Side Actions and Completion tracking */}
                <div className="flex items-center gap-4 z-10">
                  {/* Dynamic actions for admins */}
                  {role === "admin" && (
                    <div className="flex items-center gap-1 select-none opacity-40 group-hover:opacity-100 transition-opacity">
                      <FormContainer table="lesson" type="update" data={item} />
                      <FormContainer table="lesson" type="delete" id={item.id} />
                    </div>
                  )}

                  <Link href={`/list/lessons/${item.id}`}>
                    <button className="px-4 py-1.5 bg-[#0038A8]/10 hover:bg-[#0038A8]/20 border border-[#0038A8]/20 text-[#0038A8] dark:text-sky-300 font-extrabold text-[9px] rounded-lg shadow-sm transition-colors active:scale-[0.98] uppercase tracking-wider">
                      Open Activity
                    </button>
                  </Link>

                  {/* Completion Status check circle */}
                  {isDone ? (
                    <div className="h-5.5 w-5.5 rounded-full border border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-sm" title="Done: View activity">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </div>
                  ) : (
                    <div className="h-5.5 w-5.5 rounded-full border border-dashed border-gray-300 dark:border-gray-800 flex items-center justify-center shrink-0 shadow-sm" title="To do: View activity">
                      <div className="h-1.5 w-1.5 rounded-full bg-gray-300 dark:bg-gray-800" />
                    </div>
                  )}
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
