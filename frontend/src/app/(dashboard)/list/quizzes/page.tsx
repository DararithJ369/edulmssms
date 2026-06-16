import Pagination from "@/components/Pagination";
import TableSearch from "@/components/TableSearch";
import TableRowActions from "@/components/TableRowActions";
import ListFilterSort from "@/components/ListFilterSort";
import { serverFetch } from "@/lib/server-api";
import { ITEM_PER_PAGE } from "@/lib/settings";
import Link from "next/link";
import { cookies } from "next/headers";
import { 
  Globe, 
  CheckCircle2,
  Plus
} from "lucide-react";

const normalizeRole = (role: string | null | undefined) => {
  if (role === "instructor") return "teacher";
  return role ?? "";
};

type QuizList = {
  id: number;
  title: string;
  course_id: number;
  lesson_id: number | null;
  due_date: string;
  course_name?: string | null;
  lesson_title?: string | null;
  module_name?: string | null;
};

const QuizListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const cookieStore = cookies();
  const role = normalizeRole(cookieStore.get("user_role")?.value);

  const { page, courseId, sortBy, sortOrder } = searchParams;
  const p = page ? parseInt(page) : 1;

  const exactToken = cookieStore.get("access_token")?.value || cookieStore.get("token")?.value || "";
  const fetchOptions = { token: exactToken };

  let data: QuizList[] = [];
  let count = 0;
  let completedQuizIds = new Set<number>();

  if (role === "student") {
    try {
      const resultsResponse = await serverFetch<{
        data: Array<{ quiz_id: number }>;
      }>(`/results?type=quiz&limit=100`, fetchOptions);
      
      const resultsData = resultsResponse?.data || [];
      completedQuizIds = new Set<number>(
        resultsData.map((result) => Number(result.quiz_id))
      );
    } catch (error) {
      console.error("Failed to fetch user quiz submission records:", error);
    }
  }

  // Fetch courses for filter options
  const coursesResponse = await serverFetch<{
    data: Array<{ id: number; course_name: string; course_code: string }>;
  }>("/courses?limit=100", fetchOptions).catch(() => ({ data: [] }));
  const courses = coursesResponse.data || [];

  const queryParams = new URLSearchParams();
  queryParams.set("page", String(p));
  queryParams.set("limit", String(ITEM_PER_PAGE));
  if (courseId) {
    queryParams.set("course_id", courseId);
  }
  if (sortBy) queryParams.set("sort_by", sortBy);
  if (sortOrder) queryParams.set("sort_order", sortOrder);

  const quizzesResponse = await serverFetch<{
    data: QuizList[];
    meta: { total: number };
  }>(`/quizzes?${queryParams.toString()}`, fetchOptions).catch(() => ({
    data: [],
    meta: { total: 0 }
  }));

  data = quizzesResponse.data || [];
  count = quizzesResponse.meta?.total ?? 0;

  return (
    <div className="flex-1 p-6 space-y-6 bg-[#F7F8FA] min-h-screen relative font-sans text-left">
      {/* MOODLE BREADCRUMB */}
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-wider font-bold select-none">
        <Link href="/" className="hover:text-foreground flex items-center gap-1">
          <Globe className="h-3 w-3" />
          Home
        </Link>
        <span>/</span>
        <span className="text-foreground">My Quizzes</span>
      </div>

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
        <div>
          <span className="text-xs font-extrabold text-[#0038A8] uppercase tracking-wider font-mono">
            Interactive Evaluations
          </span>
          <h1 className="text-xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-tight mt-0.5">
            Quizzes & Automated Feedback
          </h1>
        </div>

        {/* Action Button for Lecturers/Admins */}
        {(role === "admin" || role === "teacher") && (
          <Link href="/list/quizzes/create">
            <button className="px-4 py-2 bg-[#0038A8] hover:bg-[#002D86] text-white text-xs font-black rounded-xl transition-all shadow-md shadow-blue-500/10 flex items-center gap-1.5 active:scale-[0.98]">
              <Plus className="h-4 w-4" /> Create Quiz
            </button>
          </Link>
        )}
      </div>

      {/* FILTER & SEARCH UTILITY */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-3 select-none">
        <div className="flex items-center gap-2 text-xs font-extrabold text-muted-foreground">
          <span className="px-2.5 py-1 bg-white dark:bg-muted border border-border/80 text-foreground rounded-lg shadow-sm">
            {count} Total Quizzes
          </span>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <TableSearch />
          <ListFilterSort
            filters={[
              {
                key: "courseId",
                label: "Course",
                allLabel: "All Courses",
                options: courses.map((c) => ({ id: c.id, label: `${c.course_name} (${c.course_code})` })),
              },
            ]}
            sortOptions={[
              { label: "Default Order", value: "" },
              { label: "Title (A-Z)", value: "title-asc" },
              { label: "Title (Z-A)", value: "title-desc" },
              { label: "Due Date (Earliest)", value: "due_date-asc" },
              { label: "Due Date (Latest)", value: "due_date-desc" },
            ]}
          />
        </div>
      </div>

      {/* QUIZ ACTIVITIES LIST */}
      {data.length > 0 ? (
        <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.01)] space-y-3">
          {data.map((item) => {
            const isDone = completedQuizIds.has(item.id);
            return (
              <div 
                key={item.id} 
                className="flex items-center justify-between p-4 bg-[#fbf5fc]/40 dark:bg-muted/5 border border-border/40 hover:border-violet-300/50 dark:hover:border-violet-950/30 rounded-2xl transition-all shadow-sm group animate-fade-in"
              >
                <div className="flex items-center gap-4 max-w-[70%] w-full">
                  <div className="flex flex-col text-left gap-0.5 w-full">
                    <span className="text-sm font-extrabold text-foreground tracking-tight leading-snug group-hover:text-[#0038A8] transition-colors">
                      {item.title}
                    </span>

                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap font-medium">
                      <span className="text-[#0038A8] dark:text-[#4f88ef] font-semibold font-sans">
                        {item.course_name || `Course #${item.course_id}`}
                      </span>
                      {item.module_name && (
                        <>
                          <span className="text-muted-foreground/40">•</span>
                          <span className="text-violet-600 font-sans">{item.module_name}</span>
                        </>
                      )}
                      {item.lesson_id && (
                        <>
                          <span className="text-muted-foreground/40">•</span>
                          <span className="text-violet-600 font-sans">{item.lesson_title || `Lesson #${item.lesson_id}`}</span>
                        </>
                      )}
                      <span className="text-muted-foreground/40">•</span>
                      <span className="text-gray-500 font-sans">
                        Due: {new Intl.DateTimeFormat("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }).format(new Date(item.due_date))}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <TableRowActions
                    id={item.id}
                    table="quiz"
                    editData={item}
                    role={role}
                  />

                  {role === "student" ? (
                    <Link href={`/list/quizzes/${item.id}`}>
                      <button className="px-3.5 py-1.5 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 text-violet-700 dark:text-violet-400 font-bold text-[9px] rounded-lg shadow-sm transition-colors active:scale-[0.98]">
                        {isDone ? "Review Attempt" : "Attempt Quiz"}
                      </button>
                    </Link>
                  ) : (
                    <Link href={`/list/quizzes/${item.id}/submissions`}>
                      <button className="px-3.5 py-1.5 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 text-violet-700 dark:text-violet-400 font-bold text-[9px] rounded-lg shadow-sm transition-colors active:scale-[0.98]">
                        Review Submissions
                      </button>
                    </Link>
                  )}

                  {role === "student" && (
                    isDone ? (
                      <div className="h-5.5 w-5.5 rounded-full border border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-sm" title="Completed">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </div>
                    ) : (
                      <div className="h-5.5 w-5.5 rounded-full border border-dashed border-violet-400 flex items-center justify-center shrink-0 shadow-sm" title="Pending">
                        <div className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                      </div>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-card border border-border/60 rounded-3xl p-12 text-center text-muted-foreground select-none">
          <p className="text-sm font-bold">No academic quizzes registered in database.</p>
        </div>
      )}

      <div className="bg-card border border-border/60 rounded-3xl p-4 shadow-sm flex justify-center select-none shrink-0">
        <Pagination page={p} count={count} />
      </div>
    </div>
  );
};

export default QuizListPage;