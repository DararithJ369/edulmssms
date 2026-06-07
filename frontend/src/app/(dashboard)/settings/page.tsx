"use client";

import { useEffect, useState } from "react";
import { 
  User, 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2, 
  Globe, 
  CheckCircle,
  AlertCircle,
  HelpCircle
} from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { toast } from "react-toastify";

// Helper to capitalizer role name
const formatRole = (role: string) => {
  if (!role) return "";
  if (role.toLowerCase() === "teacher") return "Instructor";
  return role.charAt(0).toUpperCase() + role.slice(1);
};

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [submittingPhone, setSubmittingPhone] = useState(false);
  const [submittingPassword, setSubmittingPassword] = useState(false);

  // User and Profile Data
  const [userData, setUserData] = useState<{
    id: string;
    username: string;
    email: string;
    role: { name: string };
    is_active: boolean;
  } | null>(null);

  const [profileData, setProfileData] = useState<any>(null);

  // Form states
  const [newPhone, setNewPhone] = useState("");
  const [currentPhone, setCurrentPhone] = useState("");

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Show/Hide password states
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Load user data
  const loadData = async () => {
    try {
      setLoading(true);
      const meRes = await api.get("/users/me");
      setUserData(meRes.data);

      const profileRes = await api.get(`/profiles/${meRes.data.id}`);
      setProfileData(profileRes.data);
      setCurrentPhone(profileRes.data?.phone || "");
      setNewPhone(profileRes.data?.phone || "");
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to load account settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle phone update
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPhone.trim() === currentPhone) {
      toast.info("Phone number is already set to this value");
      return;
    }

    try {
      setSubmittingPhone(true);
      const res = await api.put("/users/me/phone", {
        new_phone: newPhone.trim(),
      });
      toast.success(res.data?.detail || "Phone number updated successfully");
      setCurrentPhone(newPhone.trim());
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to update phone number");
    } finally {
      setSubmittingPhone(false);
    }
  };

  // Handle password change
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New password and confirmation password do not match");
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    if (!/\d/.test(passwordForm.newPassword) || !/[a-zA-Z]/.test(passwordForm.newPassword)) {
      toast.error("Password must contain at least one letter and one digit");
      return;
    }

    if (passwordForm.newPassword === passwordForm.currentPassword) {
      toast.error("New password cannot be the same as your current password");
      return;
    }

    try {
      setSubmittingPassword(true);
      const res = await api.put("/users/me/password", {
        current_password: passwordForm.currentPassword,
        new_password: passwordForm.newPassword,
        confirm_password: passwordForm.confirmPassword,
      });
      toast.success(res.data?.detail || "Password changed successfully");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to change password");
    } finally {
      setSubmittingPassword(false);
    }
  };

  // Helper to infer Employee / Student ID
  const getIdentifier = () => {
    if (userData?.role?.name?.toLowerCase() === "student") {
      return profileData?.student_profile?.student_id || "N/A";
    }
    if (["instructor", "teacher"].includes(userData?.role?.name?.toLowerCase() || "")) {
      return profileData?.instructor_profile?.id 
        ? `EMP-${profileData.instructor_profile.id.toString().padStart(4, "0")}` 
        : "N/A";
    }
    return "N/A";
  };

  // Helper to infer department
  const getDepartment = () => {
    if (userData?.role?.name?.toLowerCase() === "student") {
      return profileData?.student_profile?.department || "N/A";
    }
    if (["instructor", "teacher"].includes(userData?.role?.name?.toLowerCase() || "")) {
      return profileData?.instructor_profile?.department || "N/A";
    }
    return "N/A";
  };

  // Helper to infer faculty
  const getFaculty = () => {
    const dept = getDepartment()?.toLowerCase() || "";
    if (dept.includes("computer") || dept.includes("science") || dept.includes("software") || dept.includes("programming")) {
      return "Faculty of Computer Science & Applied Mathematics";
    }
    if (dept.includes("engineering") || dept.includes("electronic") || dept.includes("telecom")) {
      return "Faculty of Engineering & Telecommunications";
    }
    if (dept.includes("business") || dept.includes("finance") || dept.includes("management")) {
      return "School of Business & Administration";
    }
    if (dept === "n/a") return "N/A";
    return "School of Science & Humanities";
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-10 w-10 text-[#0038A8] animate-spin" />
        <p className="text-slate-400 font-semibold text-xs tracking-wider uppercase">Loading account settings...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 space-y-6 bg-[#F7F8FA] min-h-screen relative font-sans text-left transition-colors duration-300 animate-in fade-in">
      {/* BREADCRUMB */}
      <div className="flex items-center gap-1 text-[11px] font-extrabold text-muted-foreground uppercase tracking-wider mb-2 select-none">
        <Link href="/" className="hover:text-foreground flex items-center gap-1">
          <Globe className="h-3 w-3" />
          Home
        </Link>
        <span>/</span>
        <span className="text-foreground">Settings</span>
      </div>

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 select-none mb-6">
        <div>
          <span className="text-xs font-extrabold text-[#0038A8] uppercase tracking-wider font-mono">
            System Control Panel
          </span>
          <h1 className="text-xl md:text-3xl font-black text-slate-800 tracking-tight leading-tight mt-0.5">
            User Settings & Profile
          </h1>
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* LEFT COLUMN: READ-ONLY INFORMATION */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] relative overflow-hidden">
            <div className="absolute top-0 right-0 h-24 w-24 bg-gradient-to-bl from-indigo-50/50 to-transparent rounded-full -mr-6 -mt-6 select-none pointer-events-none" />
            
            <div className="flex items-center gap-2 mb-6 border-b border-slate-50 pb-4">
              <User className="h-5 w-5 text-[#0038A8]" />
              <h2 className="text-lg font-black text-slate-800 tracking-tight">
                Account Information
              </h2>
            </div>

            <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
              <div>
                <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Full Name</p>
                <p className="text-sm font-bold text-slate-700 mt-1">{profileData?.full_name || userData?.username}</p>
              </div>

              <div>
                <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                  {userData?.role?.name?.toLowerCase() === "student" ? "Student ID" : "Employee ID"}
                </p>
                <p className="text-sm font-bold text-slate-700 mt-1 font-mono">{getIdentifier()}</p>
              </div>

              <div>
                <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Email Address</p>
                <p className="text-sm font-bold text-slate-700 mt-1">{userData?.email}</p>
              </div>

              <div>
                <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Role</p>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E8F0FE] text-[#0038A8] mt-1">
                  {formatRole(userData?.role?.name || "")}
                </span>
              </div>

              <div>
                <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Department</p>
                <p className="text-sm font-bold text-slate-700 mt-1">{getDepartment()}</p>
              </div>

              <div>
                <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Faculty</p>
                <p className="text-sm font-bold text-slate-700 mt-1">{getFaculty()}</p>
              </div>

              <div>
                <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Account Status</p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-sm font-bold text-slate-700">{userData?.is_active ? "Active" : "Inactive"}</p>
                </div>
              </div>
            </div>

            {/* NOTICE */}
            <div className="mt-8 p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-start gap-3 select-none">
              <AlertCircle className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
              <p className="text-xs font-medium text-slate-500 leading-relaxed">
                Personal academic information is managed by the institution. Contact an administrator if corrections are required.
              </p>
            </div>
          </div>

          {/* PHONE NUMBER CARD */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] relative overflow-hidden">
            <div className="flex items-center gap-2 mb-6 border-b border-slate-50 pb-4">
              <Phone className="h-5 w-5 text-[#0038A8]" />
              <h2 className="text-lg font-black text-slate-800 tracking-tight">
                Phone Number
              </h2>
            </div>

            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2">
                    Current Phone Number
                  </label>
                  <input
                    type="text"
                    disabled
                    value={currentPhone || "Not set"}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-500 font-bold font-mono focus:outline-none cursor-not-allowed text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2">
                    New Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. +1 555-0199"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold font-mono focus:outline-none focus:ring-2 focus:ring-[#0038A8] focus:border-transparent transition-all text-sm placeholder-slate-300"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={submittingPhone}
                  className="px-6 py-3 bg-[#0038A8] hover:bg-[#002D86] text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-500/10 transition-all active:scale-[0.98] flex items-center gap-2 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingPhone ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Saving Number...</span>
                    </>
                  ) : (
                    <span>Save Phone Number</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: CHANGE PASSWORD */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] relative overflow-hidden h-full">
            <div className="flex items-center gap-2 mb-6 border-b border-slate-50 pb-4">
              <Lock className="h-5 w-5 text-[#0038A8]" />
              <h2 className="text-lg font-black text-slate-800 tracking-tight">
                Security
              </h2>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrent ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="w-full px-4 py-3 pr-12 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-[#0038A8] focus:border-transparent transition-all text-sm placeholder-slate-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full px-4 py-3 pr-12 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-[#0038A8] focus:border-transparent transition-all text-sm placeholder-slate-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full px-4 py-3 pr-12 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-[#0038A8] focus:border-transparent transition-all text-sm placeholder-slate-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Password strength tip */}
              <div className="p-3 bg-blue-50/50 border border-blue-100/50 rounded-xl flex gap-2 text-[10px] text-[#0038A8]/80 leading-relaxed font-semibold">
                <HelpCircle className="h-4 w-4 text-[#0038A8] shrink-0" />
                <p>Password must be at least 8 characters long and contain both letters and digits.</p>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={submittingPassword}
                  className="w-full py-3 bg-[#0038A8] hover:bg-[#002D86] text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-500/10 transition-all active:scale-[0.98] flex items-center justify-center gap-2 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingPassword ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <span>Change Password</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
