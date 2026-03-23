import { useParams, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Edit, X } from "lucide-react";
import { useAuth } from "@/hooks/AuthProvider";

interface UserData {
  _id?: string;
  id: string;
  username: string;
  email: string;
  role: { id: number; name: string } | string;
  name?: string;
  image?: string;
  is_active: boolean;
}

interface ProfileData {
  id: number;
  user_id: string;
  class_id?: number;
  full_name?: string;
  bio?: string;
  pfp?: string;
  phone?: string;
  address?: string;
  created_at?: string;
  updated_at?: string;
  // Instructor-specific fields
  instructor_profile?: {
    id: number;
    department?: string;
    position?: string;
    office?: string;
  };
  // Student-specific fields
  student_profile?: {
    id: number;
    student_id?: string;
    department?: string;
    enrolment_date?: string;
    grade_level_id?: number;
    grade_level_name?: string;
    class_id?: number;
    parents?: Array<{
      id: number;
      occupation?: string;
      parent_relationship?: string;
      emergency_phone?: string;
      full_name?: string;
      profile?: {
        user_id?: string;
      };
    }>;
  };
  // Parent-specific fields
  parent_profile?: {
    id: number;
    occupation?: string;
    relationship?: string;
    emergency_phone?: string;
    students?: Array<{
      id: number;
      student_id?: string;
      enrolment_date?: string;
      full_name?: string;
      profile?: {
        user_id?: string;
      };
    }>;
  };
}

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const currentUserRole = currentUser && typeof currentUser.role === 'object' 
    ? (currentUser.role as any).name 
    : currentUser?.role;
  
  const canEdit = currentUser?._id === userId || currentUserRole === "admin";

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return;
      try {
        setLoading(true);
        // Fetch user data
        const userRes = await api.get(`/users/${userId}`);
        setUserData(userRes.data);
        
        // Fetch profile data
        try {
          const profileRes = await api.get(`/profiles/${userId}`);
          setProfileData(profileRes.data);
        } catch (err) {
          // Profile might not exist yet, that's ok
          console.log("Profile not found, will be created on first edit");
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to load user profile");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center text-muted-foreground">Loading profile...</div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center text-muted-foreground">User not found</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{userData.username}</h2>
            <p className="text-muted-foreground">{userData.email}</p>
          </div>
        </div>
        {canEdit && (
          <Button
            onClick={() => setIsEditing(!isEditing)}
            variant={isEditing ? "destructive" : "default"}
          >
            {isEditing ? (
              <>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </>
            ) : (
              <>
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </>
            )}
          </Button>
        )}
      </div>

      {/* Profile Content */}
      <div className="grid gap-6">
        {/* View Mode */}
        {!isEditing && (
          <div className="grid gap-6 md:grid-cols-2">
            {/* User Info Card */}
            <Card>
              <CardHeader>
                <CardTitle>User Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Username
                  </label>
                  <p className="text-lg">{userData.username}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Email
                  </label>
                  <p className="text-lg">{userData.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Full Name
                  </label>
                  <p className="text-lg">{profileData?.full_name || userData.name || userData.username || "-"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Role
                  </label>
                  <p className="text-lg capitalize">
                    {typeof userData.role === 'string' 
                      ? userData.role 
                      : userData.role?.name || 'unknown'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Status
                  </label>
                  <p>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        userData.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {userData.is_active ? "Active" : "Inactive"}
                    </span>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Profile Details Card */}
            {profileData && (
              <Card>
                <CardHeader>
                  <CardTitle>Profile Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Full Name (Profile)
                    </label>
                    <p className="text-lg">{profileData.full_name || "-"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Phone
                    </label>
                    <p className="text-lg">{profileData.phone || "-"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Address
                    </label>
                    <p className="text-lg">{profileData.address || "-"}</p>
                  </div>
                  {profileData.instructor_profile && (
                    <>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Department
                        </label>
                        <p className="text-lg">{profileData.instructor_profile.department || "-"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Position
                        </label>
                        <p className="text-lg">{profileData.instructor_profile.position || "-"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Office
                        </label>
                        <p className="text-lg">{profileData.instructor_profile.office || "-"}</p>
                      </div>
                    </>
                  )}
                  {profileData.student_profile && (
                    <>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Student ID
                        </label>
                        <p className="text-lg">{profileData.student_profile.student_id || "-"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Department
                        </label>
                        <p className="text-lg">{profileData.student_profile.department || "-"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Year/Grade Level
                        </label>
                        <p className="text-lg">{profileData.student_profile.grade_level_name || "-"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Enrolment Date
                        </label>
                        <p className="text-lg">
                          {profileData.student_profile.enrolment_date 
                            ? new Date(profileData.student_profile.enrolment_date).toLocaleDateString()
                            : "-"}
                        </p>
                      </div>
                      {profileData.student_profile.parents && profileData.student_profile.parents.length > 0 && (
                        <div className="md:col-span-full">
                          <label className="text-sm font-medium text-muted-foreground">
                            Parent(s)
                          </label>
                          <div className="mt-2 space-y-2">
                            {profileData.student_profile.parents.map((parent, idx) => (
                              <div key={idx} className="p-3 bg-muted rounded border hover:bg-muted/80 transition">
                                <button
                                  onClick={() => parent.profile?.user_id && navigate(`/users/${parent.profile.user_id}`)}
                                  disabled={!parent.profile?.user_id}
                                  className="font-medium text-blue-600 hover:text-blue-800 hover:underline disabled:text-gray-500 disabled:cursor-default"
                                >
                                  {parent.full_name || `Parent ${idx + 1}`}
                                </button>
                                <p className="text-sm text-muted-foreground">
                                  Relationship: {parent.parent_relationship || "-"}
                                </p>
                                {parent.occupation && (
                                  <p className="text-sm text-muted-foreground">
                                    Occupation: {parent.occupation}
                                  </p>
                                )}
                                {parent.emergency_phone && (
                                  <p className="text-sm text-muted-foreground">
                                    Emergency Phone: {parent.emergency_phone}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  {profileData.parent_profile && (
                    <>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Occupation
                        </label>
                        <p className="text-lg">{profileData.parent_profile.occupation || "-"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Relationship
                        </label>
                        <p className="text-lg">{profileData.parent_profile.relationship || "-"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Emergency Phone
                        </label>
                        <p className="text-lg">{profileData.parent_profile.emergency_phone || "-"}</p>
                      </div>
                      {profileData.parent_profile.students && profileData.parent_profile.students.length > 0 && (
                        <div className="md:col-span-full">
                          <label className="text-sm font-medium text-muted-foreground">
                            Linked Students
                          </label>
                          <div className="mt-2 space-y-2">
                            {profileData.parent_profile.students.map((student, idx) => (
                              <div key={idx} className="p-3 bg-muted rounded border hover:bg-muted/80 transition">
                                <button
                                  onClick={() => student.profile?.user_id && navigate(`/users/${student.profile.user_id}`)}
                                  disabled={!student.profile?.user_id}
                                  className="font-medium text-blue-600 hover:text-blue-800 hover:underline disabled:text-gray-500 disabled:cursor-default"
                                >
                                  {student.full_name || `Student ${idx + 1}`}
                                </button>
                                <p className="text-sm text-muted-foreground">
                                  Student ID: {student.student_id || "-"}
                                </p>
                                {student.enrolment_date && (
                                  <p className="text-xs text-muted-foreground">
                                    Enrolled: {new Date(student.enrolment_date).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Bio
                    </label>
                    <p className="text-lg">{profileData.bio || "-"}</p>
                  </div>
                  {profileData.created_at && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Created
                      </label>
                      <p className="text-sm">
                        {new Date(profileData.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Edit Mode */}
        {isEditing && (
          <Card>
            <CardHeader>
              <CardTitle>Edit Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* User Info Form Section */}
                <div className="border-b pb-6">
                  <h3 className="font-semibold mb-4">User Information</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium">Username</label>
                      <input
                        type="text"
                        value={userData.username}
                        disabled
                        className="w-full px-3 py-2 border rounded-md bg-muted text-muted-foreground cursor-not-allowed"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Cannot be changed
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Email</label>
                      <input
                        type="email"
                        value={userData.email}
                        disabled
                        className="w-full px-3 py-2 border rounded-md bg-muted text-muted-foreground cursor-not-allowed"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Cannot be changed
                      </p>
                    </div>
                  </div>
                </div>

                {/* Profile Details Form Section */}
                <div>
                  <h3 className="font-semibold mb-4">Profile Details</h3>
                  <ProfileForm
                    profileData={profileData}
                    userData={userData}
                    userId={userId!}
                    onSuccess={() => {
                      toast.success("Profile updated successfully");
                      setIsEditing(false);
                      // Refresh profile data
                      window.location.reload();
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// Profile Form Component
function ProfileForm({
  profileData,
  userData,
  userId,
  onSuccess,
}: {
  profileData: ProfileData | null;
  userData: UserData | null;
  userId: string;
  onSuccess: () => void;
}) {
  const getUserRole = (user: UserData | null): string => {
    if (!user) return '';
    return typeof user.role === 'object' ? user.role.name.toLowerCase() : user.role.toLowerCase();
  };

  const userRole = getUserRole(userData);
  
  const [formData, setFormData] = useState({
    full_name: profileData?.full_name || "",
    phone: profileData?.phone || "",
    address: profileData?.address || "",
    bio: profileData?.bio || "",
    // Instructor fields
    department: profileData?.instructor_profile?.department || "",
    position: profileData?.instructor_profile?.position || "",
    office: profileData?.instructor_profile?.office || "",
    // Student fields
    student_id: profileData?.student_profile?.student_id || "",
    enrolment_date: profileData?.student_profile?.enrolment_date || "",
    // Parent fields
    occupation: profileData?.parent_profile?.occupation || "",
    relationship: profileData?.parent_profile?.relationship || "",
    emergency_phone: profileData?.parent_profile?.emergency_phone || "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);

      const form = new FormData();
      form.append("full_name", formData.full_name);
      form.append("phone", formData.phone);
      form.append("address", formData.address);
      form.append("bio", formData.bio);
      
      // Add instructor fields if they exist
      if (formData.department) form.append("department", formData.department);
      if (formData.position) form.append("position", formData.position);
      if (formData.office) form.append("office", formData.office);
      
      // Add student fields if they exist
      if (formData.student_id) form.append("student_id", formData.student_id);
      if (formData.enrolment_date) form.append("enrolment_date", formData.enrolment_date);
      
      // Add parent fields if they exist
      if (formData.occupation) form.append("occupation", formData.occupation);
      if (formData.relationship) form.append("relationship", formData.relationship);
      if (formData.emergency_phone) form.append("emergency_phone", formData.emergency_phone);

      if (profileData) {
        // Update existing profile
        await api.put(`/profiles/${userId}`, form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        // Create new profile
        await api.post(`/profiles/${userId}`, form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      onSuccess();
    } catch (error) {
      console.error(error);
      toast.error("Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Full Name</label>
          <input
            type="text"
            value={formData.full_name}
            onChange={(e) =>
              setFormData({ ...formData, full_name: e.target.value })
            }
            className="w-full px-3 py-2 border rounded-md"
            placeholder="Enter full name"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Phone</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
            className="w-full px-3 py-2 border rounded-md"
            placeholder="Enter phone number"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Address</label>
        <input
          type="text"
          value={formData.address}
          onChange={(e) =>
            setFormData({ ...formData, address: e.target.value })
          }
          className="w-full px-3 py-2 border rounded-md"
          placeholder="Enter address"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Bio</label>
        <textarea
          value={formData.bio}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          className="w-full px-3 py-2 border rounded-md"
          placeholder="Enter bio"
          rows={4}
        />
      </div>

      {/* Instructor-specific fields */}
      {userRole === 'instructor' && (
        <div className="border-t pt-4 mt-4">
          <h4 className="font-semibold mb-4">Instructor Information</h4>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium">Department</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) =>
                  setFormData({ ...formData, department: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Enter department"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Position</label>
              <input
                type="text"
                value={formData.position}
                onChange={(e) =>
                  setFormData({ ...formData, position: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Enter position"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Office</label>
              <input
                type="text"
                value={formData.office}
                onChange={(e) =>
                  setFormData({ ...formData, office: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Enter office location"
              />
            </div>
          </div>
        </div>
      )}

      {/* Student-specific fields */}
      {userRole === 'student' && (
        <div className="border-t pt-4 mt-4">
          <h4 className="font-semibold mb-4">Student Information</h4>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Student ID</label>
              <input
                type="text"
                value={formData.student_id}
                onChange={(e) =>
                  setFormData({ ...formData, student_id: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Enter student ID"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Enrolment Date</label>
              <input
                type="date"
                value={formData.enrolment_date}
                onChange={(e) =>
                  setFormData({ ...formData, enrolment_date: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>
        </div>
      )}

      {/* Parent-specific fields */}
      {userRole === 'parent' && (
        <div className="border-t pt-4 mt-4">
          <h4 className="font-semibold mb-4">Parent Information</h4>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium">Occupation</label>
              <input
                type="text"
                value={formData.occupation}
                onChange={(e) =>
                  setFormData({ ...formData, occupation: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Enter occupation"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Relationship</label>
              <select
                value={formData.relationship}
                onChange={(e) =>
                  setFormData({ ...formData, relationship: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">Select relationship</option>
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
                <option value="Guardian">Guardian</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Emergency Phone</label>
              <input
                type="tel"
                value={formData.emergency_phone}
                onChange={(e) =>
                  setFormData({ ...formData, emergency_phone: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Enter emergency phone"
              />
            </div>
          </div>
        </div>
      )}

      <Button type="submit" disabled={loading}>
        {loading ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
}
