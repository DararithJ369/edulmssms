import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProfileAvatar } from "./ProfileAvatar";
import { useNavigate } from "react-router";
import { Eye, Phone } from "lucide-react";
import { memo } from "react";

interface StudentProfile {
  id: number;
  student_id?: string;
  department?: string;
  grade_level_id?: number;
  grade_level_name?: string;
  enrolment_date?: string;
  previous_school?: string;
  scholarship_status?: string;
  special_needs?: string;
  parents?: any[];
}

interface StudentProfileViewProps {
  fullName?: string;
  phone?: string;
  address?: string;
  image?: string;
  dateOfBirth?: string;
  gender?: string;
  nationalId?: string;
  nationality?: string;
  website?: string;
  linkedin?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
  bloodType?: string;
  medicalConditions?: string;
  bio?: string;
  studentProfile?: StudentProfile;
  loading?: boolean;
}

// ── Primitives ────────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
      {children}
    </h3>
  );
}

function Row({ label, value, children }: {
  label: string;
  value?: string;
  children?: React.ReactNode;
}) {
  if (!value && !children) return null;
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border/40 last:border-0 gap-4">
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
      <span className="text-sm text-foreground text-right font-medium">
        {children ?? value ?? "—"}
      </span>
    </div>
  );
}

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

// ── Main Component ────────────────────────────────────────────────────────────

