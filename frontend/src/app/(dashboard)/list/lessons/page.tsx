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
            <div className="flex items-center bg-[#8b5cf6] text-white hover:bg-[#7c3aed] font-extrabold text-xs rounded-xl transition-all shadow-md shadow-violet-500/10 active:scale-[0.98] overflow-hidden">
              <span className="pl-4 pr-1 py-2 flex items-center gap-1.5">
                <Plus className="h-4 w-4" />
                <span>Add Lesson</span>
              </span>
              <FormContainer table="lesson" type="create" />
            </div>
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
                className="flex items-center justify-between p-4 bg-[#f8fafc]/50 dark:bg-muted/5 border border-border/40 hover:border-border/85 rounded-2xl transition-all shadow-sm group"
              >
                <div className="flex items-center gap-4 max-w-[70%]">
                  {/* Blue Moodle Page Icon */}
                  <div className="h-9 w-9 rounded-xl bg-sky-100 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 border border-sky-200/50">
                    <BookOpen className="h-5 w-5" />
                  </div>

                  <div className="flex flex-col text-left gap-0.5">
                    <Link 
                      href={`/list/lessons/${item.id}`}
                      className="text-sm font-extrabold text-foreground tracking-tight leading-snug hover:text-[#0038A8] dark:hover:text-[#4f88ef] transition-colors"
                    >
                      {item.title}
                    </Link>

                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-semibold flex-wrap">
                      {item.course_name && (
                        <span className="flex items-center gap-1 text-[#0038A8] dark:text-[#4f88ef] font-bold">
                          <Layers className="h-3 w-3" />
                          <span>{item.course_name} • {item.module_name || `Module #${item.order}`}</span>
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-[#0038A8] dark:text-[#4f88ef] font-mono">
                        <Tag className="h-3 w-3" />
                        <span>Syllabus Order: {item.order || 1}</span>
                      </span>
                      {item.duration && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-sky-500" />
                          <span>Duration: {item.duration}</span>
                        </span>
                      )}
                      {item.material_type && (
                        <span className="flex items-center gap-1 uppercase tracking-wider text-[8px] bg-sky-100/50 dark:bg-sky-950/20 px-2 py-0.5 rounded border border-sky-200/20 text-sky-600 dark:text-sky-400">
                          {item.material_type}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Side Actions and Completion tracking */}
                <div className="flex items-center gap-4">
                  {/* Dynamic actions for admins */}
                  {role === "admin" && (
                    <div className="flex items-center gap-1 select-none opacity-40 group-hover:opacity-100 transition-opacity">
                      <FormContainer table="lesson" type="update" data={item} />
                      <FormContainer table="lesson" type="delete" id={item.id} />
                    </div>
                  )}

                  <Link href={`/list/lessons/${item.id}`}>
                    <button className="px-3.5 py-1.5 bg-[#0038A8]/10 hover:bg-[#0038A8]/20 border border-[#0038A8]/20 text-[#0038A8] font-bold text-[9px] rounded-lg shadow-sm transition-colors active:scale-[0.98]">
                      Open Activity
                    </button>
                  </Link>

                  {/* Completion Status check circle */}
                  {isDone ? (
                    <div className="h-5.5 w-5.5 rounded-full border border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-sm" title="Done: View activity">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </div>
                  ) : (
                    <div className="h-5.5 w-5.5 rounded-full border border-dashed border-gray-400 dark:border-gray-700 flex items-center justify-center shrink-0 shadow-sm" title="To do: View activity">
                      <div className="h-1.5 w-1.5 rounded-full bg-gray-400" />
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
