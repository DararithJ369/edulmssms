import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "./ImageUpload";
import { ProfileAvatar } from "./ProfileAvatar";
import { useProfileImageUpload } from "@/hooks/useProfileImageUpload";
import { getImageUrl } from "@/lib/imageUtils";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface ProfileEditFormProps {
  userId: string;
  initialData?: {
    full_name?: string;
    bio?: string;
    phone?: string;
    address?: string;
    date_of_birth?: string;
    gender?: string;
    national_id?: string;
    website?: string;
    linkedin?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    emergency_contact_relationship?: string;
    blood_type?: string;
    medical_conditions?: string;
    student_id?: string;
    department?: string;
    enrolment_date?: string;
    grade_level_id?: number;
    previous_school?: string;
    scholarship_status?: string;
    special_needs?: string;
    nationality?: string;
    pfp?: string;
  };
  onSave?: (data: any) => void;
}

export function ProfileEditForm({
  userId,
  initialData,
  onSave,
}: ProfileEditFormProps) {
  const [formData, setFormData] = useState({
    full_name: initialData?.full_name || "",
    bio: initialData?.bio || "",
    phone: initialData?.phone || "",
    address: initialData?.address || "",
    date_of_birth: initialData?.date_of_birth || "",
    gender: initialData?.gender || "",
    national_id: initialData?.national_id || "",
    nationality: initialData?.nationality || "",
    website: initialData?.website || "",
    linkedin: initialData?.linkedin || "",
    emergency_contact_name: initialData?.emergency_contact_name || "",
    emergency_contact_phone: initialData?.emergency_contact_phone || "",
    emergency_contact_relationship: initialData?.emergency_contact_relationship || "",
    blood_type: initialData?.blood_type || "",
    medical_conditions: initialData?.medical_conditions || "",
    student_id: initialData?.student_id || "",
    department: initialData?.department || "",
    enrolment_date: initialData?.enrolment_date || "",
    grade_level_id: initialData?.grade_level_id || "",
    previous_school: initialData?.previous_school || "",
    scholarship_status: initialData?.scholarship_status || "",
    special_needs: initialData?.special_needs || "",
  });

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState(getImageUrl(initialData?.pfp));
  const [imageDeleted, setImageDeleted] = useState(false);
  const [loading, setLoading] = useState(false);

  const { uploading } = useProfileImageUpload();

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageSelect = (file: File) => {
    setSelectedImage(file);
    // Create a local preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleImageDelete = () => {
    setImageDeleted(true);
    setSelectedImage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("full_name", formData.full_name);
      formDataToSend.append("bio", formData.bio);
      formDataToSend.append("phone", formData.phone);
      formDataToSend.append("address", formData.address);
      formDataToSend.append("date_of_birth", formData.date_of_birth);
      formDataToSend.append("gender", formData.gender);
      formDataToSend.append("national_id", formData.national_id);
      formDataToSend.append("nationality", formData.nationality);
      formDataToSend.append("website", formData.website);
      formDataToSend.append("linkedin", formData.linkedin);
      formDataToSend.append("emergency_contact_name", formData.emergency_contact_name);
      formDataToSend.append("emergency_contact_phone", formData.emergency_contact_phone);
      formDataToSend.append("emergency_contact_relationship", formData.emergency_contact_relationship);
      formDataToSend.append("blood_type", formData.blood_type);
      formDataToSend.append("medical_conditions", formData.medical_conditions);
      formDataToSend.append("student_id", formData.student_id);
      formDataToSend.append("department", formData.department);
      formDataToSend.append("enrolment_date", formData.enrolment_date);
      if (formData.grade_level_id) {
        formDataToSend.append("grade_level_id", formData.grade_level_id.toString());
      }
      formDataToSend.append("previous_school", formData.previous_school);
      formDataToSend.append("scholarship_status", formData.scholarship_status);
      formDataToSend.append("special_needs", formData.special_needs);

      // Handle image deletion
      if (imageDeleted) {
        formDataToSend.append("delete_image", "true");
      } else if (selectedImage) {
        formDataToSend.append("image", selectedImage);
      }

      const { data } = await api.put(
        `/profiles/${userId}`,
        formDataToSend
      );

      // Update imagePreview with the new image path from server
      if (data.pfp || data.image) {
        const imagePath = data.pfp || data.image;
        setImagePreview(getImageUrl(imagePath));
      }

      toast.success("Profile updated successfully");
      onSave?.(data);
      setSelectedImage(null);
    } catch (error: any) {
      toast.error(
        error.response?.data?.detail || "Failed to update profile"
      );
    } finally {
      setLoading(false);
    }
  };

  // Get initials for avatar fallback
  const initials = formData.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const selectClassName = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="max-w-4xl">
      {/* Profile Card Header */}
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-neutral-900 dark:to-neutral-800 rounded-lg shadow-sm p-8 mb-6 border border-slate-200 dark:border-neutral-700">
        <div className="flex items-center gap-6">
          <div className="rounded-full overflow-hidden shadow-md">
            <ProfileAvatar
              src={imagePreview}
              alt={formData.full_name || "Profile"}
              fallback={initials}
              size="lg"
            />
          </div>
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-neutral-100">{formData.full_name || "Your Name"}</h2>
            <p className="text-sm text-slate-600 dark:text-neutral-400 mt-1">{formData.student_id || "No ID"}</p>
          </div>
          <Button
            type="submit"
            form="profile-form"
            disabled={loading || uploading}
            size="lg"
          >
            Save Changes
          </Button>
        </div>
      </div>

      <form id="profile-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Photo Upload Section */}
        <div className="bg-white dark:bg-neutral-950 rounded-lg shadow-sm p-8 border border-slate-200 dark:border-neutral-800">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-neutral-100 mb-6">Update Profile Photo</h3>
          <div className="flex flex-col items-center justify-center">
            <ImageUpload
              onImageSelect={handleImageSelect}
              onImageDelete={handleImageDelete}
              preview={imagePreview}
              disabled={uploading || loading}
              className="w-full"
            />
          </div>
        </div>

        {/* Personal Information Section */}
        <div className="bg-white dark:bg-neutral-950 rounded-lg shadow-sm p-8 border border-slate-200 dark:border-neutral-800">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-neutral-100 mb-6">Personal Details</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="full_name" className="text-xs font-medium text-slate-700 dark:text-neutral-300">Full Name</Label>
              <Input
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                disabled={loading}
                required
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date_of_birth" className="text-xs font-medium text-slate-700 dark:text-neutral-300">Date of Birth</Label>
                <Input
                  id="date_of_birth"
                  name="date_of_birth"
                  type="date"
                  value={formData.date_of_birth ? formData.date_of_birth.split('T')[0] : ''}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="gender" className="text-xs font-medium text-slate-700 dark:text-neutral-300">Gender</Label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      gender: e.target.value,
                    }))
                  }
                  disabled={loading}
                  className={`${selectClassName} mt-1`}
                >
                  <option value="">Select gender</option>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone" className="text-xs font-medium text-slate-700 dark:text-neutral-300">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+1 (555) 000-0000"
                  disabled={loading}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="nationality" className="text-xs font-medium text-slate-700 dark:text-neutral-300">Nationality</Label>
                <Input
                  id="nationality"
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleInputChange}
                  placeholder="Country"
                  disabled={loading}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="national_id" className="text-xs font-medium text-slate-700 dark:text-neutral-300">ID / Passport Number</Label>
              <Input
                id="national_id"
                name="national_id"
                value={formData.national_id}
                onChange={handleInputChange}
                placeholder="ID number"
                disabled={loading}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="address" className="text-xs font-medium text-slate-700 dark:text-neutral-300">Address</Label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Street address"
                disabled={loading}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* Academic Information Section */}
        <div className="bg-white dark:bg-neutral-950 rounded-lg shadow-sm p-8 border border-slate-200 dark:border-neutral-800">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-neutral-100 mb-6">Academic Information</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="student_id" className="text-xs font-medium text-slate-700 dark:text-neutral-300">Student ID</Label>
                <Input
                  id="student_id"
                  name="student_id"
                  value={formData.student_id}
                  onChange={handleInputChange}
                  placeholder="STU-2024-001"
                  disabled={loading}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="enrolment_date" className="text-xs font-medium text-slate-700 dark:text-neutral-300">Enrolment Date</Label>
                <Input
                  id="enrolment_date"
                  name="enrolment_date"
                  type="date"
                  value={formData.enrolment_date ? formData.enrolment_date.split('T')[0] : ''}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="grade_level_id" className="text-xs font-medium text-slate-700 dark:text-neutral-300">Grade / Year</Label>
                <select
                  id="grade_level_id"
                  name="grade_level_id"
                  value={formData.grade_level_id}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      grade_level_id: e.target.value ? parseInt(e.target.value) : "",
                    }))
                  }
                  disabled={loading}
                  className={`${selectClassName} mt-1`}
                >
                  <option value="">Select grade</option>
                  <option value="1">Year 1</option>
                  <option value="2">Year 2</option>
                  <option value="3">Year 3</option>
                  <option value="4">Year 4</option>
                  <option value="5">Master Year 1</option>
                  <option value="6">Master Year 2</option>
                </select>
              </div>

              <div>
                <Label htmlFor="department" className="text-xs font-medium text-slate-700 dark:text-neutral-300">Department</Label>
                <Input
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  placeholder="Major / Department"
                  disabled={loading}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="previous_school" className="text-xs font-medium text-slate-700 dark:text-neutral-300">Previous School</Label>
              <Input
                id="previous_school"
                name="previous_school"
                value={formData.previous_school}
                onChange={handleInputChange}
                placeholder="School name"
                disabled={loading}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="scholarship_status" className="text-xs font-medium text-slate-700 dark:text-neutral-300">Scholarship Status</Label>
              <select
                id="scholarship_status"
                name="scholarship_status"
                value={formData.scholarship_status}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    scholarship_status: e.target.value,
                  }))
                }
                disabled={loading}
                className={`${selectClassName} mt-1`}
              >
                <option value="">Select status</option>
                <option value="None">None</option>
                <option value="Full">Full</option>
                <option value="Partial">Partial</option>
                <option value="Merit-based">Merit-based</option>
                <option value="Need-based">Need-based</option>
              </select>
            </div>

            <div>
              <Label htmlFor="special_needs" className="text-xs font-medium text-slate-700 dark:text-neutral-300">Special Needs / Accommodations</Label>
              <Textarea
                id="special_needs"
                name="special_needs"
                value={formData.special_needs}
                onChange={handleInputChange}
                placeholder="Any accommodations or special needs..."
                disabled={loading}
                rows={2}
                className="resize-none mt-1"
              />
            </div>
          </div>
        </div>

        {/* Health & Emergency Section */}
        <div className="bg-white dark:bg-neutral-950 rounded-lg shadow-sm p-8 border border-slate-200 dark:border-neutral-800">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-neutral-100 mb-6">Health & Emergency Contact</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="blood_type" className="text-xs font-medium text-slate-700 dark:text-neutral-300">Blood Type</Label>
                <select
                  id="blood_type"
                  name="blood_type"
                  value={formData.blood_type}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      blood_type: e.target.value,
                    }))
                  }
                  disabled={loading}
                  className={`${selectClassName} mt-1`}
                >
                  <option value="">Select</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>

              <div>
                <Label htmlFor="emergency_contact_relationship" className="text-xs font-medium text-slate-700 dark:text-neutral-300">Relationship</Label>
                <select
                  id="emergency_contact_relationship"
                  name="emergency_contact_relationship"
                  value={formData.emergency_contact_relationship}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      emergency_contact_relationship: e.target.value,
                    }))
                  }
                  disabled={loading}
                  className={`${selectClassName} mt-1`}
                >
                  <option value="">Select</option>
                  <option value="Parent">Parent</option>
                  <option value="Guardian">Guardian</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Relative">Relative</option>
                  <option value="Friend">Friend</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="emergency_contact_name" className="text-xs font-medium text-slate-700 dark:text-neutral-300">Emergency Contact Name</Label>
                <Input
                  id="emergency_contact_name"
                  name="emergency_contact_name"
                  value={formData.emergency_contact_name}
                  onChange={handleInputChange}
                  placeholder="Full name"
                  disabled={loading}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="emergency_contact_phone" className="text-xs font-medium text-slate-700 dark:text-neutral-300">Emergency Contact Phone</Label>
                <Input
                  id="emergency_contact_phone"
                  name="emergency_contact_phone"
                  type="tel"
                  value={formData.emergency_contact_phone}
                  onChange={handleInputChange}
                  placeholder="Phone number"
                  disabled={loading}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="medical_conditions" className="text-xs font-medium text-slate-700 dark:text-neutral-300">Medical Information</Label>
              <Textarea
                id="medical_conditions"
                name="medical_conditions"
                value={formData.medical_conditions}
                onChange={handleInputChange}
                placeholder="Allergies, medical conditions, medications..."
                disabled={loading}
                rows={2}
                className="resize-none mt-1"
              />
            </div>
          </div>
        </div>

        {/* Social & Links Section */}
        <div className="bg-white dark:bg-neutral-950 rounded-lg shadow-sm p-8 border border-slate-200 dark:border-neutral-800">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-neutral-100 mb-6">Social & Links</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="bio" className="text-xs font-medium text-slate-700 dark:text-neutral-300">Bio</Label>
              <Textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                placeholder="Tell us about yourself..."
                disabled={loading}
                rows={2}
                className="resize-none mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="website" className="text-xs font-medium text-slate-700 dark:text-neutral-300">Website</Label>
                <Input
                  id="website"
                  name="website"
                  type="url"
                  value={formData.website}
                  onChange={handleInputChange}
                  placeholder="https://example.com"
                  disabled={loading}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="linkedin" className="text-xs font-medium text-slate-700 dark:text-neutral-300">LinkedIn</Label>
                <Input
                  id="linkedin"
                  name="linkedin"
                  type="url"
                  value={formData.linkedin}
                  onChange={handleInputChange}
                  placeholder="linkedin.com/in/..."
                  disabled={loading}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end pt-4">
          <Button
            type="submit"
            disabled={loading || uploading}
          >
            {loading || uploading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}