export function StudentProfileView({
  fullName,
  phone,
  address,
  image,
  dateOfBirth,
  gender,
  nationalId,
  nationality,
  website,
  linkedin,
  emergencyContactName,
  emergencyContactPhone,
  emergencyContactRelationship,
  bloodType,
  medicalConditions,
  bio,
  studentProfile,
  loading = false,
}: StudentProfileViewProps) {
  const navigate = useNavigate();

  // ── Loading ──
  if (loading) {
    return (
      <div className="animate-pulse">
        {/* cover skeleton */}
        <div className="h-40 rounded-xl bg-muted" />
        <div className="px-6">
          <div className="flex items-end gap-4 -mt-10 mb-6">
            <div className="h-20 w-20 rounded-full bg-muted border-4 border-background shrink-0" />
            <div className="pb-1 space-y-2 flex-1">
              <div className="h-5 w-40 bg-muted rounded-md" />
              <div className="h-3.5 w-28 bg-muted rounded-md" />
            </div>
          </div>
          <div className="space-y-4">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="flex gap-8">
                <div className="h-3.5 w-28 bg-muted rounded" />
                <div className="h-3.5 w-40 bg-muted/60 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!fullName && !studentProfile) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        No profile data available
      </div>
    );
  }

  const initials =
    fullName?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "S";

  const hasPersonal  = fullName || dateOfBirth || gender || address || phone || nationalId || nationality;
  const hasAcademic  = studentProfile;
  const hasLinks     = website || linkedin;
  const hasEmergency = emergencyContactName || emergencyContactPhone || emergencyContactRelationship || bloodType || medicalConditions;
  const hasParents   = studentProfile?.parents && studentProfile.parents.length > 0;

  return (
    <div className="space-y-6">

      {/* ── Header Card ──────────────────────────────────────────────────── */}
      <div className="relative">
        <div className="relative h-72 rounded-lg overflow-hidden bg-gradient-to-r from-slate-50 to-slate-100 dark:from-neutral-900 dark:to-neutral-800">
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: "radial-gradient(circle, #94a3b8 1px, transparent 0)",
              backgroundSize: "20px 20px",
            }}
          />
          
          {/* Content inside cover */}
          <div className="relative z-10 h-full flex flex-col justify-end p-6">
            <div className="flex items-end justify-between gap-6 mb-4">
              <div className="flex items-end gap-8">
                <div className="rounded-full overflow-hidden shadow-lg">
                  <ProfileAvatar
                    src={image}
                    alt={fullName || "Student"}
                    fallback={initials}
                    size="2xl"
                  />
                </div>
                <div className="pb-1">
                  <h1 className="text-3xl font-bold text-foreground">{fullName || "—"}</h1>
                  <p className="text-base text-foreground/70">{studentProfile?.student_id || "No ID"}</p>
                </div>
              </div>
            </div>

            {/* Badges row */}
            <div className="flex flex-wrap gap-2">
              {studentProfile?.grade_level_name && (
                <Badge className="px-3 py-1 bg-[#72e3ad]/20 dark:bg-[#006239]/30 text-[#1d7e59] dark:text-[#72e3ad] text-xs font-bold uppercase tracking-wider border-0">
                  {studentProfile.grade_level_name}
                </Badge>
              )}
              {studentProfile?.department && (
                <Badge className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider border-0">
                  {studentProfile.department}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Single Column Layout with wider cards ──────────────────────── */}
      <div className="space-y-6">

        {/* Personal Information */}
        {hasPersonal && (
          <div className="rounded-lg border p-5">
            <SectionTitle>Personal Information</SectionTitle>
            <div className="space-y-0">
              <Row label="Full name" value={fullName} />
              <Row label="Date of birth" value={dateOfBirth ? fmtDate(dateOfBirth) : undefined} />
              <Row label="Gender" value={gender} />
              <Row label="Nationality" value={nationality} />
              <Row label="Phone" value={phone} />
              <Row label="Address" value={address} />
              <Row label="National ID" value={nationalId} />
              {bio && <Row label="Bio" value={bio} />}
            </div>
          </div>
        )}

        {/* Academic Information */}
        {hasAcademic && (
          <div className="rounded-lg border p-5">
            <SectionTitle>Academic Information</SectionTitle>
            <div className="space-y-0">
              <Row label="Student ID" value={studentProfile.student_id} />
              <Row label="Year level" value={studentProfile.grade_level_name} />
              <Row label="Department" value={studentProfile.department} />
              <Row label="Enrolment date" value={studentProfile.enrolment_date ? fmtDate(studentProfile.enrolment_date) : undefined} />
              <Row label="Previous school" value={studentProfile.previous_school} />
              <Row label="Scholarship status" value={studentProfile.scholarship_status} />
              {studentProfile.special_needs && <Row label="Special needs" value={studentProfile.special_needs} />}
            </div>
          </div>
        )}

        {/* Emergency Contact & Health */}
        {hasEmergency && (
          <div className="rounded-lg border p-5">
            <SectionTitle>Health & Emergency Contact</SectionTitle>
            <div className="space-y-0">
              <Row label="Blood type" value={bloodType} />
              <Row label="Contact name" value={emergencyContactName} />
              <Row label="Contact relationship" value={emergencyContactRelationship} />
              <Row label="Contact phone" value={emergencyContactPhone} />
              {medicalConditions && <Row label="Medical conditions" value={medicalConditions} />}
            </div>
          </div>
        )}

        {/* Social Links */}
        {hasLinks && (
          <div className="rounded-lg border p-5">
            <SectionTitle>Social Links</SectionTitle>
            <div className="space-y-2 text-sm">
              {website && (
                <a href={website} target="_blank" rel="noopener noreferrer"
                  className="block text-green-600 hover:underline break-all">
                  Website: {website}
                </a>
              )}
              {linkedin && (
                <a href={linkedin} target="_blank" rel="noopener noreferrer"
                  className="block text-green-600 hover:underline break-all">
                  LinkedIn: {linkedin}
                </a>
              )}
            </div>
          </div>
        )}

        {/* Parents / Guardians */}
        {hasParents && (
          <div className="rounded-lg border p-5">
            <SectionTitle>
              Parents / Guardians ({studentProfile!.parents!.length})
            </SectionTitle>
            <div className="space-y-3">
              {studentProfile!.parents!.map((parent, idx) => (
                <div
                  key={idx}
                  className="pb-3 border-b last:border-0 last:pb-0 flex items-start justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">
                      {parent.full_name || `Guardian ${idx + 1}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {parent.parent_relationship || "Guardian"}
                    </p>
                    {parent.occupation && (
                      <p className="text-xs text-muted-foreground mt-1">{parent.occupation}</p>
                    )}
                    {parent.emergency_phone && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Phone className="h-3 w-3" />
                        {parent.emergency_phone}
                      </p>
                    )}
                  </div>
                  {(parent.id || parent.profile?.user_id) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs shrink-0"
                      onClick={() =>
                        navigate(`/users/parents/${parent.profile?.user_id || parent.id}`)
                      }
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

    </div>
  );
}

export const MemoizedStudentProfileView = memo(StudentProfileView);