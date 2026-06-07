"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Globe, Search, ListFilter, Plus, Trash2, Edit, X, Save, 
  Shield, Mail, User as UserIcon, UserCheck, UserX 
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "react-toastify";
import { useDialog } from "@/hooks/DialogProvider";

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
  const [roleFilter, setRoleFilter] = useState("");
  
  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  
  // Form values
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState<number>(3); // Default to Student (3)
  
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get(
        `/users?page=${currentPage}&limit=10&search=${searchQuery}&role=${roleFilter}`
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
      setRoles(res.data.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [currentPage, roleFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers();
  };

  const handleCreateOpen = () => {
    setUsername("");
    setEmail("");
    setPassword("");
    setRoleId(roles.find(r => r.name.toLowerCase() === "student")?.id || 3);
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !email.trim() || !password.trim()) {
      toast.warn("Please fill in all required fields.");
      return;
    }
    
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

  const getInitials = (name: string) => {
    return name.slice(0, 2).toUpperCase();
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
      
      {/* BREADCRUMB */}
      <div className="flex items-center gap-1 text-[11px] font-extrabold text-muted-foreground uppercase tracking-wider mb-2 select-none">
        <Link href="/" className="hover:text-foreground flex items-center gap-1">
          <Globe className="h-3 w-3" />
          Home
        </Link>
        <span>/</span>
        <span className="text-foreground">Users</span>
      </div>

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 select-none mb-6">
        <div>
          <span className="text-xs font-extrabold text-[#0038A8] uppercase tracking-wider font-mono">
            System Administration
          </span>
          <h1 className="text-xl md:text-3xl font-black text-gray-900 tracking-tight leading-tight mt-0.5">
            Users Directory
          </h1>
        </div>

        <button 
          onClick={handleCreateOpen}
          className="px-4 py-2.5 bg-[#8b5cf6] text-white hover:bg-[#7c3aed] font-extrabold text-xs rounded-xl transition-all shadow-md shadow-violet-500/10 flex items-center gap-1.5 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          <span>Add User</span>
        </button>
      </div>

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

      {/* USERS CARD FEED */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="h-10 w-10 border-4 border-[#0038A8] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs font-bold text-muted-foreground">Loading users directory...</p>
        </div>
      ) : users.length > 0 ? (
        <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.01)] space-y-3">
          {users.map((user) => (
            <div
              key={user.id}
              className="relative flex flex-col md:flex-row md:items-center justify-between p-5 bg-card/65 hover:bg-card border border-border/50 hover:border-violet-500/25 rounded-3xl transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.02)] hover:-translate-y-[1px] group overflow-hidden gap-4"
            >
              <span className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-3xl bg-violet-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="flex items-center gap-4 max-w-full md:max-w-[70%]">
                {/* Avatar */}
                <div className="h-10 w-10 rounded-2xl bg-[#E8EDF5] text-[#4A6FA5] flex items-center justify-center font-black text-xs shrink-0 select-none shadow-xs">
                  {getInitials(user.username)}
                </div>

                <div className="flex flex-col text-left gap-1 overflow-hidden">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-extrabold text-foreground truncate">
                      {user.username}
                    </span>
                    <span className={`px-2 py-0.5 border text-[9px] font-black uppercase tracking-wider rounded-lg ${getRoleBadgeColor(user.role?.name || "user")}`}>
                      {user.role?.name || "user"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground truncate font-medium">
                    <Mail className="h-3 w-3" />
                    <span className="truncate">{user.email}</span>
                    <span className="text-muted-foreground/35">•</span>
                    <span className="text-[10px] uppercase font-mono tracking-tight">{user.id.slice(0, 8)}...</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end md:self-auto shrink-0 z-10">
                <button
                  onClick={() => handleEditOpen(user)}
                  className="p-2 bg-slate-50 border border-slate-200 text-slate-600 hover:text-[#0038A8] hover:bg-indigo-50/50 rounded-xl transition-colors shadow-xs"
                  title="Edit User"
                >
                  <Edit className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(user.id)}
                  className="p-2 bg-slate-50 border border-slate-200 text-slate-600 hover:text-red-600 hover:bg-red-50/50 rounded-xl transition-colors shadow-xs"
                  title="Delete User"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-card border border-border/60 rounded-3xl p-16 text-center text-muted-foreground">
          <UserIcon className="h-10 w-10 mx-auto mb-2 opacity-25" />
          <p className="text-sm font-bold">No users found matching query constraints.</p>
        </div>
      )}

      {/* PAGINATION PANEL */}
      {totalPages > 1 && (
        <div className="bg-card border border-border/60 rounded-3xl p-4 shadow-sm flex justify-center items-center select-none gap-2 shrink-0">
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            className="px-3 py-1.5 text-xs font-bold border border-border rounded-xl disabled:opacity-40 hover:bg-slate-50 bg-white"
          >
            Prev
          </button>
          <span className="text-xs font-extrabold px-3 text-muted-foreground uppercase">
            Page {currentPage} of {totalPages}
          </span>
          <button 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            className="px-3 py-1.5 text-xs font-bold border border-border rounded-xl disabled:opacity-40 hover:bg-slate-50 bg-white"
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
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-[#0038A8] hover:bg-[#002D86] text-white text-xs font-black rounded-xl"
                >
                  Save User
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
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-[#0038A8] hover:bg-[#002D86] text-white text-xs font-black rounded-xl"
                >
                  Update User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
