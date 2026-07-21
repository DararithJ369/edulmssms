export const dynamic = "force-dynamic";

import FormContainer from "@/components/FormContainer";
import TableRowActions from "@/components/TableRowActions";
import Pagination from "@/components/Pagination";
import prisma from "@/lib/prisma";
import TableSearch from "@/components/TableSearch";
import { serverFetch } from "@/lib/server-api";
import { ITEM_PER_PAGE } from "@/lib/settings";
import Link from "next/link";
import { cookies } from "next/headers";
import { Plus, School, Users } from "lucide-react";
import { normalizeRole } from "@/lib/auth";
import PageHeader from "@/components/PageHeader";
import ListFilterSort from "@/components/ListFilterSort";


type ClassList = {
  id: number;
  name: string;
  capacity?: number | null;
  grade_id: number;
  supervisor_id: string;
  supervisor_name?: string;
  academic_year: string;
};

const ClassListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const cookieStore = cookies();
  const role = normalizeRole(cookieStore.get("user_role")?.value);

  const { page, gradeId, supervisorId, sortBy, sortOrder } = searchParams;
  const p = page ? parseInt(page) : 1;

  const response = await serverFetch<{ data: ClassList[]; meta?: { total?: number } }>(
    `/classes?page=${p}&limit=${ITEM_PER_PAGE}`
  ).catch(() => ({
    data: [],
    meta: { total: 0 }
  }));

  const rawData = response.data || [];

  const classGrades = await prisma.grade.findMany({
    select: { id: true, level: true },
  });
  const classTeachers = await prisma.teacher.findMany({
    select: { id: true, name: true, surname: true },
  });

  let filteredData = rawData;
  if (gradeId) {
    filteredData = filteredData.filter((item) => String(item.grade_id) === gradeId);
  }
  if (supervisorId) {
    filteredData = filteredData.filter((item) => item.supervisor_id === supervisorId);
  }
  if (sortBy) {
    const isAsc = sortOrder !== "desc";
    filteredData = [...filteredData].sort((a, b) => {
      if (sortBy === "name") {
        return isAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      }
      if (sortBy === "capacity") {
        return isAsc ? (a.capacity || 0) - (b.capacity || 0) : (b.capacity || 0) - (a.capacity || 0);
      }
      return 0;
    });
  }

  const count = filteredData.length;
  const relatedData = { teachers: classTeachers, grades: classGrades };

  return (
    <div className="flex-1 p-6 space-y-6 bg-[#F7F8FA] min-h-screen relative font-sans text-left">
      {/* PAGE HEADER */}
      <PageHeader
        eyebrow="Academic Classroom Catalog"
        title="Classroom Divisions"
        breadcrumbs={[{ label: "Classes" }]}
        actions={
          role === "admin" && (
            <FormContainer table="class" type="create" triggerText="Add Class" />
          )
        }
      />

      {/* FILTER & SEARCH UTILITY */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-3 select-none">
        <div className="flex items-center gap-2 text-xs font-extrabold text-muted-foreground">
          <span className="px-2.5 py-1 bg-white dark:bg-muted border border-border/80 text-foreground rounded-lg shadow-sm">
            {count} Total Classes
          </span>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <TableSearch />
          <ListFilterSort
            filters={[
              {
                key: "gradeId",
                label: "Year Level",
                allLabel: "All Year Levels",
                options: classGrades.map((g) => ({ id: g.id, label: `Year Level ${g.level}` })),
              },
              {
                key: "supervisorId",
                label: "Supervisor",
                allLabel: "All Supervisors",
                options: classTeachers.map((t) => ({ id: t.id, label: `${t.name} ${t.surname}` })),
              },
            ]}
            sortOptions={[
              { label: "Default Order", value: "" },
              { label: "Class Name (A-Z)", value: "name-asc" },
              { label: "Class Name (Z-A)", value: "name-desc" },
              { label: "Capacity (Lowest)", value: "capacity-asc" },
              { label: "Capacity (Highest)", value: "capacity-desc" },
            ]}
          />
        </div>
      </div>

      {/* CLASSES CARD LIST */}
      {filteredData.length > 0 ? (
        <div className="space-y-3 w-full">
          {filteredData.map((item) => {
            return (
              <div 
                key={item.id} 
                className="relative flex items-center justify-between p-5 bg-card hover:bg-card border border-border/60 hover:border-brand/45 rounded-3xl transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-sm hover:-translate-y-[1px] group overflow-hidden"
              >
                {/* Left Active/Hover Indicator Bar */}
                <span className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-3xl bg-brand opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="flex items-center gap-4 max-w-[70%] z-10">
                  <div className="flex flex-col text-left gap-1">
                    <span className="text-sm font-extrabold text-foreground tracking-tight leading-snug group-hover:text-brand dark:group-hover:text-brand-light transition-colors">
                      Class {item.name}
                    </span>

                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap font-medium">
                      <span className="text-[#0038A8] dark:text-[#4f88ef] font-bold font-sans">
                        Year Level {item.grade_id}
                      </span>
                      <span className="text-muted-foreground/40">•</span>
                      <span className="font-sans">Capacity: {item.capacity ?? "Unlimited"} students</span>
                      <span className="text-muted-foreground/40">•</span>
                      <span className="font-sans">Supervisor: {item.supervisor_name || item.supervisor_id}</span>
                      {item.academic_year && (
                        <>
                          <span className="text-muted-foreground/40">•</span>
                          <span className="font-sans text-emerald-600 dark:text-emerald-400 font-bold">{item.academic_year}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Side Actions Dropdown */}
                <div className="flex items-center gap-3 z-10">
                  <TableRowActions
                    id={item.id}
                    table="class"
                    viewUrl={`/list/classes/${item.id}`}
                    editData={item}
                    relatedData={relatedData}
                    role={role}
                  />
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-card border border-border/60 rounded-3xl p-12 text-center text-muted-foreground select-none">
          <School className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-bold">No academic classes registered in database.</p>
        </div>
      )}

      {/* PAGINATION PANEL */}
      <div className="bg-card border border-border/60 rounded-3xl p-4 shadow-sm flex justify-center select-none shrink-0">
        <Pagination page={p} count={count} />
      </div>
    </div>
  );
};

export default ClassListPage;
