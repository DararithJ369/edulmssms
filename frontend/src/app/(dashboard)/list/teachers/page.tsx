import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import TableSearch from "@/components/TableSearch";
import { serverFetch } from "@/lib/server-api";
import Image from "next/image";
import Link from "next/link";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { cookies } from "next/headers";
import { Globe, GraduationCap, ListFilter, ArrowUpDown } from "lucide-react";

const normalizeRole = (role: string | null | undefined) => {
  if (role === "instructor") {
    return "teacher";
  }

  return role ?? "";
};

type TeacherList = {
  id: string;
  username: string;
  email: string;
  image?: string | null;
  role?: { name: string };
};

const TeacherListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const cookieStore = cookies();
  const role = normalizeRole(cookieStore.get("user_role")?.value);

  const { page } = searchParams;

  const p = page ? parseInt(page) : 1;

  const response = await serverFetch<{ data: TeacherList[]; meta?: { total?: number } }>(
    `/users/instructors?page=${p}&limit=${ITEM_PER_PAGE}`
  );

  const data = response.data || [];
  const count = response.meta?.total ?? 0;

  return (
    <div className="flex-1 p-6 space-y-6 bg-[#F7F8FA] min-h-screen relative font-sans text-left">
      {/* MOODLE BREADCRUMB */}
      <div className="flex items-center gap-1 text-[11px] font-extrabold text-muted-foreground uppercase tracking-wider mb-2 select-none">
        <Link href="/" className="hover:text-foreground flex items-center gap-1">
          <Globe className="h-3 w-3" />
          Home
        </Link>
        <span>/</span>
        <span className="text-foreground">Teachers</span>
      </div>

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 select-none mb-6">
        <div>
          <span className="text-xs font-extrabold text-[#0038A8] uppercase tracking-wider font-mono">
            Faculty Staff Directory
          </span>
          <h1 className="text-xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-tight mt-0.5">
            All Academic Instructors
          </h1>
        </div>

        {/* Administration Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {role === "admin" && (
            <FormContainer table="teacher" type="create" triggerText="Add Teacher" />
          )}
        </div>
      </div>

      {/* SEARCH AND FILTER UTILITY */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-3 select-none">
        <div className="flex items-center gap-2 text-xs font-extrabold text-muted-foreground">
          <span className="px-2.5 py-1 bg-white dark:bg-muted border border-border/80 text-foreground rounded-lg shadow-sm">
            {count} Total Instructors
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

      {/* INSTRUCTORS CARD LIST */}
      {data.length > 0 ? (
        <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.01)] space-y-3">
          {data.map((item) => (
            <div
              key={item.id}
              className="relative flex items-center justify-between p-5 bg-card/65 hover:bg-card border border-border/50 hover:border-orange-500/25 rounded-3xl transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.02)] hover:-translate-y-[1px] group overflow-hidden"
            >
              {/* Left Active/Hover Indicator Bar */}
              <span className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-3xl bg-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="flex items-center gap-4 max-w-[70%] z-10">
                {/* Profile Image Squircle Container */}
                <div className="h-10 w-10 rounded-2xl bg-orange-50 border border-orange-100 dark:bg-orange-950/20 dark:border-orange-950/30 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0 shadow-sm transition-all duration-300 group-hover:scale-105 overflow-hidden">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.username}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <GraduationCap className="h-5 w-5" />
                  )}
                </div>

                <div className="flex flex-col text-left gap-1">
                  <Link
                    href={`/list/teachers/${item.id}`}
                    className="text-sm font-extrabold text-foreground tracking-tight leading-snug hover:text-[#0038A8] dark:hover:text-[#4f88ef] transition-colors"
                  >
                    {item.username}
                  </Link>

                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap font-medium">
                    <span>{item.email}</span>
                    <span className="text-muted-foreground/40">•</span>
                    <span className="capitalize">{item.role?.name || "teacher"}</span>
                  </div>
                </div>
              </div>

              {/* Right Side Actions */}
              <div className="flex items-center gap-4 z-10">
                {/* Dynamic actions for admins */}
                {role === "admin" && (
                  <div className="flex items-center gap-1 select-none opacity-40 group-hover:opacity-100 transition-opacity">
                    <FormContainer table="teacher" type="delete" id={item.id} />
                  </div>
                )}

                <Link href={`/list/teachers/${item.id}`}>
                  <button className="px-4 py-1.5 bg-[#0038A8]/10 hover:bg-[#0038A8]/20 border border-[#0038A8]/20 text-[#0038A8] dark:text-sky-300 font-extrabold text-[9px] rounded-lg shadow-sm transition-colors active:scale-[0.98] uppercase tracking-wider">
                    View Profile
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-card border border-border/60 rounded-3xl p-12 text-center text-muted-foreground select-none">
          <GraduationCap className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-bold">No academic instructors registered in database.</p>
        </div>
      )}

      {/* PAGINATION PANEL */}
      <div className="bg-card border border-border/60 rounded-3xl p-4 shadow-sm flex justify-center select-none shrink-0">
        <Pagination page={p} count={count} />
      </div>
    </div>
  );
};

export default TeacherListPage;
