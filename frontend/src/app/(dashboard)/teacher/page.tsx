import Announcements from "@/components/Announcements";
import BigCalendarContainer from "@/components/BigCalendarContainer";
import { cookies } from "next/headers";
import Link from "next/link";
import { Globe, Plus } from "lucide-react";

const normalizeRole = (role: string | null | undefined) => {
  if (role === "instructor") {
    return "teacher";
  }

  return role ?? "";
};

const TeacherPage = () => {
  const userId = cookies().get("user_id")?.value || null;
  const role = normalizeRole(cookies().get("user_role")?.value);

  if (!userId) {
    return (
      <div className="p-6">
        <div className="bg-white p-6 rounded-md shadow-sm">
          <h1 className="text-xl font-semibold">Teacher dashboard</h1>
          <p className="text-gray-500 mt-2">Please sign in to view your schedule.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 space-y-6 bg-[#F7F8FA] min-h-screen relative font-sans text-left">
      {/* MOODLE BREADCRUMB */}
      <div className="flex items-center gap-1 text-[11px] font-extrabold text-muted-foreground uppercase tracking-wider mb-2 select-none">
        <Link href="/" className="hover:text-foreground flex items-center gap-1">
          <Globe className="h-3 w-3" />
          Home
        </Link>
        <span>/</span>
        <span className="text-foreground">Dashboard</span>
      </div>

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 select-none mb-6">
        <div>
          <span className="text-xs font-extrabold text-[#0038A8] uppercase tracking-wider font-mono">
            Faculty Control Console
          </span>
          <h1 className="text-xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-tight mt-0.5">
            Teacher Lecture Workspace
          </h1>
        </div>

        {/* Administration Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/list/courses/1/edit">
            <button className="px-4 py-2 bg-[#8b5cf6] text-white hover:bg-[#7c3aed] font-extrabold text-xs rounded-xl transition-all shadow-md shadow-violet-500/10 flex items-center gap-1.5 active:scale-[0.98]">
              <Plus className="h-4 w-4" />
              <span>Create New Activity</span>
            </button>
          </Link>
        </div>
      </div>

      <div className="flex gap-4 flex-col xl:flex-row">
      {/* LEFT */}
      <div className="w-full xl:w-2/3">
        <div className="h-full bg-white p-4 rounded-md">
          <h1 className="text-xl font-semibold">Schedule</h1>
          <BigCalendarContainer type="teacherId" id={userId!} />
        </div>
      </div>
      {/* RIGHT */}
      <div className="w-full xl:w-1/3 flex flex-col gap-8">
        <Announcements />
      </div>
    </div>
  </div>
);
};

export default TeacherPage;
