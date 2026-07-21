import FormContainer from "@/components/FormContainer";
import TableRowActions from "@/components/TableRowActions";
import Pagination from "@/components/Pagination";
import TableSearch from "@/components/TableSearch";
import { serverFetch } from "@/lib/server-api";
import { ITEM_PER_PAGE } from "@/lib/settings";
import Link from "next/link";
import { cookies } from "next/headers";
import { 
  TrendingUp, 
  Award, 
  BookOpen, 
  CheckCircle2, 
  Plus, 
  ListFilter, 
  ArrowUpDown,
  UserCheck
} from "lucide-react";
import { normalizeRole } from "@/lib/auth";
import PageHeader from "@/components/PageHeader";
import ListFilterSort from "@/components/ListFilterSort";
import prisma from "@/lib/prisma";

import EmptyState from "@/components/EmptyState";
import StatusBadge from "@/components/StatusBadge";

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

  const { page, studentId, sortBy, sortOrder } = searchParams;
  const p = page ? parseInt(page) : 1;

  const exactToken = cookieStore.get("access_token")?.value || cookieStore.get("token")?.value || "";
  const fetchOptions = { token: exactToken };

  let rawData: ResultList[] = [];
  let count = 0;

  const queryParams = new URLSearchParams();
  queryParams.set("page", String(p));
  queryParams.set("limit", String(ITEM_PER_PAGE));
  if (studentId) {
    queryParams.set("student_id", studentId);
  }

  const resultsResponse = await serverFetch<{
    data: ResultList[];
    meta: { total: number };
  }>(`/results?${queryParams.toString()}`, fetchOptions).catch(() => ({
    data: [],
    meta: { total: 0 }
  }));
  rawData = resultsResponse.data || [];

  const studentsList = await prisma.student.findMany({
    select: { id: true, name: true, surname: true }
  });

  let filteredData = rawData;
  if (sortBy) {
    const isAsc = sortOrder !== "desc";
    filteredData = [...filteredData].sort((a, b) => {
      if (sortBy === "score") {
        return isAsc ? a.score - b.score : b.score - a.score;
      }
      if (sortBy === "student") {
        const sa = a.student_name || "";
        const sb = b.student_name || "";
        return isAsc ? sa.localeCompare(sb) : sb.localeCompare(sa);
      }
      return 0;
    });
  }

  count = filteredData.length;


  return (
    <div className="flex-1 p-6 space-y-6 bg-[#F7F8FA] min-h-screen relative font-sans text-left transition-all duration-300 animate-fade-in">
      {/* PAGE HEADER */}
      <PageHeader
        eyebrow="Academic Performance Index"
        title="Gradebook & Course Results"
        breadcrumbs={[{ label: "Results" }]}
        actions={
          (role === "admin" || role === "teacher") && (
            <FormContainer table="result" type="create" triggerText="Grade Assessment" />
          )
        }
      />

      {/* FILTER & SEARCH UTILITY */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-3 select-none">
        <div className="flex items-center gap-2 text-xs font-extrabold text-muted-foreground">
          <span className="px-2.5 py-1 bg-white dark:bg-muted border border-border/80 text-foreground rounded-lg shadow-sm">
            {count} Graded Submissions
          </span>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <TableSearch />
          <ListFilterSort
            filters={[
              {
                key: "studentId",
                label: "Student",
                allLabel: "All Students",
                options: studentsList.map((s) => ({ id: s.id, label: `${s.name} ${s.surname}` })),
              },
            ]}
            sortOptions={[
              { label: "Default Order", value: "" },
              { label: "Score (Lowest First)", value: "score-asc" },
              { label: "Score (Highest First)", value: "score-desc" },
              { label: "Student Name (A-Z)", value: "student-asc" },
              { label: "Student Name (Z-A)", value: "student-desc" },
            ]}
          />
        </div>
      </div>

      {/* GRADEBOOK OUTLINE LIST */}
      {filteredData.length > 0 ? (
        <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.01)] space-y-3">
          {filteredData.map((item) => (
            <div 
              key={item.id} 
              className="flex items-center justify-between p-4 bg-[#f8fcf9]/40 dark:bg-muted/5 border border-border/40 hover:border-emerald-300/50 dark:hover:border-emerald-950/30 rounded-2xl transition-all shadow-sm group"
            >
              <div className="flex items-center gap-4 max-w-[70%]">
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
                  <StatusBadge variant="passed" />
                ) : (
                  <StatusBadge variant="failed" />
                )}

                <TableRowActions
                  id={item.id}
                  table="result"
                  editData={item}
                  role={role}
                />
              </div>

            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Award}
          title="No Results Found"
          description="Syllabus evaluations and exam scorecards will appear here."
          action={
            (role === "admin" || role === "teacher") && (
              <FormContainer table="result" type="create" triggerText="Grade Assessment" />
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

export default ResultListPage;
