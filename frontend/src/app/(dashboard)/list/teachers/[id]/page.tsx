import Announcements from "@/components/Announcements";
import BigCalendarContainer from "@/components/BigCalendarContainer";
import Performance from "@/components/Performance";
import TeacherEditModal from "@/components/TeacherEditModal";
import BackButton from "@/components/BackButton";
import { serverFetch } from "@/lib/server-api";
import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { InstructorProfileResponse, UserResponse } from "@/types";
import {
  Globe, GraduationCap, Calendar, Mail, Phone,
  MapPin, Flag, Building2, Briefcase, Hash,
} from "lucide-react";
import { getImageUrl } from "@/lib/image-url";
import { getInitials, getInitialsColor } from "@/lib/avatar";

const normalizeRole = (role: string | null | undefined) => {
  if (role === "instructor") return "teacher";
  return role ?? "";
};

const fmtDate = (v?: string | null) => {
  if (!v) return "-";
  try { return new Intl.DateTimeFormat("en-GB").format(new Date(v)); }
  catch { return v; }
};

const MetaRow = ({ icon, value }: { icon: React.ReactNode; value?: string | null }) => (
  <div className="flex items-start gap-2 select-none">
    <span className="mt-0.5 shrink-0 text-indigo-400">{icon}</span>
    <span className="text-[11px] font-semibold text-slate-600 break-words min-w-0">{value || "-"}</span>
  </div>
);

