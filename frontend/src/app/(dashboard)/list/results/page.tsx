import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import TableSearch from "@/components/TableSearch";
import { serverFetch } from "@/lib/server-api";
import { ITEM_PER_PAGE } from "@/lib/settings";
import Link from "next/link";
import { cookies } from "next/headers";
import { 
  Globe, 
  TrendingUp, 
  Award, 
  BookOpen, 
  CheckCircle2, 
  Plus, 
  ListFilter, 
  ArrowUpDown,
  UserCheck
} from "lucide-react";

const normalizeRole = (role: string | null | undefined) => {
  if (role === "instructor") {
    return "teacher";
  }
  return role ?? "";
};

type ResultList = {
  id: number;
  student_id: string;
  assignment_id?: number | null;
  exam_id?: number | null;
  graded_by: string;
  grader_name?: string | null;
  score: number;
  total_marks: number;
  grade?: string | null;
  is_passed?: boolean | null;
  student_name?: string | null;
  assessment_title?: string | null;
};


const ResultListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const cookieStore = cookies();
  const role = normalizeRole(cookieStore.get("user_role")?.value);

  const { page } = searchParams;
  const p = page ? parseInt(page) : 1;

  const resultsResponse = await serverFetch<{
    data: ResultList[];
    meta: { total: number };
  }>(`/results?page=${p}&limit=${ITEM_PER_PAGE}`).catch(() => ({
    data: [],
    meta: { total: 0 }
  }));

  const data = resultsResponse.data || [];
  const count = resultsResponse.meta?.total ?? 0;

  return (
    <div className="flex-1 p-6 space-y-6 bg-[#F7F8FA] min-h-screen relative font-sans text-left">
      {/* MOODLE BREADCRUMB */}
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-wider font-bold select-none">
        <Link href="/" className="hover:text-foreground flex items-center gap-1">
          <Globe className="h-3 w-3" />
          Home
        </Link>
        <span>/</span>
        <span className="text-foreground">Gradebook</span>
      </div>

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
        <div>
          <span className="text-xs font-extrabold text-[#0038A8] uppercase tracking-wider font-mono">
            Academic Performance Index
          </span>
          <h1 className="text-xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-tight mt-0.5">
            Gradebook & Course Results
          </h1>
        </div>

        {/* Administration Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {(role === "admin" || role === "teacher") && (
            <FormContainer table="result" type="create" triggerText="Grade Assessment" />
          )}
        </div>
      </div>

      {/* FILTER & SEARCH UTILITY */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-3 select-none">
        <div className="flex items-center gap-2 text-xs font-extrabold text-muted-foreground">
          <span className="px-2.5 py-1 bg-white dark:bg-muted border border-border/80 text-foreground rounded-lg shadow-sm">
            {count} Graded Submissions
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

      {/* GRADEBOOK OUTLINE LIST */}
      {data.length > 0 ? (
        <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.01)] space-y-3">
          {data.map((item) => (
            <div 
              key={item.id} 
              className="flex items-center justify-between p-4 bg-[#f8fcf9]/40 dark:bg-muted/5 border border-border/40 hover:border-emerald-300/50 dark:hover:border-emerald-950/30 rounded-2xl transition-all shadow-sm group"
            >
              <div className="flex items-center gap-4 max-w-[70%]">
                {/* Emerald Moodle Grade Icon */}
                <div className="h-9 w-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200/50">
                  <TrendingUp className="h-5 w-5" />
                </div>

                <div className="flex flex-col text-left gap-0.5">
                  <span className="text-sm font-extrabold text-foreground tracking-tight leading-snug group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                    {item.assessment_title || (item.exam_id ? `Final Exam #${item.exam_id}` : `Assignment Project #${item.assignment_id}`)}
                  </span>

                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap font-medium">
                      <span className="text-[#0038A8] dark:text-[#4f88ef] font-sans">
                        Student: {item.student_name || item.student_id}
                      </span>
                      <span className="text-muted-foreground/40">•</span>
                      <span className="font-sans">
                        Graded By: {item.grader_name || item.graded_by || "System Autograded"}
                      </span>
                    </div>
                </div>
              </div>

              {/* Right Side Grade Scores and Actions */}
              <div className="flex items-center gap-4">
                {/* Score Ratio display pill */}
                <div className="flex flex-col items-end gap-0.5 select-none">
                  <span className="text-xs font-black text-foreground">
                    Score: {item.score} / {item.total_marks}
                  </span>
                  <span className="text-[10px] font-bold text-muted-foreground">
                    Grade Mark: {item.grade || "A"}
                  </span>
                </div>

                {/* Pass or Fail tags */}
                {item.is_passed ? (
                  <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 font-extrabold text-[9px] rounded-lg border border-emerald-100 dark:border-emerald-900/30 uppercase tracking-wider">
                    Passed
                  </span>
                ) : (
                  <span className="px-2.5 py-1 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 font-extrabold text-[9px] rounded-lg border border-red-100 dark:border-red-900/30 uppercase tracking-wider">
                    Failed
                  </span>
                )}

                {/* Dynamic actions for admins/teachers */}
                {(role === "admin" || role === "teacher") && (
                  <div className="flex items-center gap-1 select-none opacity-40 group-hover:opacity-100 transition-opacity">
                    <FormContainer table="result" type="update" data={item} />
                    <FormContainer table="result" type="delete" id={item.id} />
                  </div>
                )}
              </div>

            </div>
          ))}
        </div>
      ) : (
        <div className="bg-card border border-border/60 rounded-3xl p-12 text-center text-muted-foreground select-none">
          <TrendingUp className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-bold">No academic evaluation results registered in database.</p>
        </div>
      )}

      {/* PAGINATION PANEL */}
      <div className="bg-card border border-border/60 rounded-3xl p-4 shadow-sm flex justify-center select-none shrink-0">
        <Pagination page={p} count={count} />
      </div>
    </div>
  );
};

export default ResultListPage;
