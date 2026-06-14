import Announcements from "@/components/Announcements";
import Performance from "@/components/Performance";
import ParentEditModal from "@/components/ParentEditModal";
import ParentLinkStudentModal from "@/components/ParentLinkStudentModal"; 
import BackButton from "@/components/BackButton";
import { serverFetch } from "@/lib/server-api";
import Link from "next/link";
import { cookies } from "next/headers";
import { ParentFullResponse, UserResponse } from "@/types";
import {
  Globe, Users, Calendar, Mail, Phone,
  MapPin, Flag, Briefcase, ChevronRight,
  GraduationCap, BookOpen,
} from "lucide-react";
import { getImageUrl } from "@/lib/image-url";
import { getInitials, getInitialsColor } from "@/lib/avatar";
import { normalizeRole } from "@/lib/auth";


const fmtDate = (v?: string | null) => {
  if (!v) return "-";
  try { return new Intl.DateTimeFormat("en-GB").format(new Date(v)); }
  catch { return v; }
};

const MetaRow = ({ icon, value }: { icon: React.ReactNode; value?: string | null }) => (
  <div className="flex items-start gap-2 select-none">
    <span className="mt-0.5 shrink-0 text-rose-400">{icon}</span>
    <span className="text-[11px] font-semibold text-slate-600 break-words min-w-0">{value || "-"}</span>
  </div>
);

