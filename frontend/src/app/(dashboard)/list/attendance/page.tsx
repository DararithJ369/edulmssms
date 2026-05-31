import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import TableSearch from "@/components/TableSearch";
import { serverFetch } from "@/lib/server-api";
import { ITEM_PER_PAGE } from "@/lib/settings";
import Link from "next/link";
import { cookies } from "next/headers";
import { 
  Globe, 
  Calendar, 
  Clock, 
  GraduationCap, 
  CheckCircle2, 
  Plus, 
  ListFilter, 
  ArrowUpDown,
  BookOpen,
  FileText
} from "lucide-react";

const normalizeRole = (role: string | null | undefined) => {
  if (role === "instructor") {
    return "teacher";
  }
  return role ?? "";
};

type AttendanceList = {
  id: number;
  student_id: string;
  course_id: string;
  date: string;
  status: string;
  time?: string | null;
  note?: string | null;
  student_name?: string | null;
  course_name?: string | null;
};


const AttendanceListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const cookieStore = cookies();
  const role = normalizeRole(cookieStore.get("user_role")?.value);

  const { page } = searchParams;
  const p = page ? parseInt(page) : 1;

  const attendanceResponse = await serverFetch<{
    data: AttendanceList[];
    meta: { total: number };
  }>(`/attendance?page=${p}&limit=${ITEM_PER_PAGE}`).catch(() => ({
    data: [],
    meta: { total: 0 }
  }));

  const data = attendanceResponse.data || [];
  const count = attendanceResponse.meta?.total ?? 0;

  return (
    <div className="flex-1 p-6 space-y-6 bg-[#F7F8FA] min-h-screen relative font-sans text-left">
      {/* MOODLE BREADCRUMB */}
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-wider font-bold select-none">
        <Link href="/" className="hover:text-foreground flex items-center gap-1">
          <Globe className="h-3 w-3" />
          Home
        </Link>
        <span>/</span>
        <span className="text-foreground">Attendance</span>
      </div>

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
        <div>
          <span className="text-xs font-extrabold text-[#0038A8] uppercase tracking-wider font-mono">
            Classroom Logbook Logs
          </span>
          <h1 className="text-xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-tight mt-0.5">
            Attendance Records
          </h1>
        </div>

        {/* Administration Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {(role === "admin" || role === "teacher") && (
            <FormContainer table="attendance" type="create" triggerText="Mark Attendance" />
          )}
        </div>
      </div>

      {/* FILTER & SEARCH UTILITY */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-3 select-none">
        <div className="flex items-center gap-2 text-xs font-extrabold text-muted-foreground">
          <span className="px-2.5 py-1 bg-white dark:bg-muted border border-border/80 text-foreground rounded-lg shadow-sm">
            {count} Attendance Entries
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

      {/* ATTENDANCE OUTLINE LIST */}
      {data.length > 0 ? (
        <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.01)] space-y-3">
          {data.map((item) => (
            <div 
              key={item.id} 
              className="flex items-center justify-between p-4 bg-[#f2faf9]/30 dark:bg-muted/5 border border-border/40 hover:border-teal-300/50 dark:hover:border-teal-950/30 rounded-2xl transition-all shadow-sm group"
            >
              <div className="flex items-center gap-4 max-w-[70%]">
                {/* Teal Moodle Attendance Icon */}
                <div className="h-9 w-9 rounded-xl bg-teal-100 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 border border-teal-200/50">
                  <Calendar className="h-5 w-5" />
                </div>

                <div className="flex flex-col text-left gap-0.5">
                  <span className="text-sm font-extrabold text-foreground tracking-tight leading-snug group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors">
                    {item.student_name || `Student ID: ${item.student_id}`}
                  </span>

                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-semibold flex-wrap">
                    <span className="flex items-center gap-1 text-[#0038A8] dark:text-[#4f88ef] font-bold">
                      <BookOpen className="h-3 w-3" />
                      <span>{item.course_name || `Course #${item.course_id}`}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-sky-500" />
                      <span>Time: {item.time || "08:00 AM"}</span>
                    </span>
                    {item.note && (
                      <span className="flex items-center gap-1 text-gray-500 font-medium italic">
                        <FileText className="h-3 w-3" />
                        <span>Note: {item.note}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Side Status Tags and Actions */}
              <div className="flex items-center gap-4">
                {/* Standard formatted Date */}
                <span className="text-xs font-bold text-foreground font-mono select-none">
                  {item.date}
                </span>

                {/* Status Pills */}
                {item.status === "present" ? (
                  <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 font-extrabold text-[9px] rounded-lg border border-emerald-100 dark:border-emerald-900/30 uppercase tracking-wider shadow-sm select-none">
                    Present
                  </span>
                ) : item.status === "late" ? (
                  <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 font-extrabold text-[9px] rounded-lg border border-amber-100 dark:border-amber-900/30 uppercase tracking-wider shadow-sm select-none">
                    Late
                  </span>
                ) : (
                  <span className="px-2.5 py-1 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 font-extrabold text-[9px] rounded-lg border border-red-100 dark:border-red-900/30 uppercase tracking-wider shadow-sm select-none">
                    Absent
                  </span>
                )}

                {/* Dynamic actions for admins/teachers */}
                {(role === "admin" || role === "teacher") && (
                  <div className="flex items-center gap-1 select-none opacity-40 group-hover:opacity-100 transition-opacity">
                    <FormContainer table="attendance" type="update" data={item} />
                    <FormContainer table="attendance" type="delete" id={item.id} />
                  </div>
                )}
              </div>

            </div>
          ))}
        </div>
      ) : (
        <div className="bg-card border border-border/60 rounded-3xl p-12 text-center text-muted-foreground select-none">
          <Calendar className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-bold">No attendance logbook entries registered in database.</p>
        </div>
      )}

      {/* PAGINATION PANEL */}
      <div className="bg-card border border-border/60 rounded-3xl p-4 shadow-sm flex justify-center select-none shrink-0">
        <Pagination page={p} count={count} />
      </div>
    </div>
  );
};

export default AttendanceListPage;
