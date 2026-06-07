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
  School,
  Users
} from "lucide-react";

const normalizeRole = (role: string | null | undefined) => {
  if (role === "instructor") {
    return "teacher";
  }

  return role ?? "";
};

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

  const { page } = searchParams;
  const p = page ? parseInt(page) : 1;

  const response = await serverFetch<{ data: ClassList[]; meta?: { total?: number } }>(
    `/classes?page=${p}&limit=${ITEM_PER_PAGE}`
  ).catch(() => ({
    data: [],
    meta: { total: 0 }
  }));

  const data = response.data || [];
  const count = response.meta?.total ?? 0;

  return (
    <div className="flex-1 p-6 space-y-6 bg-[#F7F8FA] min-h-screen relative font-sans text-left">
      {/* BREADCRUMB */}
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-wider font-bold select-none">
        <Link href="/" className="hover:text-foreground flex items-center gap-1">
          <Globe className="h-3 w-3" />
          Home
        </Link>
        <span>/</span>
        <span className="text-foreground">Classes</span>
      </div>

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
        <div>
          <span className="text-xs font-extrabold text-[#0038A8] uppercase tracking-wider font-mono">
            Academic Classroom Catalog
          </span>
          <h1 className="text-xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-tight mt-0.5">
            Classroom Divisions
          </h1>
        </div>

        {/* Administration Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {role === "admin" && (
            <FormContainer table="class" type="create" triggerText="Add Class" />
          )}
        </div>
      </div>

      {/* FILTER & SEARCH UTILITY */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-3 select-none">
        <div className="flex items-center gap-2 text-xs font-extrabold text-muted-foreground">
          <span className="px-2.5 py-1 bg-white dark:bg-muted border border-border/80 text-foreground rounded-lg shadow-sm">
            {count} Total Classes
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

      {/* CLASSES CARD LIST */}
      {data.length > 0 ? (
        <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.01)] space-y-3">
          {data.map((item) => {
            return (
              <div 
                key={item.id} 
                className="relative flex items-center justify-between p-5 bg-card/65 hover:bg-card border border-border/50 hover:border-indigo-500/25 rounded-3xl transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.02)] hover:-translate-y-[1px] group overflow-hidden"
              >
                {/* Left Active/Hover Indicator Bar */}
                <span className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-3xl bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="flex items-center gap-4 max-w-[70%] z-10">
                  {/* Class Icon */}
                  <div className="h-10 w-10 rounded-2xl bg-indigo-50 border border-indigo-100 dark:bg-indigo-950/20 dark:border-indigo-950/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-sm transition-all duration-300 group-hover:scale-105">
                    <School className="h-5 w-5" />
                  </div>

                  <div className="flex flex-col text-left gap-1">
                    <span className="text-sm font-extrabold text-foreground tracking-tight leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      Class {item.name}
                    </span>

                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap font-medium">
                      <span className="text-[#0038A8] dark:text-[#4f88ef] font-bold font-sans">
                        Grade {item.grade_id}
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
