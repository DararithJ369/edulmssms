export const dynamic = "force-dynamic";

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
  CheckCircle2,
  ClipboardList
} from "lucide-react";
import { normalizeRole } from "@/lib/auth";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import StatusBadge from "@/components/StatusBadge";

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
    <div className="flex-1 p-6 space-y-6 bg-[#F7F8FA] min-h-screen relative font-sans text-left transition-all duration-300 animate-fade-in">
      {/* PAGE HEADER */}
      <PageHeader
        eyebrow="Homework Submission Portals"
        title="Assignments & Tasks"
        breadcrumbs={[{ label: "Assignments" }]}
        actions={
          (role === "admin" || role === "teacher") && (
            <FormContainer table="assignment" type="create" triggerText="Add Assignment" />
          )
        }
      />

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
        <div className="space-y-3 w-full">
          {data.map((item) => {
            const isDone = role === "student" ? submittedAssignmentIds.has(item.id) : false;
            return (
              <div 
                key={item.id} 
                className="relative flex items-center justify-between p-5 bg-card hover:bg-card border border-border/60 hover:border-brand/45 rounded-3xl transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-sm hover:-translate-y-[1px] group overflow-hidden"
              >
                {/* Left Active/Hover Indicator Bar */}
                <span className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-3xl bg-brand opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
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
        <EmptyState
          icon={ClipboardList}
          title="No Assignments Found"
          description="Assigned tasks and homework portals will appear here. Start by creating an assignment."
          action={
            (role === "admin" || role === "teacher") && (
              <FormContainer table="assignment" type="create" triggerText="Add Assignment" />
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

export default AssignmentListPage;