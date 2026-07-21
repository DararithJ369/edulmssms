export const dynamic = "force-dynamic";

import FormContainer from "@/components/FormContainer";
import TableRowActions from "@/components/TableRowActions";
import Pagination from "@/components/Pagination";
import TableSearch from "@/components/TableSearch";
import StudentFilterSort from "@/components/StudentFilterSort";
import prisma from "@/lib/prisma";
import { serverFetch } from "@/lib/server-api";
import Link from "next/link";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { cookies } from "next/headers";
import { Users } from "lucide-react";
import { normalizeRole } from "@/lib/auth";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import StatusBadge from "@/components/StatusBadge";
import ListFilterSort from "@/components/ListFilterSort";
import Avatar from "@/components/Avatar";


type StudentList = {
  id: string;
  username: string;
  email: string;
  image?: string | null;
  profile_image?: string | null;
  role?: { name: string };
};

const StudentListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const cookieStore = cookies();
  const role = normalizeRole(cookieStore.get("user_role")?.value);

  const { page, classId, gradeId, sortBy, sortOrder } = searchParams;

  const p = page ? parseInt(page) : 1;

  const classParam = classId ? `&class_id=${classId}` : "";
  const gradeParam = gradeId ? `&grade_id=${gradeId}` : "";
  const sortByParam = sortBy ? `&sort_by=${sortBy}` : "";
  const sortOrderParam = sortOrder ? `&sort_order=${sortOrder}` : "";

  const response = await serverFetch<{ data: StudentList[]; meta?: { total?: number } }>(
    `/users/students?page=${p}&limit=${ITEM_PER_PAGE}${classParam}${gradeParam}${sortByParam}${sortOrderParam}`
  ).catch(() => ({ data: [], meta: { total: 0 } }));

  const data = response.data || [];
  const count = response.meta?.total ?? 0;

  const classes = await prisma.class.findMany({
    select: { id: true, name: true },
  });

  const grades = await prisma.grade.findMany({
    select: { id: true, level: true },
  });

  return (
    <div className="flex-1 p-6 space-y-6 bg-[#F7F8FA] min-h-screen relative font-sans text-left transition-all duration-300 animate-fade-in">
      {/* PAGE HEADER */}
      <PageHeader
        eyebrow="Student Members Directory"
        title="All Enrolled Students"
        breadcrumbs={[{ label: "Students" }]}
        actions={
          role === "admin" && (
            <FormContainer table="student" type="create" triggerText="Add Student" />
          )
        }
      />

      {/* SEARCH AND FILTER UTILITY */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-3 select-none">
        <div className="flex items-center gap-2 text-xs font-extrabold text-muted-foreground">
          <span className="px-2.5 py-1 bg-white dark:bg-muted border border-border/80 text-foreground rounded-lg shadow-sm">
            {count} Total Students
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <TableSearch />
          <ListFilterSort
            filters={[
              {
                key: "classId",
                label: "Class",
                allLabel: "All Classes",
                options: classes.map((c) => ({ id: c.id, label: c.name })),
              },
              {
                key: "gradeId",
                label: "Year Level",
                allLabel: "All Year Levels",
                options: grades.map((g) => ({ id: g.id, label: `Year Level ${g.level}` })),
              },
            ]}
            sortOptions={[
              { label: "Default Order", value: "" },
              { label: "Name (A-Z)", value: "username-asc" },
              { label: "Name (Z-A)", value: "username-desc" },
            ]}
          />
        </div>
      </div>

      {/* STUDENTS TABLE */}
      {data.length > 0 ? (
        <div className="bg-white border border-border/60 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.01)] overflow-hidden w-full">
          <div className="w-full overflow-x-auto">
            <div className="min-w-[800px] flex flex-col">
              {/* TABLE HEADER */}
              <div className="flex items-center h-12 px-6 bg-slate-50/50 border-b border-border/60 text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider select-none">
                <div className="flex-1 min-w-[200px]">Name</div>
                <div className="w-56 shrink-0">Class</div>
                <div className="flex-1 min-w-[180px]">Email</div>
                <div className="w-24 shrink-0 text-right">Edit</div>
              </div>

              {/* TABLE ROWS */}
              <div className="divide-y divide-border/60">
                {data.map((item) => {
                  const hash = item.username.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
                  const mockClass = ["Year 1 Section A", "Year 2 Section B", "Year 3 Section A", "Year 4 Section C", "Master Year 1 Section A"][hash % 5];

                  return (
                    <div 
                      key={item.id} 
                      className="flex items-center h-16 px-6 hover:bg-slate-50/15 transition-all duration-200"
                    >
                      {/* Name (Avatar + Username) */}
                      <div className="flex-1 min-w-[200px] flex items-center gap-3">
                        <Avatar username={item.username} image={item.profile_image || item.image} />
                        <Link
                          href={`/list/students/${item.id}`}
                          className="text-sm font-extrabold text-foreground tracking-tight truncate hover:text-brand transition-colors"
                        >
                          {item.username}
                        </Link>
                      </div>

                      {/* Class */}
                      <div className="w-56 shrink-0 text-left">
                        <span className="px-2.5 py-1 border border-slate-200 bg-slate-50 text-slate-700 text-xs font-bold rounded-lg">
                          {mockClass}
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
                          table="student"
                          viewUrl={`/list/students/${item.id}`}
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
          icon={Users}
          title="No Students Registered"
          description="Enrolled student profiles will appear here. Start by creating a student profile."
          action={
            role === "admin" && (
              <FormContainer table="student" type="create" triggerText="Add Student" />
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

export default StudentListPage;