const SingleTeacherPage = async ({
  params: { id },
}: {
  params: { id: string };
}) => {
  const cookieStore = cookies();
  const role = normalizeRole(cookieStore.get("user_role")?.value);
  const token = cookieStore.get("access_token")?.value || cookieStore.get("token")?.value;

  let profileError: string | null = null;
  let userError: string | null = null;

  const [instructor, user] = await Promise.all([
    serverFetch<InstructorProfileResponse>(
      `/instructors/${id}/profile${token ? `?token=${token}` : ""}`
    ).catch((err) => {
      profileError = err instanceof Error ? err.message : String(err);
      return null;
    }),
    serverFetch<UserResponse>(`/users/${id}`).catch((err) => {
      userError = err instanceof Error ? err.message : String(err);
      return null;
    }),
  ]);

  if (!instructor || !user) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 text-red-800 rounded-md m-6 flex flex-col gap-2">
        <h1 className="text-xl font-semibold">Unable to View Teacher Profile</h1>
        <p className="text-sm">We encountered an issue fetching data from the backend API for ID: <code>{id}</code></p>
        <div className="mt-2 text-xs font-mono bg-white p-3 border border-red-100 rounded">
          <p><strong>Instructor Profile:</strong> {instructor ? "LOADED" : (profileError || "Unknown Error")}</p>
          <p className="mt-1"><strong>User Account:</strong> {user ? "LOADED" : (userError || "Unknown Error")}</p>
        </div>
        <Link href="/list/teachers" className="mt-4 inline-block text-sm text-blue-600 underline font-semibold">
          Back to Teachers List
        </Link>
      </div>
    );
  }

  const classesData = await serverFetch<any[]>(`/instructors/${id}/classes`).catch(() => []);
  const classesCount = classesData.length;

  const ip = instructor.instructor_profile;

  const editData = {
    userId:      user.id,
    username:    user.username,
    email:       user.email,
    full_name:   instructor.full_name  || "",
    phone:       instructor.phone      || "",
    address:     instructor.address    || "",
    bio:         instructor.bio        || "",
    date_of_birth: instructor.date_of_birth || "",
    gender:      instructor.gender     || "",
    nationality: instructor.nationality || "",
    pfp:         instructor.pfp        || "",
    blood_type:  instructor.blood_type || "",
    medical_conditions: instructor.medical_conditions || "",
    emergency_contact_name:         instructor.emergency_contact_name         || "",
    emergency_contact_phone:        instructor.emergency_contact_phone        || "",
    emergency_contact_relationship: instructor.emergency_contact_relationship || "",
    department:  ip?.department || "",
    position:    ip?.position   || "",
    office:      ip?.office     || "",
    hire_date:   ip?.hire_date  || "",
  };

  const displayName = instructor.full_name || user.username;
  const photoUrl    = getImageUrl(instructor.pfp || user.image);
  const { bg, text: textColor } = getInitialsColor(displayName);

  return (
    <div className="flex-1 p-6 space-y-6 bg-[#F7F8FA] min-h-screen relative font-sans text-left">

      {/* BREADCRUMB */}
      <div className="flex items-center gap-1 text-[11px] font-extrabold text-muted-foreground uppercase tracking-wider mb-2 select-none">
        <Link href="/" className="hover:text-foreground flex items-center gap-1">
          <Globe className="h-3 w-3" />Home
        </Link>
        <span>/</span>
        <Link href="/list/teachers" className="hover:text-foreground">Users</Link>
        <span>/</span>
        <Link href="/list/teachers" className="hover:text-foreground">Teachers</Link>
        <span>/</span>
        <span className="text-foreground">Profile</span>
      </div>

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 select-none mb-6">
        <div className="flex items-start gap-3">
          <BackButton className="mt-1" />
          <div>
            <span className="text-xs font-extrabold text-[#0038A8] uppercase tracking-wider font-mono">
              Faculty Profile Details
            </span>
            <div className="flex items-center gap-3 mt-0.5">
              <h1 className="text-xl md:text-3xl font-black text-gray-900 tracking-tight leading-tight">
                {displayName}
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border select-none ${
                user.is_active
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-red-50 text-red-600 border-red-200"
              }`}>
                {user.is_active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-6 flex-col xl:flex-row">

        {/* ── LEFT COLUMN ───────────────────────────────────────────── */}
        <div className="w-full xl:w-2/3 flex flex-col gap-6">
          <div className="flex flex-col lg:flex-row gap-6">

            {/* LAVENDER INFO CARD */}
            <div className="bg-[#F1EFFF] border border-indigo-100 p-6 rounded-3xl flex-1 flex flex-col sm:flex-row gap-6 shadow-sm relative overflow-hidden">
              <span className="absolute left-0 top-0 bottom-0 w-[4px] bg-indigo-400" />

              {/* Avatar */}
              <div className="w-full sm:w-1/3 flex justify-center sm:justify-start items-start pt-1">
                <div
                  className="h-28 w-28 sm:h-32 sm:w-32 rounded-full overflow-hidden border border-indigo-100 flex items-center justify-center shrink-0 shadow-sm"
                  style={photoUrl ? { background: "white" } : { backgroundColor: bg }}
                >
                  {photoUrl
                    ? <img src={photoUrl} alt={displayName} className="w-full h-full object-cover" />
                    : <span className="text-3xl font-black tracking-wide select-none" style={{ color: textColor }}>{getInitials(displayName)}</span>
                  }
                </div>
              </div>

              {/* Info */}
              <div className="w-full sm:w-2/3 flex flex-col justify-between gap-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-800 leading-tight">
                      {displayName}
                    </h1>
                    <div className="flex items-center gap-2 flex-wrap mt-1.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-700 border border-indigo-200 flex items-center gap-1 select-none">
                        <GraduationCap className="h-3 w-3" />Faculty Staff
                      </span>
                      {ip?.position && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-slate-100 text-slate-500 border border-slate-200 flex items-center gap-1 select-none">
                          <Briefcase className="h-2.5 w-2.5" />{ip.position}
                        </span>
                      )}
                    </div>
                  </div>
                  {role === "admin" && <TeacherEditModal data={editData} />}
                </div>

                <p className="text-xs text-slate-600 italic leading-relaxed">
                  {instructor.bio || "Teacher profile registered in the Learning Management System."}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1.5 gap-x-4 border-t border-indigo-100 pt-3">
                  <MetaRow icon={<span className="h-4 w-4 rounded bg-indigo-50 border border-indigo-200 flex items-center justify-center text-red-500 text-[9px] font-black">B</span>} value={`Blood: ${instructor.blood_type || "-"}`} />
                  <MetaRow icon={<Calendar className="h-3.5 w-3.5" />} value={fmtDate(instructor.date_of_birth)} />
                  <MetaRow icon={<Mail className="h-3.5 w-3.5" />} value={user.email} />
                  <MetaRow icon={<Phone className="h-3.5 w-3.5" />} value={instructor.phone} />
                  {instructor.address    && <MetaRow icon={<MapPin      className="h-3.5 w-3.5" />} value={instructor.address} />}
                  {instructor.nationality && <MetaRow icon={<Flag       className="h-3.5 w-3.5" />} value={instructor.nationality} />}
                  {ip?.department        && <MetaRow icon={<Building2   className="h-3.5 w-3.5" />} value={`Dept: ${ip.department}`} />}
                  {ip?.office            && <MetaRow icon={<Hash        className="h-3.5 w-3.5" />} value={`Office: ${ip.office}`} />}
                  {ip?.hire_date         && <MetaRow icon={<Calendar    className="h-3.5 w-3.5" />} value={`Hired: ${fmtDate(ip.hire_date)}`} />}
                </div>
              </div>
            </div>

            {/* METRIC CARDS */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 select-none">
              <div className="bg-white border border-slate-100 hover:border-emerald-500/25 p-5 rounded-3xl flex items-center gap-4 shadow-sm hover:shadow-md hover:-translate-y-[0.5px] transition-all duration-300 group">
                <div className="h-11 w-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 shadow-sm">
                  <Image src="/singleAttendance.png" alt="" width={22} height={22} />
                </div>
                <div>
                  <h1 className="text-xl font-extrabold text-slate-800 leading-tight">95%</h1>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mt-0.5">Attendance Rate</span>
                </div>
              </div>

              <div className="bg-white border border-slate-100 hover:border-indigo-500/25 p-5 rounded-3xl flex items-center gap-4 shadow-sm hover:shadow-md hover:-translate-y-[0.5px] transition-all duration-300 group">
                <div className="h-11 w-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 shadow-sm">
                  <Image src="/singleBranch.png" alt="" width={22} height={22} />
                </div>
                <div>
                  <h1 className="text-xl font-extrabold text-slate-800 leading-tight">{ip?.department ? 1 : 0}</h1>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mt-0.5">Academic Dept</span>
                </div>
              </div>

              <div className="bg-white border border-slate-100 hover:border-sky-500/25 p-5 rounded-3xl flex items-center gap-4 shadow-sm hover:shadow-md hover:-translate-y-[0.5px] transition-all duration-300 group">
                <div className="h-11 w-11 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 shadow-sm">
                  <Image src="/singleLesson.png" alt="" width={22} height={22} />
                </div>
                <div>
                  <h1 className="text-xl font-extrabold text-slate-800 leading-tight">{classesCount * 2}</h1>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mt-0.5">Scheduled Lectures</span>
                </div>
              </div>

              <div className="bg-white border border-slate-100 hover:border-violet-500/25 p-5 rounded-3xl flex items-center gap-4 shadow-sm hover:shadow-md hover:-translate-y-[0.5px] transition-all duration-300 group">
                <div className="h-11 w-11 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 shadow-sm">
                  <Image src="/singleClass.png" alt="" width={22} height={22} />
                </div>
                <div>
                  <h1 className="text-xl font-extrabold text-slate-800 leading-tight">{classesCount}</h1>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mt-0.5">Assigned Classes</span>
                </div>
              </div>
            </div>
          </div>

          {/* SCHEDULE */}
          <div className="bg-white border border-border/60 rounded-3xl p-6 shadow-sm text-left">
            <h3 className="text-base font-bold text-gray-900 mb-4 select-none">Teacher&apos;s Schedule</h3>
            <div className="h-[750px] relative overflow-hidden rounded-2xl border border-border/50">
              <BigCalendarContainer type="teacherId" id={user.id} />
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN ──────────────────────────────────────────── */}
        <div className="w-full xl:w-1/3 flex flex-col gap-6 select-none">
          <div className="bg-white border border-border/60 p-6 rounded-3xl shadow-sm text-left">
            <h3 className="text-base font-bold text-gray-900 mb-4 select-none">Shortcut Links</h3>
            <div className="flex gap-3 flex-wrap text-xs text-gray-500">
              <Link className="px-3.5 py-2 bg-sky-50 hover:bg-sky-100 border border-sky-100 text-sky-700 font-extrabold text-[10px] rounded-xl shadow-sm transition-all active:scale-[0.98] uppercase tracking-wider" href={`/list/classes?supervisorId=${user.id}`}>Supervised Classes</Link>
              <Link className="px-3.5 py-2 bg-violet-50 hover:bg-violet-100 border border-violet-100 text-violet-700 font-extrabold text-[10px] rounded-xl shadow-sm transition-all active:scale-[0.98] uppercase tracking-wider" href={`/list/students?teacherId=${user.id}`}>Enrolled Students</Link>
              <Link className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-700 font-extrabold text-[10px] rounded-xl shadow-sm transition-all active:scale-[0.98] uppercase tracking-wider" href={`/list/lessons?teacherId=${user.id}`}>All Lessons</Link>
              <Link className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-100 text-amber-700 font-extrabold text-[10px] rounded-xl shadow-sm transition-all active:scale-[0.98] uppercase tracking-wider" href={`/list/exams?teacherId=${user.id}`}>All Exams</Link>
              <Link className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-emerald-700 font-extrabold text-[10px] rounded-xl shadow-sm transition-all active:scale-[0.98] uppercase tracking-wider" href={`/list/assignments?teacherId=${user.id}`}>All Assignments</Link>
            </div>
          </div>

          <Performance />
          <Announcements />
        </div>
      </div>
    </div>
  );
};

export default SingleTeacherPage;
