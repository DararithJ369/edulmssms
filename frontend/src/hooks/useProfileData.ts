import { useState, useCallback, useEffect } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface ProfileData {
  id: number;
  user_id: string;
  full_name?: string;
  phone?: string;
  address?: string;
  bio?: string;
  pfp?: string;  // Backend returns pfp, not image
  image?: string; // Also check for image for backward compatibility
  date_of_birth?: string;
  gender?: string;
  national_id?: string;
  nationality?: string;
  website?: string;
  linkedin?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  blood_type?: string;
  medical_conditions?: string;
  student_profile?: any;
  instructor_profile?: any;
  parent_profile?: any;
  created_at?: string;
  updated_at?: string;
}

interface UseProfileDataReturn {
  profile: ProfileData | null;
  profileData: ProfileData | null;
  studentProfile: any | null;
  instructorProfile: any | null;
  parentProfile: any | null;
  linkedStudents: any[] | null;
  loading: boolean;
  error: string | null;
  fetchProfile: (userId: string | number) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useProfileData(initialUserId?: string | number): UseProfileDataReturn {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | number | undefined>(initialUserId);

  const fetchProfile = useCallback(async (userId: string | number) => {
    try {
      setLoading(true);
      setError(null);
      setCurrentUserId(userId);

      const { data } = await api.get(`/profiles/${userId}`);
      // console.log("✅ useProfileData - Full API Response:", JSON.stringify(data, null, 2));
      // console.log("✅ useProfileData - pfp field:", data.pfp);
      // console.log("✅ useProfileData - image field:", data.image);
      setProfileData(data);
    } catch (err: any) {
      const message =
        err.response?.data?.detail || err.message || "Failed to fetch profile";
      console.error("useProfileData - error:", message);
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(async () => {
    if (currentUserId) {
      await fetchProfile(currentUserId);
    }
  }, [currentUserId, fetchProfile]);

  // Auto-fetch if initialUserId is provided and valid
  useEffect(() => {
    if (initialUserId && initialUserId !== 0 && initialUserId !== "") {
      fetchProfile(initialUserId);
    }
  }, [initialUserId, fetchProfile]);

  return {
    profile: profileData,
    profileData,
    studentProfile: profileData?.student_profile || null,
    instructorProfile: profileData?.instructor_profile || null,
    parentProfile: profileData?.parent_profile || null,
    linkedStudents: profileData?.parent_profile?.students || null,
    loading,
    error,
    fetchProfile,
    refetch,
  };
}
