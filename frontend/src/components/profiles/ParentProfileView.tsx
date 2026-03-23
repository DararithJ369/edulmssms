import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProfileAvatar } from "./ProfileAvatar";
import { useNavigate } from "react-router";
import { Eye } from "lucide-react";

interface ParentProfile {
  id: number;
  occupation?: string;
  parent_relationship?: string;
  emergency_phone?: string;
}

interface LinkedStudent {
  id: number;
  student_id?: string;
  full_name?: string;
  department?: string;
  grade_level_name?: string;
  profile?: {
    user_id?: string;
  };
}

interface ParentProfileViewProps {
  fullName?: string;
  phone?: string;
  address?: string;
  image?: string;
  gender?: string;
  nationalId?: string;
  website?: string;
  linkedin?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  parentProfile?: ParentProfile;
  linkedStudents?: LinkedStudent[];
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

// ── Main Component ────────────────────────────────────────────────────

export function ParentProfileView({
  fullName,
  phone,
  address,
  image,
  gender,
  nationalId,
  website,
  linkedin,
  emergencyContactName,
  emergencyContactPhone,
  parentProfile,
  linkedStudents,
  loading = false,
}: ParentProfileViewProps) {
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

  if (!fullName && !parentProfile) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        No profile data available
      </div>
    );
  }

  const initials =
    fullName?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "P";

  const hasPersonal = fullName || gender || address || phone || nationalId;
  const hasLinks = website || linkedin;
  const hasEmergency = emergencyContactName || emergencyContactPhone;

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
                    alt={fullName || "Parent"}
                    fallback={initials}
                    size="2xl"
                  />
                </div>
                <div className="pb-1">
                  <h1 className="text-3xl font-bold text-foreground">{fullName || "—"}</h1>
                  <p className="text-base text-foreground/70">{parentProfile?.parent_relationship || "Parent"}</p>
                </div>
              </div>
            </div>

            {/* Badges row */}
            <div className="flex flex-wrap gap-2">
              {parentProfile?.occupation && (
                <Badge className="text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white border-0 shadow-md">
                  {parentProfile.occupation}
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
              <Row label="Gender" value={gender} />
              <Row label="Phone" value={phone} />
              <Row label="Address" value={address} />
              <Row label="National ID" value={nationalId} />
            </div>
          </div>
        )}

        {/* Parent Information */}
        {parentProfile && (
          <div className="rounded-lg border p-5">
            <SectionTitle>Parent Information</SectionTitle>
            <div className="space-y-0">
              <Row label="Relationship" value={parentProfile.parent_relationship} />
              <Row label="Occupation" value={parentProfile.occupation} />
              <Row label="Emergency phone" value={parentProfile.emergency_phone} />
            </div>
          </div>
        )}

        {/* Emergency Contact */}
        {hasEmergency && (
          <div className="rounded-lg border p-5">
            <SectionTitle>Emergency Contact</SectionTitle>
            <div className="space-y-0">
              <Row label="Contact name" value={emergencyContactName} />
              <Row label="Contact phone" value={emergencyContactPhone} />
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

        {/* Linked Students */}
        {linkedStudents && linkedStudents.length > 0 && (
          <div className="rounded-lg border p-5">
            <SectionTitle>Linked Students ({linkedStudents.length})</SectionTitle>
            <div className="space-y-3">
              {linkedStudents.map((student, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-muted rounded border hover:bg-muted/80 transition flex items-start justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{student.full_name || `Student ${idx + 1}`}</p>
                    <p className="text-xs text-muted-foreground">
                      ID: {student.student_id || "—"}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {student.grade_level_name || "N/A"}
                      </Badge>
                      <Badge className="text-xs">{student.department || "N/A"}</Badge>
                    </div>
                  </div>
                  {(student.id || student.profile?.user_id) && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => navigate(`/users/students/${student.profile?.user_id || student.id}`)}
                      title="View student profile"
                      className="flex-shrink-0"
                    >
                      <Eye className="h-4 w-4" />
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