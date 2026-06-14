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
import { Globe } from "lucide-react";
import { getImageUrl } from "@/lib/image-url";
import { normalizeRole } from "@/lib/auth";
import { getInitials, getInitialsColor } from "@/lib/avatar";

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
    <div className="flex-1 p-6 space-y-6 bg-[#F7F8FA] min-h-screen relative font-sans text-left">
      {/* MOODLE BREADCRUMB */}
      <div className="flex items-center gap-1 text-[11px] font-extrabold text-muted-foreground uppercase tracking-wider mb-2 select-none">
        <Link href="/" className="hover:text-foreground flex items-center gap-1">
          <Globe className="h-3 w-3" />
          Home
        </Link>
        <span>/</span>
        <span className="text-foreground">Students</span>
      </div>

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 select-none mb-6">
        <div>
          <span className="text-xs font-extrabold text-[#0038A8] uppercase tracking-wider font-mono">
            Student Members Directory
          </span>
          <h1 className="text-xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-tight mt-0.5">
            All Enrolled Students
          </h1>
        </div>

        {/* Administration Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {role === "admin" && (
            <FormContainer table="student" type="create" triggerText="Add Student" />
          )}
        </div>
      </div>

      {/* SEARCH AND FILTER UTILITY */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-3 select-none">
        <div className="flex items-center gap-2 text-xs font-extrabold text-muted-foreground">
          <span className="px-2.5 py-1 bg-white dark:bg-muted border border-border/80 text-foreground rounded-lg shadow-sm">
            {count} Total Students
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <TableSearch />
          <StudentFilterSort classes={classes} grades={grades} />
        </div>
      </div>

      {/* STUDENTS CARD LIST */}
      {data.length > 0 ? (
        <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.01)] space-y-3">
          {data.map((item) => (
            <div
              key={item.id}
              className="relative flex items-center justify-between p-5 bg-card/65 hover:bg-card border border-border/50 hover:border-[#0038A8]/25 rounded-3xl transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.02)] hover:-translate-y-[1px] group overflow-hidden"
            >
              {/* Left Active/Hover Indicator Bar */}
              <span className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-3xl bg-[#0038A8] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="flex items-center gap-4 max-w-[70%] z-10">
                {/* Profile Image Circular Container */}
                {(() => {
                  const resolvedUrl = getImageUrl(item.profile_image || item.image);
                  const { bg, text } = getInitialsColor(item.username);
                  return (
                    <div
                      className="h-10 w-10 rounded-full shrink-0 shadow-sm overflow-hidden flex items-center justify-center select-none"
                      style={resolvedUrl ? undefined : { backgroundColor: bg }}
                    >
                      {resolvedUrl ? (
                        <img
                          src={resolvedUrl}
                          alt={item.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span
                          className="text-xs font-black tracking-wide leading-none"
                          style={{ color: text }}
                        >
                          {getInitials(item.username)}
                        </span>
                      )}
                    </div>
                  );
                })()}

                <div className="flex flex-col text-left gap-1">
                  <Link
                    href={`/list/students/${item.id}`}
                    className="text-sm font-extrabold text-foreground tracking-tight leading-snug hover:text-[#0038A8] dark:hover:text-[#4f88ef] transition-colors"
                  >
                    {item.username}
                  </Link>

                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap font-medium">
                    <span>{item.email}</span>
                    <span className="text-muted-foreground/40">•</span>
                    <span className="capitalize">{item.role?.name || "student"}</span>
                  </div>
                </div>
              </div>

              {/* Right Side Actions Dropdown */}
              <div className="flex items-center gap-4 z-10">
                <TableRowActions
                  id={item.id}
                  table="student"
                  viewUrl={`/list/students/${item.id}`}
                  editData={item}
                  role={role}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-card border border-border/60 rounded-3xl p-12 text-center text-muted-foreground select-none">
          <div className="h-12 w-12 rounded-full mx-auto mb-3 flex items-center justify-center text-sm font-black bg-[#161c2e] text-white">ST</div>
          <p className="text-sm font-bold">No students registered in database.</p>
        </div>
      )}

      {/* PAGINATION PANEL */}
      <div className="bg-card border border-border/60 rounded-3xl p-4 shadow-sm flex justify-center select-none shrink-0">
        <Pagination page={p} count={count} />
      </div>
    </div>
  );
};

export default StudentListPage;