const SingleParentPage = async ({
  params: { id },
}: {
  params: { id: string };
}) => {
  const cookieStore = cookies();
  const role = normalizeRole(cookieStore.get("user_role")?.value);
  const token = cookieStore.get("access_token")?.value || cookieStore.get("token")?.value;
  const loggedInUserId = cookieStore.get("user_id")?.value;
  const tokenQuery = token ? `?token=${token}` : "";

  let profileError: string | null = null;
  let userError: string | null = null;

  const [parent, user] = await Promise.all([
    serverFetch<ParentFullResponse>(
      `/parents/${id}/profile${tokenQuery}`
    ).catch((err) => {
      profileError = err instanceof Error ? err.message : String(err);
      return null;
    }),
    serverFetch<UserResponse>(
      `/users/${id}${tokenQuery}`
    ).catch((err) => {
      userError = err instanceof Error ? err.message : String(err);
      return null;
    }),
  ]);

  if (!parent || !user) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 text-red-800 rounded-md m-6 flex flex-col gap-2">
        <h1 className="text-xl font-semibold">Unable to View Parent Profile</h1>
        <p className="text-sm">We encountered an issue fetching data from the backend API for ID: <code>{id}</code></p>
        <div className="mt-2 text-xs font-mono bg-white p-3 border border-red-100 rounded">
          <p><strong>Parent Profile:</strong> {parent ? "LOADED" : (profileError || "Unknown Error")}</p>
          <p className="mt-1"><strong>User Account:</strong> {user ? "LOADED" : (userError || "Unknown Error")}</p>
        </div>
        <Link href="/list/parents" className="mt-4 inline-block text-sm text-blue-600 underline font-semibold">
          Back to Parents List
        </Link>
      </div>
    );
  }

  const linkedStudents: any[] = await serverFetch<any[]>(
    `/parents/${id}/students${tokenQuery}`
  ).catch(() => []);

  const pp = parent.parent_profile;
  const parentAny = parent as any;

  const editData = {
    userId:      user.id,
    username:    user.username,
    email:       user.email,
    full_name:   parent.full_name   || "",
    phone:       parent.phone       || "",
    address:     parent.address     || "",
    bio:         parent.bio         || "",
    date_of_birth: parent.date_of_birth || "",
    gender:      parent.gender      || "",
    nationality: parentAny.nationality || "",
    pfp:         parent.pfp         || "",
    blood_type:  parentAny.blood_type || "",
    medical_conditions: parentAny.medical_conditions || "",
    emergency_contact_name:         parent.emergency_contact_name         || "",
    emergency_contact_phone:        parent.emergency_contact_phone        || "",
    emergency_contact_relationship: parentAny.emergency_contact_relationship || "",
    occupation:     pp?.occupation     || "",
    relationship:   pp?.relationship   || "",
    emergency_phone: pp?.emergency_phone || "",
    website:  parent.website  || "",
    linkedin: parent.linkedin || "",
  };

  const displayName = parent.full_name || user.username;
  const photoUrl    = getImageUrl(parent.pfp || user.image);
  const { bg, text: textColor } = getInitialsColor(displayName);

  return (
    <div className="flex-1 p-6 space-y-6 bg-[#F7F8FA] min-h-screen relative font-sans text-left">

      {/* BREADCRUMB */}
      <div className="flex items-center gap-1 text-[11px] font-extrabold text-muted-foreground uppercase tracking-wider mb-2 select-none">
        <Link href="/" className="hover:text-foreground flex items-center gap-1">
          <Globe className="h-3 w-3" />Home
        </Link>
        <span>/</span>
        <Link href="/list/parents" className="hover:text-foreground">Users</Link>
        <span>/</span>
        <Link href="/list/parents" className="hover:text-foreground">Parents</Link>
        <span>/</span>
        <span className="text-foreground">Profile</span>
      </div>

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 select-none mb-6">
        <div className="flex items-start gap-3">
          <BackButton className="mt-1" />
          <div>
            <span className="text-xs font-extrabold text-[#0038A8] uppercase tracking-wider font-mono">
              Guardian Profile Details
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

            {/* ROSE PROFILE CARD */}
            <div className="bg-[#FFF1F2] border border-rose-100 p-6 rounded-3xl flex-1 flex flex-col sm:flex-row gap-6 shadow-sm relative overflow-hidden">
              <span className="absolute left-0 top-0 bottom-0 w-[4px] bg-rose-400" />

              {/* Avatar */}
              <div className="w-full sm:w-1/3 flex justify-center sm:justify-start items-start pt-1">
                <div
                  className="h-28 w-28 sm:h-32 sm:w-32 rounded-full overflow-hidden border border-rose-100 flex items-center justify-center shrink-0 shadow-sm"
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
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-700 border border-rose-200 flex items-center gap-1 select-none">
                        <Users className="h-3 w-3" />Guardian
                      </span>
                      {pp?.relationship && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-slate-100 text-slate-500 border border-slate-200 select-none">
                          {pp.relationship}
                        </span>
                      )}
                    </div>
                  </div>
                  {(role === "admin" || loggedInUserId === user.id) && <ParentEditModal data={editData} />}
                </div>

                <p className="text-xs text-slate-600 italic leading-relaxed">
                  {parent.bio || "Guardian registered in the Learning Management System."}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1.5 gap-x-4 border-t border-rose-100 pt-3">
                  <MetaRow icon={<Calendar className="h-3.5 w-3.5" />} value={fmtDate(parent.date_of_birth)} />
                  <MetaRow icon={<Mail className="h-3.5 w-3.5" />} value={user.email} />
                  <MetaRow icon={<Phone className="h-3.5 w-3.5" />} value={parent.phone} />
                  {pp?.emergency_phone && <MetaRow icon={<Phone className="h-3.5 w-3.5 text-red-400" />} value={`Emergency: ${pp.emergency_phone}`} />}
                  {parent.address     && <MetaRow icon={<MapPin className="h-3.5 w-3.5" />} value={parent.address} />}
                  {parentAny.nationality && <MetaRow icon={<Flag className="h-3.5 w-3.5" />} value={parentAny.nationality} />}
                  {pp?.occupation     && <MetaRow icon={<Briefcase className="h-3.5 w-3.5" />} value={`Occupation: ${pp.occupation}`} />}
                </div>
              </div>
            </div>

            {/* METRIC CARDS */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 select-none">
              <div className="bg-white border border-slate-100 hover:border-rose-500/25 p-5 rounded-3xl flex items-center gap-4 shadow-sm hover:shadow-md hover:-translate-y-[0.5px] transition-all duration-300 group">
                <div className="h-11 w-11 rounded-2xl bg-rose-50 border border-rose-100 text-rose-500 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 shadow-sm">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-xl font-extrabold text-slate-800 leading-tight">{linkedStudents.length}</h1>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mt-0.5">Linked Students</span>
                </div>
              </div>

              <div className="bg-white border border-slate-100 hover:border-indigo-500/25 p-5 rounded-3xl flex items-center gap-4 shadow-sm hover:shadow-md hover:-translate-y-[0.5px] transition-all duration-300 group">
                <div className="h-11 w-11 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-500 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 shadow-sm">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-xl font-extrabold text-slate-800 leading-tight">{pp?.relationship || "—"}</h1>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mt-0.5">Relationship</span>
                </div>
              </div>

              <div className="bg-white border border-slate-100 hover:border-emerald-500/25 p-5 rounded-3xl flex items-center gap-4 shadow-sm hover:shadow-md hover:-translate-y-[0.5px] transition-all duration-300 group">
                <div className="h-11 w-11 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 shadow-sm">
                  <Briefcase className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-xl font-extrabold text-slate-800 leading-tight truncate max-w-[8rem]">{pp?.occupation || "—"}</h1>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mt-0.5">Occupation</span>
                </div>
              </div>

              <div className="bg-white border border-slate-100 hover:border-sky-500/25 p-5 rounded-3xl flex items-center gap-4 shadow-sm hover:shadow-md hover:-translate-y-[0.5px] transition-all duration-300 group">
                <div className="h-11 w-11 rounded-2xl bg-sky-50 border border-sky-100 text-sky-500 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 shadow-sm">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-xl font-extrabold text-slate-800 leading-tight">{linkedStudents.length > 0 ? "Yes" : "None"}</h1>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mt-0.5">Has Children</span>
                </div>
              </div>
            </div>
          </div>

          {/* LINKED STUDENTS */}
          <div className="bg-white border border-border/60 rounded-3xl p-6 shadow-sm text-left">
            <div className="flex items-center justify-between mb-4 select-none">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-[#0038A8]" />
                Linked Students
                <span className="text-[10px] font-black text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {linkedStudents.length}
                </span>
              </h3>
              {role === "admin" && <ParentLinkStudentModal parentId={user.id} />}
            </div>
            
            {linkedStudents.length > 0 ? (
              <div className="space-y-2">
                {linkedStudents.map((s: any) => {
                  // 🛡️ EXPLICIT STRING UUID RESOLVER:
                  // Prioritizes user_id directly, then scans nested profiles,
                  // and falls back to s.id ONLY if it matches an authentic UUID format.
                  const isUuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                  let targetUuid = s.user_id || s.profile?.user_id;

                  if (!targetUuid && isUuidRegex.test(String(s.id))) {
                    targetUuid = s.id;
                  }

                  // Defensive backup flag to prevent routing to base indexes like /1
                  if (!targetUuid || !isUuidRegex.test(String(targetUuid))) {
                    targetUuid = "missing-valid-uuid";
                  }

                  return (
                    <Link key={s.id || targetUuid} href={`/list/students/${targetUuid}`}>
                      <div className="flex items-center justify-between p-3.5 rounded-2xl border border-border/50 hover:border-[#0038A8]/30 hover:bg-[#0038A8]/5 transition-all group">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-9 w-9 rounded-xl bg-rose-50 border border-rose-100 text-rose-500 flex items-center justify-center shrink-0">
                            <GraduationCap className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-foreground truncate">{s.full_name || s.username || "Student"}</p>
                            {s.grade_level_name && (
                              <p className="text-[10px] text-muted-foreground mt-0.5">{s.grade_level_name}</p>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-[#0038A8] transition-colors shrink-0" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground/50 select-none">
                <GraduationCap className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs font-semibold">No students linked to this guardian yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN ──────────────────────────────────────────── */}
        <div className="w-full xl:w-1/3 flex flex-col gap-6 select-none">
          {/* SHORTCUT LINKS */}
          <div className="bg-white border border-border/60 p-6 rounded-3xl shadow-sm text-left">
            <h3 className="text-base font-bold text-gray-900 mb-4 select-none">Shortcut Links</h3>
            <div className="flex gap-3 flex-wrap text-xs text-gray-500">
              <Link className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-700 font-extrabold text-[10px] rounded-xl shadow-sm transition-all active:scale-[0.98] uppercase tracking-wider" href={`/list/students?parentId=${user.id}`}>
                Their Students
              </Link>
              <Link className="px-3.5 py-2 bg-sky-50 hover:bg-sky-100 border border-sky-100 text-sky-700 font-extrabold text-[10px] rounded-xl shadow-sm transition-all active:scale-[0.98] uppercase tracking-wider" href={`/list/attendance?parentId=${user.id}`}>
                Attendance
              </Link>
              <Link className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-emerald-700 font-extrabold text-[10px] rounded-xl shadow-sm transition-all active:scale-[0.98] uppercase tracking-wider" href={`/list/results?parentId=${user.id}`}>
                Results
              </Link>
            </div>
          </div>

          <Performance />
          <Announcements />
        </div>
      </div>
    </div>
  );
};

export default SingleParentPage;