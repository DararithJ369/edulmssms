import Link from "next/link";
import { cookies } from "next/headers";
import { 
  Globe, User, Calendar, Award, BookOpen, 
  Activity, CheckCircle2, Heart, Phone
} from "lucide-react";
import prisma from "@/lib/prisma";
import BigCalendarContainer from "@/components/BigCalendarContainer";
import Announcements from "@/components/Announcements";

const normalizeRole = (role: string | null | undefined) => {
  if (role === "instructor") {
    return "teacher";
  }
  return role ?? "";
};

type ParentDashboardProps = {
  searchParams: { studentId?: string };
};

export default async function ParentDashboardPage({ searchParams }: ParentDashboardProps) {
  const cookieStore = cookies();
  const currentUserId = cookieStore.get("user_id")?.value || null;
  const role = normalizeRole(cookieStore.get("user_role")?.value);

  if (!currentUserId) {
    return (
      <div className="p-6">
        <div className="bg-white p-6 rounded-md shadow-sm">
          <h1 className="text-xl font-semibold">Parent Dashboard</h1>
          <p className="text-gray-500 mt-2">Please sign in to view your children&apos;s schedule.</p>
        </div>
      </div>
    );
  }

  // Fetch parent profile metadata
  const parentProfile = (await prisma.parent.findUnique({
    where: { id: currentUserId }
  })) as any;

  const parentName = parentProfile?.username || "Parent";
  const parentMetadata = parentProfile?.parent_profile;

  // Fetch linked student profiles via Prisma client proxy (which intercepts and calls /parents/{parentId}/students)
  const students = (await prisma.student.findMany({
    where: { parentId: currentUserId }
  })) as any[];

  const studentIdParam = searchParams.studentId;
  const activeStudent = students.find(s => s.user_id === studentIdParam) || students[0] || null;

  // Fetch active child attendance & results using Prisma Client Proxy
  const attendance = activeStudent 
    ? await prisma.attendance.findMany({ where: { studentId: activeStudent.user_id } }) 
    : [];

  const results = activeStudent 
    ? await prisma.result.findMany({ where: { studentId: activeStudent.user_id } }) 
    : [];

  // Calculate Attendance Stats
  const totalAtt = attendance.length;
  const presentAtt = attendance.filter(a => a.present).length;
  const attendancePercentage = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 100;

  return (
    <div className="flex-1 p-6 space-y-6 bg-[#F7F8FA] min-h-screen relative font-sans text-left">
      {/* MOODLE BREADCRUMB */}
      <div className="flex items-center gap-1 text-[11px] font-extrabold text-muted-foreground uppercase tracking-wider mb-2 select-none">
        <Link href="/" className="hover:text-foreground flex items-center gap-1">
          <Globe className="h-3 w-3" />
          Home
        </Link>
        <span>/</span>
        <span className="text-foreground">Parent Dashboard</span>
      </div>

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 select-none mb-6">
        <div>
          <span className="text-xs font-extrabold text-[#0038A8] uppercase tracking-wider font-mono">
            Parental Oversight Hub • {parentMetadata?.relationship || "GUARDIAN"}
          </span>
          <h1 className="text-xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-tight mt-0.5">
            Welcome, {parentName}
          </h1>
        </div>

        {/* Dynamic linked children tab selector (Pure Link anchors for Server Component) */}
        <div className="flex flex-wrap gap-1.5 bg-white dark:bg-muted p-1 border border-border rounded-xl shadow-sm shrink-0">
          {students.map((std) => (
            <Link
              key={std.id}
              href={`/parent?studentId=${std.user_id}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeStudent?.user_id === std.user_id
                  ? "bg-[#0038A8] text-white shadow"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <User className="h-3.5 w-3.5" />
              <span>{std.name + " " + std.surname}</span>
            </Link>
          ))}
        </div>
      </div>

      {activeStudent ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* LEFT COLUMN: ACADEMIC CALENDAR & GRADES */}
          <div className="xl:col-span-2 space-y-6">
            {/* CHILD LECTURE TIMETABLE */}
            <div className="bg-card text-card-foreground border border-border p-6 rounded-2xl shadow-sm space-y-4">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 select-none">
                <Calendar className="h-5 w-5 text-[#0038A8]" />
                Timetable Outline: {activeStudent.name + " " + activeStudent.surname}
              </h3>
              <div className="h-[450px]">
                <BigCalendarContainer type="classId" id={activeStudent.classId || 1} />
              </div>
            </div>

            {/* CHILD ACADEMIC MARKS SHEET */}
            <div className="bg-card text-card-foreground border border-border p-6 rounded-2xl shadow-sm space-y-4 text-left select-none">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Award className="h-5 w-5 text-[#0038A8]" />
                Academic Progress & Gradebook Results
              </h3>

              {results.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-semibold font-sans border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-muted/40 text-muted-foreground uppercase text-[10px] font-black tracking-wider">
                        <th className="p-3">Assessment Title</th>
                        <th className="p-3">Dynamic Mark</th>
                        <th className="p-3 text-center">Grade</th>
                        <th className="p-3">Teacher Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {results.map((r: any) => (
                        <tr key={r.id} className="hover:bg-accent/40 transition-colors">
                          <td className="p-3 text-foreground font-bold">{r.assessment_title || "Assignment"}</td>
                          <td className="p-3">
                            <span className="font-bold text-gray-900">{r.score}</span> / <span className="text-muted-foreground">{r.total_marks || 100}</span>
                            <span className="text-[10px] text-muted-foreground block font-mono mt-0.5">({r.percentage || 0}%)</span>
                          </td>
                          <td className="p-3 text-center">
                            <span className={`inline-block text-[11px] font-black px-2.5 py-0.5 rounded-full select-none ${
                              r.is_passed 
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                                : "bg-red-50 text-red-700 border border-red-100"
                            }`}>
                              {r.grade || "F"}
                            </span>
                          </td>
                          <td className="p-3 text-muted-foreground text-xs leading-relaxed max-w-[200px] truncate" title={r.feedback}>
                            {r.feedback || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground py-4 text-center">No graded assessment results recorded for this student yet.</p>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: ATTENDANCE METRICS & METADATA */}
          <div className="space-y-6">
            {/* CHILD ATTENDANCE ANALYTICS */}
            <div className="bg-white border border-border p-6 rounded-2xl shadow-sm text-left select-none relative overflow-hidden">
              <span className="text-[10px] font-black text-indigo-650 uppercase tracking-widest block mb-1">
                Oversight Statistics
              </span>
              <h3 className="text-lg font-black text-gray-900 mb-4 leading-none">Attendance Logbook</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-black text-[#0038A8]">{attendancePercentage}%</span>
                  <span className="text-xs font-bold text-muted-foreground">
                    {presentAtt} / {totalAtt} Sessions Present
                  </span>
                </div>
                <div className="w-full h-3 bg-muted rounded-full overflow-hidden border border-border/40">
                  <div
                    className="h-full bg-gradient-to-r from-[#0038A8] to-indigo-600 rounded-full transition-all duration-500"
                    style={{ width: `${attendancePercentage}%` }}
                  />
                </div>
                
                {/* Stats breakdown capsules */}
                <div className="flex gap-2 justify-between text-[11px] font-extrabold text-muted-foreground bg-muted/20 p-2.5 rounded-xl border border-border/40 mt-2">
                  <div className="flex flex-col items-center flex-1 border-r border-border/60">
                    <span className="text-[#0038A8] text-sm font-black">{presentAtt}</span>
                    <span>Present</span>
                  </div>
                  <div className="flex flex-col items-center flex-1 border-r border-border/60">
                    <span className="text-amber-600 text-sm font-black">{attendance.filter(a => !a.present).length}</span>
                    <span>Absent</span>
                  </div>
                </div>
              </div>
            </div>

            {/* FAMILY & CONTACT DETAILS */}
            <div className="bg-white border border-border p-6 rounded-2xl shadow-sm text-left select-none space-y-4">
              <h4 className="text-xs font-black text-indigo-700 uppercase tracking-widest block">
                Emergency & Registry Metadata
              </h4>

              <div className="space-y-3.5">
                <div className="flex items-start gap-2.5">
                  <Heart className="h-4.5 w-4.5 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Parent Relationship</h5>
                    <p className="text-xs font-bold text-gray-900 mt-0.5 capitalize">{parentMetadata?.relationship || "Guardian"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Phone className="h-4.5 w-4.5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Emergency Phone</h5>
                    <p className="text-xs font-bold text-gray-900 mt-0.5">{parentMetadata?.emergency_phone || "Not Configured"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <BookOpen className="h-4.5 w-4.5 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Academic Classroom</h5>
                    <p className="text-xs font-bold text-gray-900 mt-0.5">{activeStudent.classId ? `Class Room #${activeStudent.classId}` : "University Classroom"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ANNOUNCEMENTS SIDEBLOCK */}
            <Announcements />
          </div>
        </div>
      ) : (
        <div className="bg-card text-card-foreground border border-border rounded-2xl p-12 text-center text-muted-foreground shadow-sm">
          <User className="h-12 w-12 text-muted-foreground/60 mx-auto mb-3" />
          <h3 className="font-bold text-lg">No Students Linked</h3>
          <p className="text-sm mt-1">Please contact university administration to link your child&apos;s profile to your account.</p>
        </div>
      )}
    </div>
  );
}
