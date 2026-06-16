import FormContainer from "@/components/FormContainer";
import FormModal from "@/components/FormModal";
import TableRowActions from "@/components/TableRowActions";
import ListFilterSort from "@/components/ListFilterSort";
import Pagination from "@/components/Pagination";
import TableSearch from "@/components/TableSearch";
import { serverFetch } from "@/lib/server-api";
import { ITEM_PER_PAGE } from "@/lib/settings";
import Link from "next/link";
import { cookies } from "next/headers";
import { 
  Globe, 
  CheckCircle2
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
  
  const { page, courseId, sortBy, sortOrder } = searchParams;
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

  // Fetch courses for filter options
  const coursesResponse = await serverFetch<{
    data: Array<{ id: number; course_name: string; course_code: string }>;
  }>("/courses?limit=100", fetchOptions).catch(() => ({ data: [] }));
  const courses = coursesResponse.data || [];

  let data: AssignmentList[] = [];
  let count = 0;

  const queryParams = new URLSearchParams();
  queryParams.set("page", String(p));
  queryParams.set("limit", String(ITEM_PER_PAGE));
  if (courseId) queryParams.set("course_id", courseId);
  if (sortBy) queryParams.set("sort_by", sortBy);
  if (sortOrder) queryParams.set("sort_order", sortOrder);

  const assignmentsResponse = await serverFetch<{
    data: AssignmentList[];
    meta: { total: number };
  }>(`/assignments?${queryParams.toString()}`, fetchOptions).catch(() => ({
    data: [],
    meta: { total: 0 }
  }));
  data = assignmentsResponse.data || [];
  count = assignmentsResponse.meta?.total ?? 0;

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
              { label: "Deadline (Earliest)", value: "due_date-asc" },
              { label: "Deadline (Latest)", value: "due_date-desc" },
            ]}
          />
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
                      <span className="text-muted-foreground/40">•</span>
                      <span className="text-violet-600 font-sans">
                        {item.teacher_name || `Supervisor #${item.teacher_id}`}
                      </span>
                      <span className="text-muted-foreground/40">•</span>
                      <span className="text-gray-500 font-sans">
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

                {/* Right Side Actions */}
                <div className="flex items-center gap-4">
                  <TableRowActions
                    id={item.id}
                    table="assignment"
                    editData={item}
                    role={role}
                  />

                  {role === "student" && (
                    <Link href={`/list/assignments/${item.id}/submit`}>
                      <button className="px-3.5 py-1.5 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 text-violet-700 dark:text-violet-400 font-bold text-[9px] rounded-lg shadow-sm transition-colors active:scale-[0.98]">
                        {isDone ? "Update Submission" : "Add Submission"}
                      </button>
                    </Link>
                  )}
                  {role === "parent" && (
                    <Link href={`/list/assignments/${item.id}/submit`}>
                      <button className="px-3.5 py-1.5 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 text-violet-700 dark:text-violet-400 font-bold text-[9px] rounded-lg shadow-sm transition-colors active:scale-[0.98]">
                        View Submission
                      </button>
                    </Link>
                  )}
                  {(role === "teacher" || role === "admin") && (
                    <Link href={`/list/assignments/${item.id}/submissions`}>
                      <button className="px-3.5 py-1.5 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 text-violet-700 dark:text-violet-400 font-bold text-[9px] rounded-lg shadow-sm transition-colors active:scale-[0.98]">
                        View Submissions
                      </button>
                    </Link>
                  )}

                  {role === "student" && (
                    isDone ? (
                      <div className="h-5.5 w-5.5 rounded-full border border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-sm" title="Done: Submit assignment">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </div>
                    ) : (
                      <div className="h-5.5 w-5.5 rounded-full border border-dashed border-violet-400 flex items-center justify-center shrink-0 shadow-sm" title="To do: Submit assignment">
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