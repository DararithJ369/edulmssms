import FormContainer from "@/components/FormContainer";
import FormModal from "@/components/FormModal";
import TableRowActions from "@/components/TableRowActions";
import Pagination from "@/components/Pagination";
import TableSearch from "@/components/TableSearch";
import { serverFetch } from "@/lib/server-api";
import { ITEM_PER_PAGE } from "@/lib/settings";
import Link from "next/link";
import { cookies } from "next/headers";
import { 
  Globe, 
  FileSpreadsheet, 
  Clock, 
  GraduationCap, 
  CheckCircle2, 
  Plus, 
  ListFilter, 
  ArrowUpDown,
  User
} from "lucide-react";
import { normalizeRole } from "@/lib/auth";

type AssignmentList = {
  id: number;
  title: string;
  course_id: number;
  teacher_id: string;
  due_date: string;
  description?: string | null;
  attachment_file?: string | null;
  course_name?: string | null;
  teacher_name?: string | null;
};

const AssignmentListPage = async ({
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

  // Fetch real submission status for students
  let submittedAssignmentIds = new Set<number>();
  if (role === "student") {
    const submissions = await serverFetch<Array<{ submission_type: string; reference_id: number }>>(
      `/submissions/my`, fetchOptions
    ).catch(() => []);
    submittedAssignmentIds = new Set(
      (submissions || [])
        .filter((s) => s.submission_type === "assignment")
        .map((s) => s.reference_id)
    );
  }

  let data: AssignmentList[] = [];
  let count = 0;

  if (classId) {
    const assignmentsResponse = await serverFetch<{
      data: AssignmentList[];
      meta: { total: number };
    }>(`/assignments?page=${p}&limit=${ITEM_PER_PAGE}&class_id=${classId}`, fetchOptions).catch(() => ({
      data: [],
      meta: { total: 0 }
    }));
    data = assignmentsResponse.data || [];
    count = assignmentsResponse.meta?.total ?? 0;
  } else {
    const assignmentsResponse = await serverFetch<{
      data: AssignmentList[];
      meta: { total: number };
    }>(`/assignments?page=${p}&limit=${ITEM_PER_PAGE}`, fetchOptions).catch(() => ({
      data: [],
      meta: { total: 0 }
    }));
    data = assignmentsResponse.data || [];
    count = assignmentsResponse.meta?.total ?? 0;
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
        <span className="text-foreground">My Assignments</span>
      </div>

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
        <div>
          <span className="text-xs font-extrabold text-[#0038A8] uppercase tracking-wider font-mono">
            Homework Submission Portals
          </span>
          <h1 className="text-xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-tight mt-0.5">
            Assignments & Tasks
          </h1>
        </div>

        {/* Administration Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {(role === "admin" || role === "teacher") && (
            <FormContainer table="assignment" type="create" triggerText="Add Assignment" />
          )}
        </div>
      </div>

      {/* FILTER & SEARCH UTILITY */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-3 select-none">
        <div className="flex items-center gap-2 text-xs font-extrabold text-muted-foreground">
          <span className="px-2.5 py-1 bg-white dark:bg-muted border border-border/80 text-foreground rounded-lg shadow-sm">
            {count} Total Assignments
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

      {/* ASSIGNMENT ACTIVITIES LIST */}
      {data.length > 0 ? (
        <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.01)] space-y-3">
          {data.map((item) => {
            const isDone = role === "student" ? submittedAssignmentIds.has(item.id) : false;
            return (
              <div 
                key={item.id} 
                className="relative flex items-center justify-between p-5 bg-card/65 hover:bg-card border border-border/50 hover:border-amber-500/25 rounded-3xl transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.02)] hover:-translate-y-[1px] group overflow-hidden"
              >
                {/* Left Active/Hover Indicator Bar */}
                <span className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-3xl bg-amber-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="flex items-center gap-4 max-w-[70%] z-10">
                  <div className="flex flex-col text-left gap-1">
                    <span className="text-sm font-extrabold text-foreground tracking-tight leading-snug group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                      {item.title}
                    </span>

                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap font-medium">
                      <span className="text-[#0038A8] dark:text-[#4f88ef] font-bold font-sans">
                        {item.course_name || `Course #${item.course_id}`}
                      </span>
                      <span className="text-muted-foreground/40">•</span>
                      <span className="text-sky-600 dark:text-sky-400 font-sans">
                        {item.teacher_name || `Supervisor #${item.teacher_id}`}
                      </span>
                      <span className="text-muted-foreground/40">•</span>
                      <span className="text-amber-600 font-sans">
                        Deadline: {new Intl.DateTimeFormat("en-US", {
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
                  <TableRowActions
                    id={item.id}
                    table="assignment"
                    editData={item}
                    role={role}
                  />

                  {role === "student" && (
                    <Link href={`/list/assignments/${item.id}/submit`}>
                      <button className="px-4 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 text-amber-700 dark:text-amber-400 font-extrabold text-[9px] rounded-lg shadow-sm transition-colors active:scale-[0.98] uppercase tracking-wider">
                        {isDone ? "Update Submission" : "Add Submission"}
                      </button>
                    </Link>
                  )}
                  {role === "parent" && (
                    <Link href={`/list/assignments/${item.id}/submit`}>
                      <button className="px-4 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 text-amber-700 dark:text-amber-400 font-extrabold text-[9px] rounded-lg shadow-sm transition-colors active:scale-[0.98] uppercase tracking-wider">
                        View Submission
                      </button>
                    </Link>
                  )}
                  {(role === "teacher" || role === "admin") && (
                    <Link href={`/list/assignments/${item.id}/submissions`}>
                      <button className="px-4 py-1.5 bg-[#0038A8]/10 hover:bg-[#0038A8]/20 border border-[#0038A8]/25 text-[#0038A8] dark:text-blue-400 font-extrabold text-[9px] rounded-lg shadow-sm transition-colors active:scale-[0.98] uppercase tracking-wider">
                        View Submissions
                      </button>
                    </Link>
                  )}

                  {/* Programmatic Role-conditioned Completion Check UI */}
                  {role === "student" && (
                    isDone ? (
                      <div className="h-5.5 w-5.5 rounded-full border border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-sm" title="Done: Submit assignment">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </div>
                    ) : (
                      <div className="h-5.5 w-5.5 rounded-full border border-dashed border-amber-400 flex items-center justify-center shrink-0 shadow-sm" title="To do: Submit assignment">
                        <div className="h-1.5 w-1.5 rounded-full bg-amber-400" />
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
          <FileSpreadsheet className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-bold">No assignments registered in database.</p>
        </div>
      )}

      {/* PAGINATION PANEL */}
      <div className="bg-card border border-border/60 rounded-3xl p-4 shadow-sm flex justify-center select-none shrink-0">
        <Pagination page={p} count={count} />
      </div>
    </div>
  );
};

export default AssignmentListPage;