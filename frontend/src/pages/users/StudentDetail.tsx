import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useProfileData } from "@/hooks/useProfileData";
import { MemoizedStudentProfileView } from "@/components/profiles/StudentProfileView";
import { ProfileEditForm } from "@/components/profiles/ProfileEditForm";
import { ArrowLeft, Pencil, X } from "lucide-react";

export function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);

  const { profile, studentProfile, loading, error, refetch } =
    useProfileData(id);

  // ── Error states ──────────────────────────────────────────────────────────
  if (!id || error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="py-8 text-center space-y-4">
            <p className="text-red-500 text-sm">
              {!id ? "Invalid student ID" : error}
            </p>
            <Button onClick={() => navigate(-1)} variant="outline" className="w-full">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ── Content ────────────────────────────────────────────────────────── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Back button and Edit button */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-100 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          
          <div className="flex items-center gap-2">
            {isEditing ? (
              <Button
                onClick={() => setIsEditing(false)}
                variant="outline"
                size="sm"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
            ) : (
              <Button
                onClick={() => setIsEditing(true)}
                size="sm"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
            )}
          </div>
        </div>
        {isEditing ? (
          <ProfileEditForm
            userId={id}
            initialData={
              profile
                ? {
                    full_name: profile.full_name,
                    phone: profile.phone,
                    address: profile.address,
                    bio: profile.bio,
                    date_of_birth: profile.date_of_birth,
                    gender: profile.gender,
                    national_id: profile.national_id,
                    nationality: profile.nationality,
                    website: profile.website,
                    linkedin: profile.linkedin,
                    emergency_contact_name: profile.emergency_contact_name,
                    emergency_contact_phone: profile.emergency_contact_phone,
                    emergency_contact_relationship: profile.emergency_contact_relationship,
                    blood_type: profile.blood_type,
                    medical_conditions: profile.medical_conditions,
                    student_id: studentProfile?.student_id,
                    enrolment_date: studentProfile?.enrolment_date,
                    grade_level_id: studentProfile?.grade_level_id,
                    previous_school: studentProfile?.previous_school,
                    scholarship_status: studentProfile?.scholarship_status,
                    special_needs: studentProfile?.special_needs,
                    department: studentProfile?.department,
                    pfp: profile.pfp || profile.image,
                  }
                : undefined
            }
            onSave={() => {
              setIsEditing(false);
              refetch();
            }}
          />
        ) : (
          <MemoizedStudentProfileView
            fullName={profile?.full_name}
            phone={profile?.phone}
            address={profile?.address}
            image={profile?.pfp || profile?.image}
            dateOfBirth={profile?.date_of_birth}
            gender={profile?.gender}
            nationalId={profile?.national_id}
            nationality={profile?.nationality}
            website={profile?.website}
            linkedin={profile?.linkedin}
            emergencyContactName={profile?.emergency_contact_name}
            emergencyContactPhone={profile?.emergency_contact_phone}
            emergencyContactRelationship={profile?.emergency_contact_relationship}
            bloodType={profile?.blood_type}
            medicalConditions={profile?.medical_conditions}
            bio={profile?.bio}
            studentProfile={studentProfile}
            loading={loading}
          />
        )}
      </main>

    </div>
  );
}