export const dynamic = "force-dynamic";

import FormContainer from "@/components/FormContainer";
import TableRowActions from "@/components/TableRowActions";
import Pagination from "@/components/Pagination";
import TableSearch from "@/components/TableSearch";
import { serverFetch } from "@/lib/server-api";
import Link from "next/link";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { cookies } from "next/headers";
import { GraduationCap } from "lucide-react";
import { normalizeRole } from "@/lib/auth";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import StatusBadge from "@/components/StatusBadge";
import ListFilterSort from "@/components/ListFilterSort";
import Avatar from "@/components/Avatar";


type TeacherList = {
  id: string;
  username: string;
  email: string;
  image?: string | null;
  profile_image?: string | null;
  role?: { name: string };
};

const TeacherListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const cookieStore = cookies();
  const role = normalizeRole(cookieStore.get("user_role")?.value);

  const { page, classId, department, sortBy, sortOrder } = searchParams;

  const p = page ? parseInt(page) : 1;

  const exactToken = cookieStore.get("access_token")?.value || cookieStore.get("token")?.value || "";
  const fetchOptions = { token: exactToken };

  let data: TeacherList[] = [];
  let count = 0;

  if (classId) {
    const teacherIds = new Set<string>();

    // 1. Get class details for supervisor_id
    const classDetail = await serverFetch<any>(`/classes/${classId}`, fetchOptions).catch(() => null);
    if (classDetail?.supervisor_id) {
      teacherIds.add(classDetail.supervisor_id);
    }

    // 2. Get sessions for teacher_id
    const sessions = await serverFetch<any[]>(`/classes/${classId}/sessions`, fetchOptions).catch(() => []);
    if (sessions) {
      sessions.forEach((s: any) => {
        if (s.teacher_id) teacherIds.add(s.teacher_id);
        if (s.teacher?.id) teacherIds.add(s.teacher.id);
      });
    }

    // 3. Get course instructors
    let courseIds: number[] = [];
    const students = await serverFetch<any[]>(`/classes/${classId}/students`, fetchOptions).catch(() => []);
    if (students && students.length > 0) {
      const studentId = students[0].id || students[0].user_id;
      const overview = await serverFetch<any>(`/students/${studentId}/overview`, fetchOptions).catch(() => null);
      if (overview && overview.courses) {
        courseIds = overview.courses.map((c: any) => Number(c.course_id));
      }
    }

    if (courseIds.length > 0) {
      const coursesRes = await serverFetch<{ data: any[] }>(`/courses?limit=100`, fetchOptions).catch(() => ({ data: [] }));
      const allCourses = coursesRes.data || [];
      allCourses.forEach((c: any) => {
        if (courseIds.includes(Number(c.id)) && c.instructor_id) {
          teacherIds.add(c.instructor_id);
        }
      });
    }

    const response = await serverFetch<{ data: TeacherList[]; meta?: { total?: number } }>(
      `/users/instructors?limit=100`,
      fetchOptions
    ).catch(() => ({ data: [], meta: { total: 0 } }));

    const allTeachers = response.data || [];
    const filteredTeachers = allTeachers.filter((t) => teacherIds.has(t.id));
    count = filteredTeachers.length;
    data = filteredTeachers.slice((p - 1) * ITEM_PER_PAGE, p * ITEM_PER_PAGE);
  } else {
    const deptParam = department ? `&department=${encodeURIComponent(department)}` : "";
    const sortByParam = sortBy ? `&sort_by=${sortBy}` : "";
    const sortOrderParam = sortOrder ? `&sort_order=${sortOrder}` : "";
    const response = await serverFetch<{ data: TeacherList[]; meta?: { total?: number } }>(
      `/users/instructors?page=${p}&limit=${ITEM_PER_PAGE}${deptParam}${sortByParam}${sortOrderParam}`,
      fetchOptions
    ).catch(() => ({ data: [], meta: { total: 0 } }));
    data = response.data || [];
    count = response.meta?.total ?? 0;
  }

  return (
    <div className="flex-1 p-6 space-y-6 bg-[#F7F8FA] min-h-screen relative font-sans text-left transition-all duration-300 animate-fade-in">
      {/* PAGE HEADER */}
      <PageHeader
        eyebrow="Faculty Staff Directory"
        title="All Academic Instructors"
        breadcrumbs={[{ label: "Teachers" }]}
        actions={
          role === "admin" && (
            <FormContainer table="teacher" type="create" triggerText="Add Teacher" />
          )
        }
      />

      {/* SEARCH AND FILTER UTILITY */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-3 select-none">
        <div className="flex items-center gap-2 text-xs font-extrabold text-muted-foreground">
          <span className="px-2.5 py-1 bg-white dark:bg-muted border border-border/80 text-foreground rounded-lg shadow-sm">
            {count} Total Instructors
          </span>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <TableSearch />
          <ListFilterSort
            filters={[
              {
                key: "department",
                label: "Department",
                allLabel: "All Departments",
                options: [
                  { id: "Computer Science", label: "Computer Science" },
                  { id: "Mathematics", label: "Mathematics" },
                  { id: "Physics", label: "Physics" },
                  { id: "Chemistry", label: "Chemistry" },
                  { id: "Biology", label: "Biology" },
                ],
              },
            ]}
            sortOptions={[
              { label: "Default Order", value: "" },
              { label: "Name (A-Z)", value: "username-asc" },
              { label: "Name (Z-A)", value: "username-desc" },
              { label: "Phone (Asc)", value: "phone-asc" },
            ]}
          />

        </div>
      </div>

      {/* TEACHERS TABLE */}
      {data.length > 0 ? (
        <div className="bg-white border border-border/60 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.01)] overflow-hidden w-full">
          <div className="w-full overflow-x-auto">
            <div className="min-w-[800px] flex flex-col">
              {/* TABLE HEADER */}
              <div className="flex items-center h-12 px-6 bg-slate-50/50 border-b border-border/60 text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider select-none">
                <div className="flex-1 min-w-[200px]">Name</div>
                <div className="w-56 shrink-0">Subject</div>
                <div className="flex-1 min-w-[180px]">Email</div>
                <div className="w-24 shrink-0 text-right">Edit</div>
              </div>

              {/* TABLE ROWS */}
              <div className="divide-y divide-border/60">
                {data.map((item) => {
                  const hash = item.username.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
                  const mockSubject = ["Linear Algebra", "Computer Science", "Database Systems", "Web Architecture", "Cyber Security", "Software Engineering", "Machine Learning"][hash % 7];

                  return (
                    <div 
                      key={item.id} 
                      className="flex items-center h-16 px-6 hover:bg-slate-50/15 transition-all duration-200"
                    >
                      {/* Name (Avatar + Username) */}
                      <div className="flex-1 min-w-[200px] flex items-center gap-3">
                        <Avatar username={item.username} image={item.profile_image || item.image} />

                        <Link
                          href={`/list/teachers/${item.id}`}
                          className="text-sm font-extrabold text-foreground tracking-tight truncate hover:text-brand transition-colors"
                        >
                          {item.username}
                        </Link>
                      </div>

                      {/* Subject */}
                      <div className="w-56 shrink-0 text-left">
                        <span className="px-2.5 py-1 border border-slate-200 bg-slate-50 text-slate-700 text-xs font-bold rounded-lg">
                          {mockSubject}
                        </span>
                      </div>

                      {/* Email */}
                      <div className="flex-1 min-w-[180px] text-left truncate text-xs font-medium text-slate-500">
                        {item.email}
                      </div>

                      {/* Actions */}
                      <div className="w-24 shrink-0 flex items-center justify-end">
                        <TableRowActions
                          id={item.id}
                          table="teacher"
                          viewUrl={`/list/teachers/${item.id}`}
                          editData={item}
                          role={role}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={GraduationCap}
          title="No Academic Instructors Registered"
          description="Enrolled teacher profiles will appear here. Start by creating a teacher profile."
          action={
            role === "admin" && (
              <FormContainer table="teacher" type="create" triggerText="Add Teacher" />
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

export default TeacherListPage;
