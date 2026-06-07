import Pagination from "@/components/Pagination";
import TableSearch from "@/components/TableSearch";
import { serverFetch } from "@/lib/server-api";
import { ITEM_PER_PAGE } from "@/lib/settings";
import Link from "next/link";
import { cookies } from "next/headers";
import { 
  Globe, 
  CheckSquare, 
  Clock, 
  BookOpen, 
  GraduationCap, 
  CheckCircle2,
  ListFilter,
  ArrowUpDown
} from "lucide-react";
import { normalizeRole } from "@/lib/auth";

type QuizList = {
  id: number;
  title: string;
  course_id: number;
  lesson_id: number | null;
  due_date: string;
  course_name?: string | null;
  lesson_title?: string | null;
};


const QuizListPage = async ({
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

  // Fetch real completion status for students
  let completedQuizIds = new Set<number>();
  if (role === "student") {
    const resultsResponse = await serverFetch<{
      data: Array<{ quiz_id: number | null }>;
      meta: { total: number };
    }>(`/results?type=quiz&limit=1000`, fetchOptions).catch(() => ({
      data: [],
      meta: { total: 0 },
    }));
    completedQuizIds = new Set(
      (resultsResponse.data || [])
        .filter((r) => r.quiz_id != null)
        .map((r) => r.quiz_id as number)
    );
  }

  let data: QuizList[] = [];
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

    const quizzesResponse = await serverFetch<{
      data: QuizList[];
      meta: { total: number };
    }>(`/quizzes?limit=1000`, fetchOptions).catch(() => ({
      data: [],
      meta: { total: 0 },
    }));
    const allQuizzes = quizzesResponse.data || [];

    const filteredQuizzes = allQuizzes.filter((item) => {
      return item.course_id ? courseIds.includes(Number(item.course_id)) : false;
    });

    count = filteredQuizzes.length;
    data = filteredQuizzes.slice((p - 1) * ITEM_PER_PAGE, p * ITEM_PER_PAGE);
  } else {
    const quizzesResponse = await serverFetch<{
      data: QuizList[];
      meta: { total: number };
    }>(`/quizzes?page=${p}&limit=${ITEM_PER_PAGE}`, fetchOptions).catch(() => ({
      data: [],
      meta: { total: 0 },
    }));

    data = quizzesResponse.data || [];
    count = quizzesResponse.meta?.total ?? 0;
  }

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
        {(role === "admin" || role === "teacher") && (
          <Link href="/list/quizzes/create">
            <button className="flex items-center gap-1.5 px-4 py-2 bg-[#0038A8] text-white rounded-xl text-xs font-black hover:bg-[#0038A8]/90 transition-colors">
              <GraduationCap className="h-4 w-4" />
              Create Quiz
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
          <button className="w-8 h-8 flex items-center justify-center rounded-xl bg-background border border-border/80 hover:bg-accent text-muted-foreground/80 transition-colors" title="Filters">
            <ListFilter className="h-4 w-4" />
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded-xl bg-background border border-border/80 hover:bg-accent text-muted-foreground/80 transition-colors" title="Sort Options">
            <ArrowUpDown className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* QUIZ ACTIVITIES LIST */}
      {data.length > 0 ? (
        <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.01)] space-y-3">
          {data.map((item) => {
            const isDone = role === "student" ? completedQuizIds.has(item.id) : false;
            return (
              <div 
                key={item.id} 
                className="relative flex items-center justify-between p-5 bg-card/65 hover:bg-card border border-border/50 hover:border-red-500/25 rounded-3xl transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.02)] hover:-translate-y-[1px] group overflow-hidden"
              >
                {/* Left Active/Hover Indicator Bar */}
                <span className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-3xl bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="flex items-center gap-4 max-w-[70%] z-10">
                  {/* Red Moodle Quiz Icon */}
                  <div className="h-10 w-10 rounded-2xl bg-red-50 border border-red-100 dark:bg-red-950/20 dark:border-red-950/30 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 shadow-sm transition-all duration-300 group-hover:scale-105">
                    <CheckSquare className="h-5 w-5" />
                  </div>

                  <div className="flex flex-col text-left gap-1">
                    <span className="text-sm font-extrabold text-foreground tracking-tight leading-snug group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                      {item.title}
                    </span>

                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap font-medium">
                      <span className="text-[#0038A8] dark:text-[#4f88ef] font-bold font-sans">
                        {item.course_name || `Course #${item.course_id}`}
                      </span>
                      {item.lesson_id && (
                        <>
                          <span className="text-muted-foreground/40">•</span>
                          <span className="text-sky-600 dark:text-sky-400 font-sans">{item.lesson_title || `Lesson #${item.lesson_id}`}</span>
                        </>
                      )}
                      <span className="text-muted-foreground/40">•</span>
                      <span className="text-red-500 font-sans">
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

                {/* Right Side Actions and Completion tracking */}
                <div className="flex items-center gap-4 z-10">
                  <Link href={`/list/quizzes/${item.id}`}>
                    <button className="px-4 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 text-red-700 dark:text-red-400 font-extrabold text-[9px] rounded-lg shadow-sm transition-colors active:scale-[0.98] uppercase tracking-wider">
                      Attempt Quiz
                    </button>
                  </Link>

                  {/* Completion Status check circle */}
                  {isDone ? (
                    <div className="h-5.5 w-5.5 rounded-full border border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-sm" title="Done: Receive a grade">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </div>
                  ) : (
                    <div className="h-5.5 w-5.5 rounded-full border border-dashed border-red-400 flex items-center justify-center shrink-0 shadow-sm" title="To do: Receive a grade">
                      <div className="h-1.5 w-1.5 rounded-full bg-red-400" />
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-card border border-border/60 rounded-3xl p-12 text-center text-muted-foreground select-none">
          <CheckSquare className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-bold">No academic quizzes registered in database.</p>
        </div>
      )}

      {/* PAGINATION PANEL */}
      <div className="bg-card border border-border/60 rounded-3xl p-4 shadow-sm flex justify-center select-none shrink-0">
        <Pagination page={p} count={count} />
      </div>
    </div>
  );
};

export default QuizListPage;
