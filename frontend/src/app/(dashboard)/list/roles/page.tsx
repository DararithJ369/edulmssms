"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Globe, Search, Plus, Trash2, Edit, X, Save, 
  ShieldCheck, ShieldAlert, Key, Check, Users 
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "react-toastify";
import { useDialog } from "@/hooks/DialogProvider";
import PageHeader from "@/components/PageHeader";


type RoleItem = {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
};

type PermissionItem = {
  id: number;
  key: string;
  description: string;
  is_active: boolean;
};

export default function RolesListPage() {
  const { confirm } = useDialog();
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modals / Drawer State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPermissionsOpen, setIsPermissionsOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleItem | null>(null);
  
  // Form Values
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  
  // Permissions Drawer Values
  const [rolePermissionIds, setRolePermissionIds] = useState<number[]>([]);
  const [permissionsSearch, setPermissionsSearch] = useState("");
  const [savingPermissions, setSavingPermissions] = useState(false);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await api.get("/roles?limit=100");
      setRoles(res.data.data || []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load roles.");
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const res = await api.get("/permissions?limit=200");
      setPermissions(res.data.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  const handleCreateOpen = () => {
    setName("");
    setDescription("");
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.warn("Role name is required.");
      return;
    }
    setSaving(true);
    try {
      await api.post("/roles", {
        name: name.trim(),
        description: description.trim(),
      });
      toast.success("Role created successfully!");
      setIsCreateOpen(false);
      fetchRoles();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Error creating role.");
    } finally {
      setSaving(false);
    }
  };

  const handleEditOpen = (role: RoleItem) => {
    setSelectedRole(role);
    setName(role.name);
    setDescription(role.description || "");
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    if (!name.trim()) {
      toast.warn("Role name is required.");
      return;
    }
    setSaving(true);
    try {
      await api.put(`/roles/${selectedRole.id}`, {
        name: name.trim(),
        description: description.trim(),
        is_active: selectedRole.is_active,
      });
      toast.success("Role updated successfully!");
      setIsEditOpen(false);
      fetchRoles();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Error updating role.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    const isConfirmed = await confirm({
      title: "Delete Role",
      description: "Are you sure you want to delete this role? This might disrupt users assigned to this role.",
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive"
    });
    if (!isConfirmed) {
      return;
    }
    try {
      await api.delete(`/roles/${id}`);
      toast.success("Role deleted successfully!");
      fetchRoles();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to delete role.");
    }
  };

  const handlePermissionsOpen = async (role: RoleItem) => {
    setSelectedRole(role);
    setRolePermissionIds([]);
    setIsPermissionsOpen(true);
    try {
      const res = await api.get(`/roles/${role.id}/permissions`);
      setRolePermissionIds(res.data.permission_ids || []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load permissions for this role.");
    }
  };

  const handleTogglePermission = (permissionId: number) => {
    setRolePermissionIds((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleSelectAllPermissions = () => {
    const filteredPerms = permissions.filter(p => 
      p.key.toLowerCase().includes(permissionsSearch.toLowerCase()) ||
      p.description.toLowerCase().includes(permissionsSearch.toLowerCase())
    );
    const filteredIds = filteredPerms.map(p => p.id);
    setRolePermissionIds(prev => {
      const otherIds = prev.filter(id => !filteredIds.includes(id));
      return [...otherIds, ...filteredIds];
    });
  };

  const handleDeselectAllPermissions = () => {
    const filteredPerms = permissions.filter(p => 
      p.key.toLowerCase().includes(permissionsSearch.toLowerCase()) ||
      p.description.toLowerCase().includes(permissionsSearch.toLowerCase())
    );
    const filteredIds = filteredPerms.map(p => p.id);
    setRolePermissionIds(prev => prev.filter(id => !filteredIds.includes(id)));
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;
    setSavingPermissions(true);
    try {
      await api.put(`/roles/${selectedRole.id}/permissions`, {
        permission_ids: rolePermissionIds,
      });
      toast.success(`Permissions updated for ${selectedRole.name}!`);
      setIsPermissionsOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to update permissions.");
    } finally {
      setSavingPermissions(false);
    }
  };

  const filteredRoles = roles.filter(
    (role) =>
      role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      role.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPermissions = permissions.filter(
    (p) =>
      p.key.toLowerCase().includes(permissionsSearch.toLowerCase()) ||
      p.description.toLowerCase().includes(permissionsSearch.toLowerCase())
  );

  // Helper to categorize permissions by prefix (e.g. "view:", "manage:")
  const groupPermissions = (perms: PermissionItem[]) => {
    const groups: Record<string, PermissionItem[]> = {};
    perms.forEach((p) => {
      const parts = p.key.split(":");
      const category = parts.length > 1 ? parts[0] : "general";
      if (!groups[category]) groups[category] = [];
      groups[category].push(p);
    });
    return groups;
  };

  const permissionGroups = groupPermissions(filteredPermissions);

  return (
    <div className="flex-1 p-6 space-y-6 bg-[#F7F8FA] min-h-screen relative font-sans text-left transition-all duration-300">
      
      {/* PAGE HEADER */}
      <PageHeader
        eyebrow="System Administration"
        title="Security Roles"
        breadcrumbs={[{ label: "Roles" }]}
        actions={
          <button 
            onClick={handleCreateOpen}
            className="px-4 py-2 bg-[#0038A8] text-white hover:bg-[#002D86] font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5 active:scale-[0.98] cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Role</span>
          </button>
        }
      />


      {/* FILTER & SEARCH PANEL */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-3 select-none">
        <div className="flex items-center gap-2 text-xs font-extrabold text-muted-foreground">
          <span className="px-2.5 py-1 bg-white border border-border/80 text-foreground rounded-lg shadow-sm">
            {filteredRoles.length} Roles Defined
          </span>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-initial">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
            <input
              type="text"
              placeholder="Search roles or descriptions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-64 pl-9 pr-4 py-2 text-xs bg-white border border-border/80 focus:border-[#0038A8]/50 rounded-xl outline-none text-foreground"
            />
          </div>
        </div>
      </div>

      {/* ROLES GRID */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="h-10 w-10 border-4 border-[#0038A8] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs font-bold text-muted-foreground">Loading role definitions...</p>
        </div>
      ) : filteredRoles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRoles.map((role) => (
            <div
              key={role.id}
              className="bg-card border border-border/50 hover:border-[#0038A8]/25 rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.01)] hover:shadow-[0_12px_30px_rgba(0,0,0,0.03)] hover:-translate-y-[2px] transition-all duration-300 flex flex-col justify-between relative group overflow-hidden"
            >
              <span className="absolute left-0 top-0 bottom-0 w-[4px] bg-[#0038A8] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black text-gray-900 capitalize">
                      {role.name}
                    </span>
                  </div>
                  
                  <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-lg border ${
                    role.is_active 
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200/50" 
                      : "bg-red-50 text-red-700 border-red-200/50"
                  }`}>
                    {role.is_active ? "Active" : "Inactive"}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground font-medium leading-relaxed mb-6 text-left min-h-[40px]">
                  {role.description || "No descriptive summary provided for this security role."}
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-auto">
                <button
                  onClick={() => handlePermissionsOpen(role)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-700 hover:bg-blue-50 hover:border-blue-200 hover:text-[#0038A8] text-xs font-bold rounded-xl transition-all"
                  title="Configure permissions mapping"
                >
                  <Key className="h-3.5 w-3.5" />
                  <span>Permissions</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleEditOpen(role)}
                    className="p-2 bg-slate-50 border border-slate-200 text-slate-600 hover:text-[#0038A8] hover:bg-indigo-50/50 rounded-xl transition-colors shadow-xs"
                    title="Edit Role Details"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(role.id)}
                    className="p-2 bg-slate-50 border border-slate-200 text-slate-600 hover:text-red-600 hover:bg-red-50/50 rounded-xl transition-colors shadow-xs"
                    title="Delete Role"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-card border border-border/60 rounded-3xl p-16 text-center text-muted-foreground">
          <ShieldAlert className="h-10 w-10 mx-auto mb-2 opacity-25" />
          <p className="text-sm font-bold">No security roles found matching constraints.</p>
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
            
            <h2 className="text-lg font-black text-gray-900 tracking-tight">Create Security Role</h2>
            
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider">Role Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Registrar, Academic Advisor"
                  className="w-full px-3 py-2 bg-slate-50 border border-border/80 focus:border-[#0038A8]/50 rounded-xl outline-none text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summarize the functional access and context of this role..."
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-50 border border-border/80 focus:border-[#0038A8]/50 rounded-xl outline-none text-xs resize-none"
                />
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
                  {saving ? "Creating..." : "Create Role"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditOpen && selectedRole && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white border border-border p-6 rounded-3xl shadow-xl w-full max-w-md text-left flex flex-col gap-4 relative">
            <button 
              onClick={() => setIsEditOpen(false)}
              className="absolute top-4 right-4 p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="h-4.5 w-4.5" />
            </button>
            
            <h2 className="text-lg font-black text-gray-900 tracking-tight">Edit Role Details</h2>
            
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider">Role Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-border/80 focus:border-[#0038A8]/50 rounded-xl outline-none text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-50 border border-border/80 focus:border-[#0038A8]/50 rounded-xl outline-none text-xs resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={selectedRole.is_active}
                    onChange={(e) => setSelectedRole({ ...selectedRole, is_active: e.target.checked })}
                    className="h-4 w-4 rounded-md border-border/80 text-[#0038A8] focus:ring-[#0038A8]/50"
                  />
                  <span className="text-xs font-bold text-slate-700">Active Role Status</span>
                </label>

                <div className="flex gap-2">
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
                    {saving ? "Updating..." : "Update Role"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PERMISSIONS MAPPING DRAWER */}
      {isPermissionsOpen && selectedRole && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex justify-end z-50 animate-in fade-in slide-in-from-right duration-300">
          <div className="bg-white border-l border-border w-full max-w-xl h-full flex flex-col shadow-2xl relative">
            
            {/* Drawer Header */}
            <div className="p-6 border-b border-border/60 flex items-center justify-between shrink-0">
              <div className="text-left">
                <span className="text-[10px] font-extrabold uppercase text-[#0038A8] tracking-wider font-mono">
                  Access Controls
                </span>
                <h2 className="text-lg font-black text-gray-900 tracking-tight capitalize mt-0.5">
                  Manage {selectedRole.name} Permissions
                </h2>
              </div>
              <button 
                onClick={() => setIsPermissionsOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Filter Tools & Stats */}
            <div className="px-6 py-4 bg-slate-50 border-b border-border/50 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
                <input
                  type="text"
                  placeholder="Search system permissions..."
                  value={permissionsSearch}
                  onChange={(e) => setPermissionsSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-border/80 focus:border-[#0038A8]/50 rounded-xl outline-none text-foreground font-medium"
                />
              </div>

              <div className="flex gap-2 shrink-0">
                <button
                  onClick={handleSelectAllPermissions}
                  className="px-2.5 py-1.5 bg-blue-50 border border-blue-200/50 text-[#0038A8] text-[10px] font-black rounded-lg hover:bg-blue-100/50 transition-colors"
                >
                  Select All
                </button>
                <button
                  onClick={handleDeselectAllPermissions}
                  className="px-2.5 py-1.5 bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-black rounded-lg hover:bg-slate-200/50 transition-colors"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Scrollable Checkbox List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-left">
              {Object.keys(permissionGroups).length > 0 ? (
                Object.entries(permissionGroups).map(([groupName, groupItems]) => (
                  <div key={groupName} className="space-y-2">
                    <h3 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest border-b border-slate-100 pb-1 capitalize">
                      {groupName} Management
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {groupItems.map((perm) => {
                        const isChecked = rolePermissionIds.includes(perm.id);
                        return (
                          <div
                            key={perm.id}
                            onClick={() => handleTogglePermission(perm.id)}
                            className={`flex items-start gap-3 p-3 rounded-2xl border transition-all cursor-pointer select-none ${
                              isChecked
                                ? "bg-blue-50/40 border-blue-200"
                                : "bg-white hover:bg-slate-50/50 border-border/50"
                            }`}
                          >
                            <div className={`mt-0.5 h-4.5 w-4.5 rounded-lg border flex items-center justify-center transition-all shrink-0 ${
                              isChecked
                                ? "bg-[#0038A8] border-[#0038A8] text-white"
                                : "border-slate-300 bg-white"
                            }`}>
                              {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                            </div>

                            <div className="flex flex-col text-left overflow-hidden">
                              <span className="text-xs font-bold text-slate-800 truncate">
                                {perm.key}
                              </span>
                              <span className="text-[10px] text-muted-foreground leading-normal mt-0.5">
                                {perm.description || "Allows execution of this platform action."}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p className="text-xs font-bold">No matching permissions found in catalog.</p>
                </div>
              )}
            </div>

            {/* Sticky Actions */}
            <div className="p-6 border-t border-border/60 bg-white flex items-center justify-between shrink-0">
              <span className="text-[10px] font-extrabold text-muted-foreground uppercase">
                {rolePermissionIds.length} permissions active
              </span>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsPermissionsOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={savingPermissions}
                  onClick={handleSavePermissions}
                  className="px-4 py-2 bg-[#0038A8] hover:bg-[#002D86] text-white text-xs font-black rounded-xl flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>Save Permissions</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
