export const dynamic = "force-dynamic";

import FormContainer from "@/components/FormContainer";
import TableRowActions from "@/components/TableRowActions";
import Pagination from "@/components/Pagination";
import TableSearch from "@/components/TableSearch";
import { serverFetch } from "@/lib/server-api";
import { ITEM_PER_PAGE } from "@/lib/settings";
import Link from "next/link";
import { cookies } from "next/headers";
import {
  Globe,
  Plus,
  ListFilter,
  ArrowUpDown,
  BookOpen
} from "lucide-react";
import { normalizeRole } from "@/lib/auth";
import PageHeader from "@/components/PageHeader";
import ListFilterSort from "@/components/ListFilterSort";
import prisma from "@/lib/prisma";



type SubjectList = {
  id: number;
  name: string;
  code?: string | null;
  credits?: number | null;
  instructor_id?: string | null;
  instructor_name?: string | null;
  grade_id?: number | null;
  grade_name?: string | null;
  is_active?: boolean | null;
};

const SubjectListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const cookieStore = cookies();
  const role = normalizeRole(cookieStore.get("user_role")?.value);

  const { page, gradeId, sortBy, sortOrder } = searchParams;
  const p = page ? parseInt(page) : 1;

  const subjectsResponse = await serverFetch<{
    data: SubjectList[];
    meta: { total: number };
  }>(`/subjects?page=${p}&limit=${ITEM_PER_PAGE}`).catch(() => ({
    data: [],
    meta: { total: 0 }
  }));

  const rawData = subjectsResponse.data || [];

  const grades = await prisma.grade.findMany({
    select: { id: true, level: true },
  });

  let filteredData = rawData;
  if (gradeId) {
    filteredData = filteredData.filter((item) => String(item.grade_id) === gradeId);
  }
  if (sortBy) {
    const isAsc = sortOrder !== "desc";
    filteredData = [...filteredData].sort((a, b) => {
      if (sortBy === "name") {
        return isAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      }
      if (sortBy === "credits") {
        return isAsc ? (a.credits || 0) - (b.credits || 0) : (b.credits || 0) - (a.credits || 0);
      }
      return 0;
    });
  }

  const count = filteredData.length;


  return (
    <div className="flex-1 p-6 space-y-6 bg-[#F7F8FA] min-h-screen relative font-sans text-left">
      {/* PAGE HEADER */}
      <PageHeader
        eyebrow="Academic Fields database"
        title="Syllabus Subjects"
        breadcrumbs={[{ label: "Subjects" }]}
        actions={
          role === "admin" && (
            <FormContainer table="subject" type="create" triggerText="Add Subject" />
          )
        }
      />


      {/* FILTER & SEARCH UTILITY */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-3 select-none">
        <div className="flex items-center gap-2 text-xs font-extrabold text-muted-foreground">
          <span className="px-2.5 py-1 bg-white dark:bg-muted border border-border/80 text-foreground rounded-lg shadow-sm">
            {count} Total Subjects
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
                options: grades.map((g) => ({ id: g.id, label: `Year Level ${g.level}` })),
              },
            ]}
            sortOptions={[
              { label: "Default Order", value: "" },
              { label: "Subject Name (A-Z)", value: "name-asc" },
              { label: "Subject Name (Z-A)", value: "name-desc" },
              { label: "Credits (Lowest)", value: "credits-asc" },
              { label: "Credits (Highest)", value: "credits-desc" },
            ]}
          />
        </div>
      </div>

      {/* SUBJECTS CARD LIST */}
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
                      {item.name}
                    </span>

                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap font-medium">
                      {item.code && (
                        <span className="text-[#0038A8] dark:text-[#4f88ef] font-bold font-mono">
                          {item.code}
                        </span>
                      )}
                      {item.code && <span className="text-muted-foreground/40">•</span>}
                      {item.grade_name && (
                        <>
                          <span className="font-sans">{item.grade_name}</span>
                          <span className="text-muted-foreground/40">•</span>
                        </>
                      )}
                      <span className="font-sans">{item.credits ?? 0} academic credits</span>
                      <span className="text-muted-foreground/40">•</span>
                      <span className="font-sans">Lead: {item.instructor_name || "Faculty Staff"}</span>
                    </div>
                  </div>
                </div>

                {/* Right Side Actions Dropdown */}
                <div className="flex items-center gap-4 z-10">
                  <TableRowActions
                    id={item.id}
                    table="subject"
                    editData={item}
                    role={role}
                  />
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-card border border-border/60 rounded-3xl p-12 text-center text-muted-foreground select-none">
          <BookOpen className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-bold">No academic subjects registered in database.</p>
        </div>
      )}

      {/* PAGINATION PANEL */}
      <div className="bg-card border border-border/60 rounded-3xl p-4 shadow-sm flex justify-center select-none shrink-0">
        <Pagination page={p} count={count} />
      </div>
    </div>
  );
};

export default SubjectListPage;
