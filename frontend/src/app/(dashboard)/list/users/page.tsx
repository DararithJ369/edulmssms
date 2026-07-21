"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Globe, Search, ListFilter, Plus, Trash2, Edit, X, Save, 
  Shield, Mail, User as UserIcon, UserCheck, UserX, ChevronDown, ChevronUp 
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "react-toastify";
import { useDialog } from "@/hooks/DialogProvider";
import PageHeader from "@/components/PageHeader";
import Avatar from "@/components/Avatar";



type Role = {
  id: number;
  name: string;
};

type UserItem = {
  id: string;
  username: string;
  email: string;
  role_id: number;
  is_active: boolean;
  role: Role;
  image?: string;
  profile_image?: string;
};

export default function UsersListPage() {
  const { confirm } = useDialog();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  
  // Checkbox selection & Row expansion states
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  
  // Form values
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState<number | "">("");
  const [saving, setSaving] = useState(false);

  const toggleSelectUser = (id: string) => {
    setSelectedUserIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedUserIds.size === users.length && users.length > 0) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(users.map(u => u.id)));
    }
  };

  const toggleExpandUser = (id: string) => {
    setExpandedUserId(prev => (prev === id ? null : id));
  };
  
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get(
        `/users?page=${currentPage}&limit=10&search=${debouncedSearchQuery}&role=${roleFilter}`
      );
      setUsers(res.data.data || []);
      setTotalUsers(res.data.meta?.total || 0);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load users directory.");
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await api.get("/roles?limit=50");
      const fetched: Role[] = res.data.data || [];
      setRoles(fetched);
      if (fetched.length > 0) {
        const studentRole = fetched.find(r => r.name.toLowerCase() === "student");
        setRoleId(studentRole?.id ?? fetched[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch users when dependencies change
  useEffect(() => {
    fetchUsers();
  }, [currentPage, debouncedSearchQuery, roleFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedSearchQuery(searchQuery);
    setCurrentPage(1);
  };

  const handleCreateOpen = () => {
    setUsername("");
    setEmail("");
    setPassword("");
    const studentRole = roles.find(r => r.name.toLowerCase() === "student");
    setRoleId(studentRole?.id ?? roles[0]?.id ?? "");
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !email.trim() || !password.trim() || !roleId) {
      toast.warn("Please fill in all required fields including role.");
      return;
    }
    
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("username", username.trim());
      fd.append("email", email.trim());
      fd.append("password", password.trim());
      fd.append("role_id", String(roleId));

      await api.post("/users", fd);
      toast.success("User created successfully!");
      setIsCreateOpen(false);
      fetchUsers();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Error creating user.");
    } finally {
      setSaving(false);
    }
  };

  const handleEditOpen = (user: UserItem) => {
    setSelectedUser(user);
    setUsername(user.username);
    setEmail(user.email);
    setPassword(""); // Keep password empty unless changing
    setRoleId(user.role_id);
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (!username.trim() || !email.trim()) {
      toast.warn("Username and Email are required.");
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("username", username.trim());
      fd.append("email", email.trim());
      fd.append("password", password.trim() || ""); // optional password update
      fd.append("role_id", String(roleId));

      await api.put(`/users/${selectedUser.id}`, fd);
      toast.success("User updated successfully!");
      setIsEditOpen(false);
      fetchUsers();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Error updating user details.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: "Delete User Account",
      description: "Are you sure you want to delete this user? This will permanently remove all associated student/teacher/parent profiles.",
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive"
    });
    if (!isConfirmed) {
      return;
    }
    try {
      await api.delete(`/users/${id}`);
      toast.success("User deleted successfully!");
      fetchUsers();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to delete user.");
    }
  };


  const getRoleBadgeColor = (roleName: string) => {
    switch (roleName.toLowerCase()) {
      case "admin": return "bg-indigo-50 text-indigo-700 border-indigo-200/50";
      case "instructor":
      case "teacher": return "bg-emerald-50 text-emerald-700 border-emerald-200/50";
      case "student": return "bg-sky-50 text-sky-700 border-sky-200/50";
      case "parent": return "bg-amber-50 text-amber-700 border-amber-200/50";
      default: return "bg-slate-50 text-slate-700 border-slate-200/50";
    }
  };

  const totalPages = Math.ceil(totalUsers / 10) || 1;

  return (
    <div className="flex-1 p-6 space-y-6 bg-[#F7F8FA] min-h-screen relative font-sans text-left transition-all duration-300">
      
      {/* PAGE HEADER */}
      <PageHeader
        eyebrow="System Administration"
        title="Users Directory"
        breadcrumbs={[{ label: "Users" }]}
        actions={
          <button 
            onClick={handleCreateOpen}
            className="px-4 py-2 bg-[#0038A8] text-white hover:bg-[#002D86] font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5 active:scale-[0.98] cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add User</span>
          </button>
        }
      />


      {/* FILTER & SEARCH PANEL */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-3 select-none">
        <div className="flex items-center gap-2 text-xs font-extrabold text-muted-foreground">
          <span className="px-2.5 py-1 bg-white border border-border/80 text-foreground rounded-lg shadow-sm">
            {totalUsers} Total Users
          </span>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto flex-wrap w-full md:w-auto">
          {/* Role Filter Dropdown */}
          <div className="relative">
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 text-xs bg-white border border-border/80 rounded-xl outline-none text-foreground cursor-pointer focus:border-[#0038A8]/50"
            >
              <option value="">All Roles</option>
              {roles.map(r => (
                <option key={r.id} value={r.name}>{r.name}</option>
              ))}
            </select>
          </div>

          <form onSubmit={handleSearchSubmit} className="relative flex-1 md:flex-initial">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
            <input
              type="text"
              placeholder="Search username or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-64 pl-9 pr-4 py-2 text-xs bg-white border border-border/80 focus:border-[#0038A8]/50 rounded-xl outline-none text-foreground"
            />
          </form>
        </div>
      </div>

      {/* USERS TABLE */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white border border-border/60 rounded-3xl">
          <div className="h-10 w-10 border-4 border-[#0038A8] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs font-bold text-muted-foreground">Loading users directory...</p>
        </div>
      ) : users.length > 0 ? (
        <div className="bg-white border border-border/60 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.01)] overflow-hidden">
          <div className="w-full overflow-x-auto">
            <div className="min-w-[1000px] flex flex-col">
              {/* TABLE HEADER */}
              <div className="flex items-center h-12 px-6 bg-slate-50/50 border-b border-border/60 text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider select-none">
                <div className="w-12 shrink-0 flex items-center justify-center" /> {/* Chevron expand spacer */}
                <div className="flex-1 min-w-[200px]">Name</div>
                <div className="w-36 shrink-0">Position</div>
                <div className="w-36 shrink-0">Department</div>
                <div className="flex-1 min-w-[180px]">Email</div>
                <div className="w-36 shrink-0">Phone</div>
                <div className="w-28 shrink-0">Status</div>
                <div className="w-24 shrink-0 text-right">Edit</div>
              </div>

              {/* TABLE ROWS */}
              <div className="divide-y divide-border/60">
                {users.map((user) => {
                  const isExpanded = expandedUserId === user.id;

                  // Deterministic mock department and phone number based on username/id
                  const hashVal = user.username.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
                  const mockDepartment = ["Engineering", "Finances", "Sales Team", "Human Resources", "Marketing", "Customer Success"][hashVal % 6];
                  const mockPhone = `(252) 555-0${100 + (hashVal % 900)}`;

                  return (
                    <div 
                      key={user.id} 
                      className={`flex flex-col transition-all duration-200 ${
                        isExpanded 
                          ? "border-y-2 border-brand bg-brand/[0.005] my-[2px] first:mt-0 last:mb-0 shadow-[0_2px_8px_rgba(0,56,168,0.02)]" 
                          : "hover:bg-slate-50/15"
                      }`}
                    >
                      {/* Main User Row */}
                      <div className="flex items-center h-16 px-6">
                        {/* Expand/Collapse Chevron */}
                        <div className="w-12 flex items-center justify-center shrink-0">
                          <button
                            onClick={() => toggleExpandUser(user.id)}
                            className={`p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors cursor-pointer`}
                          >
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </div>

                        {/* Name (Avatar + Username) */}
                        <div className="flex-1 min-w-[200px] flex items-center gap-3">
                          <Avatar username={user.username} image={user.image} />
                          <span className="text-sm font-extrabold text-foreground tracking-tight truncate">
                            {user.username}
                          </span>
                        </div>

                        {/* Position (Role) */}
                        <div className="w-36 shrink-0 text-left">
                          <span className="px-2 py-0.5 border border-slate-200 bg-slate-50 text-slate-600 text-[9px] font-black uppercase tracking-wider rounded-lg">
                            {user.role?.name || "user"}
                          </span>
                        </div>

                        {/* Department */}
                        <div className="w-36 shrink-0 text-left truncate text-xs font-semibold text-slate-600">
                          {mockDepartment}
                        </div>

                        {/* Email */}
                        <div className="flex-1 min-w-[180px] text-left truncate text-xs font-medium text-slate-500">
                          {user.email}
                        </div>

                        {/* Phone */}
                        <div className="w-36 shrink-0 text-left truncate text-xs font-semibold text-slate-600">
                          {mockPhone}
                        </div>

                        {/* Status badge */}
                        <div className="w-28 shrink-0 flex items-center">
                          {user.is_active ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-800 select-none">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 select-none">
                              <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                              Inactive
                            </span>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="w-24 shrink-0 flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleEditOpen(user)}
                            className="p-1.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 text-slate-500 hover:text-brand rounded-lg transition-colors cursor-pointer"
                            title="Edit User"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="p-1.5 bg-slate-50 hover:bg-red-50 border border-slate-200 text-slate-500 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                            title="Delete User"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Expanded Section */}
                      {isExpanded && (
                        <div className="bg-slate-50/40 border-t border-border/40 p-6 grid grid-cols-2 md:grid-cols-5 gap-6 select-none animate-slide-up">
                          <div className="space-y-1">
                            <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">Office Location</span>
                            <p className="text-xs font-semibold text-slate-700 leading-normal">
                              {user.role?.name.toLowerCase() === "admin" 
                                ? "Main Admin Block, Rm 102"
                                : user.role?.name.toLowerCase() === "instructor" || user.role?.name.toLowerCase() === "teacher"
                                  ? "Faculty Office Wing B, Rm 304"
                                  : "Student Common Area"}
                            </p>
                          </div>
                          
                          <div className="space-y-1">
                            <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">Associated Mates</span>
                            <p className="text-xs font-semibold text-slate-700 leading-normal">
                              {user.role?.name.toLowerCase() === "student"
                                ? "Year 3 Section A"
                                : user.role?.name.toLowerCase() === "parent"
                                  ? "Linked Child Profiles"
                                  : "Academic Council Dept."}
                            </p>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">Created Date</span>
                            <p className="text-xs font-semibold text-slate-700 leading-normal">
                              AY 2025/2026
                            </p>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">Access Clearance</span>
                            <p className="text-xs font-semibold text-slate-700 leading-normal capitalize">
                              {user.role?.name || "Standard User"} Access
                            </p>
                          </div>

                          <div className="space-y-1 col-span-2 md:col-span-1">
                            <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">User Reference ID</span>
                            <p className="text-xs font-mono font-bold text-[#0038A8] truncate" title={user.id}>
                              {user.id}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-border/60 rounded-3xl p-16 text-center text-muted-foreground">
          <UserIcon className="h-10 w-10 mx-auto mb-2 opacity-25" />
          <p className="text-sm font-bold">No users found matching query constraints.</p>
        </div>
      )}

      {/* PAGINATION PANEL */}
      {totalPages > 1 && (
        <div className="bg-white border border-border/60 rounded-3xl p-4 shadow-sm flex justify-center items-center select-none gap-2 shrink-0">
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            className="px-3 py-1.5 text-xs font-bold border border-border rounded-xl disabled:opacity-40 hover:bg-slate-50 bg-white cursor-pointer"
          >
            Prev
          </button>
          <span className="text-xs font-extrabold px-3 text-muted-foreground uppercase">
            Page {currentPage} of {totalPages}
          </span>
          <button 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            className="px-3 py-1.5 text-xs font-bold border border-border rounded-xl disabled:opacity-40 hover:bg-slate-50 bg-white cursor-pointer"
          >
            Next
          </button>
        </div>
      )}

      {/* CREATE MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white border border-border p-6 rounded-3xl shadow-xl w-full max-w-md text-left flex flex-col gap-4 relative">
            <button 
              onClick={() => setIsCreateOpen(false)}
              className="absolute top-4 right-4 p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="h-4.5 w-4.5" />
            </button>
            
            <h2 className="text-lg font-black text-gray-900 tracking-tight">Create User Account</h2>
            
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider">Username</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. jdoe"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-border/80 focus:border-[#0038A8]/50 rounded-xl outline-none text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jdoe@school.edu"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-border/80 focus:border-[#0038A8]/50 rounded-xl outline-none text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-slate-50 border border-border/80 focus:border-[#0038A8]/50 rounded-xl outline-none text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider">Role Access</label>
                <select
                  value={roleId}
                  onChange={(e) => setRoleId(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-border/80 rounded-xl outline-none text-xs cursor-pointer focus:border-[#0038A8]/50"
                >
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-[#0038A8] hover:bg-[#002D86] text-white text-xs font-black rounded-xl disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white border border-border p-6 rounded-3xl shadow-xl w-full max-w-md text-left flex flex-col gap-4 relative">
            <button 
              onClick={() => setIsEditOpen(false)}
              className="absolute top-4 right-4 p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="h-4.5 w-4.5" />
            </button>
            
            <h2 className="text-lg font-black text-gray-900 tracking-tight">Edit User Details</h2>
            
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider">Username</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-border/80 focus:border-[#0038A8]/50 rounded-xl outline-none text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-border/80 focus:border-[#0038A8]/50 rounded-xl outline-none text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider">Password (leave blank to keep current)</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-slate-50 border border-border/80 focus:border-[#0038A8]/50 rounded-xl outline-none text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider">Role Access</label>
                <select
                  value={roleId}
                  onChange={(e) => setRoleId(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-border/80 rounded-xl outline-none text-xs cursor-pointer focus:border-[#0038A8]/50"
                >
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-[#0038A8] hover:bg-[#002D86] text-white text-xs font-black rounded-xl disabled:opacity-50"
                >
                  {saving ? "Updating..." : "Update User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
