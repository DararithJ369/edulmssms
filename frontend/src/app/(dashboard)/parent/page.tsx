import { Suspense } from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { 
  Globe, User, Calendar, Award, BookOpen, 
  Activity, CheckCircle2, Heart, Phone, ShieldAlert
} from "lucide-react";
import prisma from "@/lib/prisma";
import BigCalendarContainer from "@/components/BigCalendarContainer";
import Announcements from "@/components/Announcements";
import { CalendarSkeleton } from "@/components/student/WidgetSkeleton";
import { normalizeRole } from "@/lib/auth";

type ParentDashboardProps = {
  searchParams: { studentId?: string };
};

export default async function ParentDashboardPage({ searchParams }: ParentDashboardProps) {
  const cookieStore = cookies();
  const currentUserId = cookieStore.get("user_id")?.value || null;

  if (!currentUserId) {
    return (
      <div className="p-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h1 className="text-xl font-bold text-slate-800">Parent Dashboard</h1>
          <p className="text-slate-500 mt-2 text-sm">Please sign in to view your children&apos;s schedule.</p>
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

  // Fetch linked student profiles
  const students = (await prisma.student.findMany({
    where: { parentId: currentUserId }
  })) as any[];

  const studentIdParam = searchParams.studentId;
  const activeStudent = students.find(s => s.user_id === studentIdParam) || students[0] || null;

  // Fetch active child attendance & results
  const attendance = activeStudent 
    ? await prisma.attendance.findMany({ where: { studentId: activeStudent.user_id } }) 
    : [];

  const results = activeStudent 
    ? await prisma.result.findMany({ where: { studentId: activeStudent.user_id } }) 
    : [];

  // Calculate Attendance Stats
  const totalAtt = attendance.length;
  const presentAtt = attendance.filter((a: any) => a.present).length;
  const attendancePercentage = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 100;

  return (
    <div className="flex-1 p-6 space-y-6 bg-[#F7F8FA] min-h-screen relative font-sans text-left transition-all duration-300 animate-in fade-in">
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
          <h1 className="text-xl md:text-3xl font-black text-slate-800 tracking-tight leading-tight mt-0.5">
            Welcome back, {parentName}
          </h1>
        </div>

        {/* Dynamic linked children tab selector */}
        {students.length > 0 && (
          <div className="flex flex-wrap gap-1 bg-slate-100/80 p-1 rounded-2xl shadow-inner border border-slate-200/40 shrink-0">
            {students.map((std) => (
              <Link
                key={std.id}
                href={`/parent?studentId=${std.user_id}`}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98] ${
                  activeStudent?.user_id === std.user_id
                    ? "bg-[#0038A8] text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <User className="h-3.5 w-3.5" />
                <span>{std.name} {std.surname}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Risk Alert for low attendance */}
      {activeStudent && attendancePercentage < 75 && totalAtt > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3 animate-in fade-in">
          <ShieldAlert className="h-5 w-5 text-red-500 shrink-0" />
          <div>
            <p className="text-sm font-black text-red-700">
              Attendance Alert: {activeStudent.name} {activeStudent.surname}
            </p>
            <p className="text-xs text-red-600 mt-0.5">
              Attendance is at {attendancePercentage}% — below the 75% threshold. Please contact the school.
            </p>
          </div>
        </div>
      )}

      {activeStudent ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* LEFT COLUMN: ACADEMIC CALENDAR & GRADES */}
          <div className="xl:col-span-2 space-y-6">
            {/* CHILD TIMETABLE */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] space-y-4">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2 select-none">
                <Calendar className="h-5 w-5 text-[#0038A8]" />
                Timetable: {activeStudent.name} {activeStudent.surname}
              </h3>
              <div className="h-[460px]">
                <Suspense fallback={<CalendarSkeleton />}>
                  <BigCalendarContainer type="studentId" id={activeStudent.user_id} />
                </Suspense>
              </div>
            </div>

            {/* GRADEBOOK RESULTS */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] space-y-4 text-left select-none">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <Award className="h-5 w-5 text-[#0038A8]" />
                Academic Marks & Report Cards
              </h3>

              {results.length > 0 ? (
                <div className="overflow-x-auto rounded-2xl border border-slate-100">
                  <table className="w-full text-left text-xs font-semibold font-sans border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 uppercase text-[10px] font-extrabold tracking-wider">
                        <th className="p-3.5">Assessment Title</th>
                        <th className="p-3.5">Mark Score</th>
                        <th className="p-3.5 text-center">Grade</th>
                        <th className="p-3.5">Faculty Feedback</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {results.map((r: any) => (
                        <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-3.5 text-slate-800 font-extrabold">{r.assessment_title || "Assignment"}</td>
                          <td className="p-3.5">
                            <span className="font-extrabold text-slate-800">{r.score}</span> / <span className="text-slate-400">{r.total_marks || 100}</span>
                            <span className="text-[10px] text-slate-400 block font-mono mt-0.5 font-bold">({r.percentage || 0}%)</span>
                          </td>
                          <td className="p-3.5 text-center">
                            <span className={`inline-block text-[10px] font-black px-2.5 py-0.5 rounded-full select-none ${
                              r.is_passed 
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-100/50" 
                                : "bg-red-50 text-red-700 border border-red-100/50"
                            }`}>
                              {r.grade || "F"}
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-500 text-xs leading-relaxed max-w-[200px] truncate" title={r.feedback}>
                            {r.feedback || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-150">
                  <p className="text-xs text-slate-450 font-bold">No academic records reported for this child yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: ATTENDANCE & EMERGENCY DATA */}
          <div className="space-y-6">
            {/* ATTENDANCE DETAILS */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] text-left select-none">
              <span className="text-[9px] font-extrabold text-[#0038A8] uppercase tracking-widest block mb-1">
                Oversight Statistics
              </span>
              <h3 className="text-lg font-black text-slate-800 mb-4 leading-none">Attendance Logbook</h3>

              <div className="space-y-4">
                <div className="flex items-end justify-between">
                  <span className="text-3xl font-black text-[#0038A8]">{attendancePercentage}%</span>
                  <span className="text-xs font-bold text-slate-400">
                    {presentAtt} / {totalAtt} Sessions Present
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#0038A8] to-indigo-650 rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${attendancePercentage}%` }}
                  />
                </div>
                
                {/* Stats breakdown */}
                <div className="flex gap-2 justify-between text-[11px] font-bold text-slate-450 bg-slate-50/50 p-3 rounded-2xl border border-slate-100/60 mt-2">
                  <div className="flex flex-col items-center flex-1 border-r border-slate-100">
                    <span className="text-[#0038A8] text-sm font-black">{presentAtt}</span>
                    <span>Present</span>
                  </div>
                  <div className="flex flex-col items-center flex-1">
                    <span className="text-amber-600 text-sm font-black">{attendance.filter((a: any) => !a.present).length}</span>
                    <span>Absent</span>
                  </div>
                </div>
              </div>
            </div>

            {/* METADATA DETAILS */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] text-left select-none space-y-4">
              <h4 className="text-xs font-black text-[#0038A8] uppercase tracking-widest block">
                Emergency & Registry Metadata
              </h4>

              <div className="space-y-4">
                <div className="flex items-start gap-2.5">
                  <Heart className="h-4.5 w-4.5 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Parent Relationship</h5>
                    <p className="text-xs font-extrabold text-slate-700 mt-0.5 capitalize">{parentMetadata?.relationship || "Guardian"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Phone className="h-4.5 w-4.5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Emergency Phone</h5>
                    <p className="text-xs font-extrabold text-slate-700 mt-0.5">{parentMetadata?.emergency_phone || "Not Configured"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <BookOpen className="h-4.5 w-4.5 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Academic Classroom</h5>
                    <p className="text-xs font-extrabold text-slate-700 mt-0.5">{activeStudent.classId ? `Class Room #${activeStudent.classId}` : "University Classroom"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ANNOUNCEMENTS */}
            <Announcements />
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center text-slate-400 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
          <ShieldAlert className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-extrabold text-lg text-slate-700">No Students Linked</h3>
          <p className="text-xs mt-1 max-w-[280px] mx-auto leading-relaxed">
            Please contact university administration to link your child&apos;s profile registry to your account.
          </p>
        </div>
      )}
    </div>
  );
}
