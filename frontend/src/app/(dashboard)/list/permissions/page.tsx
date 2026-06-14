"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Globe, Search, Plus, Trash2, Edit, X, 
  Key, ShieldCheck, ShieldAlert 
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "react-toastify";
import { useDialog } from "@/hooks/DialogProvider";

type PermissionItem = {
  id: number;
  key: string;
  description: string;
  is_active: boolean;
};

export default function PermissionsListPage() {
  const { confirm } = useDialog();
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState<PermissionItem | null>(null);
  
  // Form values
  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchPermissions = async () => {
    setLoading(true);
    try {
      const res = await api.get("/permissions?limit=250");
      setPermissions(res.data.data || []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load permissions catalog.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const handleCreateOpen = () => {
    setKey("");
    setDescription("");
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) {
      toast.warn("Permission key is required.");
      return;
    }
    // Simple validation for prefix syntax (e.g. view:something, manage:something)
    if (!key.includes(":")) {
      toast.warn("Key should use namespace format, e.g. 'view:dashboard' or 'manage:courses'.");
    }

    setSaving(true);
    try {
      await api.post("/permissions", {
        key: key.trim().toLowerCase(),
        description: description.trim(),
        is_active: true
      });
      toast.success("Permission key added to catalog!");
      setIsCreateOpen(false);
      fetchPermissions();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Error creating permission.");
    } finally {
      setSaving(false);
    }
  };

  const handleEditOpen = (perm: PermissionItem) => {
    setSelectedPermission(perm);
    setKey(perm.key);
    setDescription(perm.description || "");
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPermission) return;
    if (!key.trim()) {
      toast.warn("Permission key is required.");
      return;
    }

    setSaving(true);
    try {
      await api.put(`/permissions/${selectedPermission.id}`, {
        key: key.trim().toLowerCase(),
        description: description.trim(),
        is_active: selectedPermission.is_active,
      });
      toast.success("Permission key updated successfully!");
      setIsEditOpen(false);
      fetchPermissions();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Error updating permission details.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    const isConfirmed = await confirm({
      title: "Delete Permission",
      description: "Are you sure you want to delete this permission? This could break authorization rules referencing this key.",
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive"
    });
    if (!isConfirmed) {
      return;
    }
    try {
      await api.delete(`/permissions/${id}`);
      toast.success("Permission removed from catalog.");
      fetchPermissions();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to delete permission.");
    }
  };

  const filteredPermissions = permissions.filter(
    (p) =>
      p.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getGroupBadgeColor = (permKey: string) => {
    const prefix = permKey.split(":")[0];
    switch (prefix) {
      case "view": return "bg-sky-50 text-sky-700 border-sky-200/50";
      case "manage": return "bg-violet-50 text-violet-700 border-violet-200/50";
      case "create": return "bg-emerald-50 text-emerald-700 border-emerald-200/50";
      case "delete": return "bg-rose-50 text-rose-700 border-rose-200/50";
      default: return "bg-slate-50 text-slate-700 border-slate-200/50";
    }
  };

  return (
    <div className="flex-1 p-6 space-y-6 bg-[#F7F8FA] min-h-screen relative font-sans text-left transition-all duration-300">
      
      {/* BREADCRUMB */}
      <div className="flex items-center gap-1 text-[11px] font-extrabold text-muted-foreground uppercase tracking-wider mb-2 select-none">
        <Link href="/" className="hover:text-foreground flex items-center gap-1">
          <Globe className="h-3 w-3" />
          Home
        </Link>
        <span>/</span>
        <span className="text-foreground">Permissions</span>
      </div>

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 select-none mb-6">
        <div>
          <span className="text-xs font-extrabold text-[#0038A8] uppercase tracking-wider font-mono">
            System Administration
          </span>
          <h1 className="text-xl md:text-3xl font-black text-gray-900 tracking-tight leading-tight mt-0.5">
            Permissions Catalog
          </h1>
        </div>

        <button 
          onClick={handleCreateOpen}
          className="px-4 py-2 bg-[#0038A8] text-white hover:bg-[#002D86] font-black text-xs rounded-xl transition-all shadow-md shadow-blue-500/10 flex items-center gap-1.5 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          <span>Add Permission</span>
        </button>
      </div>

      {/* FILTER & SEARCH PANEL */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-3 select-none">
        <div className="flex items-center gap-2 text-xs font-extrabold text-muted-foreground">
          <span className="px-2.5 py-1 bg-white border border-border/80 text-foreground rounded-lg shadow-sm">
            {filteredPermissions.length} Registered Keys
          </span>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-initial">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
            <input
              type="text"
              placeholder="Search keys or descriptions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-64 pl-9 pr-4 py-2 text-xs bg-white border border-border/80 focus:border-[#0038A8]/50 rounded-xl outline-none text-foreground"
            />
          </div>
        </div>
      </div>

      {/* PERMISSIONS LIST */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="h-10 w-10 border-4 border-[#0038A8] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs font-bold text-muted-foreground">Loading permissions catalog...</p>
        </div>
      ) : filteredPermissions.length > 0 ? (
        <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.01)] space-y-3">
          {filteredPermissions.map((perm) => (
            <div
              key={perm.id}
              className="relative flex flex-col md:flex-row md:items-center justify-between p-4 bg-card/65 hover:bg-card border border-border/50 hover:border-[#0038A8]/25 rounded-3xl transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.02)] hover:-translate-y-[1px] group overflow-hidden gap-4"
            >
              <span className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-3xl bg-[#0038A8] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="flex items-center gap-4 max-w-full md:max-w-[80%]">
                <div className="flex flex-col text-left gap-1 overflow-hidden">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 border text-[10px] font-mono font-black rounded-lg ${getGroupBadgeColor(perm.key)}`}>
                      {perm.key}
                    </span>
                    <span className={`px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider rounded-md ${
                      perm.is_active 
                        ? "text-emerald-600 bg-emerald-50" 
                        : "text-red-600 bg-red-50"
                    }`}>
                      {perm.is_active ? "Active" : "Disabled"}
                    </span>
                  </div>

                  <span className="text-xs text-muted-foreground font-medium leading-relaxed truncate">
                    {perm.description || "No documentation supplied for this access key."}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 self-end md:self-auto shrink-0 z-10">
                <button
                  onClick={() => handleEditOpen(perm)}
                  className="p-2 bg-slate-50 border border-slate-200 text-slate-600 hover:text-[#0038A8] hover:bg-indigo-50/50 rounded-xl transition-colors shadow-xs"
                  title="Edit Permission"
                >
                  <Edit className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(perm.id)}
                  className="p-2 bg-slate-50 border border-slate-200 text-slate-600 hover:text-red-600 hover:bg-red-50/50 rounded-xl transition-colors shadow-xs"
                  title="Delete Permission"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-card border border-border/60 rounded-3xl p-16 text-center text-muted-foreground">
          <ShieldAlert className="h-10 w-10 mx-auto mb-2 opacity-25" />
          <p className="text-sm font-bold">No registered permission keys found matching criteria.</p>
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
            
            <h2 className="text-lg font-black text-gray-900 tracking-tight">Add Permission Key</h2>
            
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider">Permission Key</label>
                <input
                  type="text"
                  required
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="e.g. view:financial-records or manage:course-builder"
                  className="w-full px-3 py-2 bg-slate-50 border border-border/80 focus:border-[#0038A8]/50 rounded-xl outline-none text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider">Functional Scope Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what resources and operations this key authorizes..."
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
                  {saving ? "Saving..." : "Save Key"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditOpen && selectedPermission && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white border border-border p-6 rounded-3xl shadow-xl w-full max-w-md text-left flex flex-col gap-4 relative">
            <button 
              onClick={() => setIsEditOpen(false)}
              className="absolute top-4 right-4 p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="h-4.5 w-4.5" />
            </button>
            
            <h2 className="text-lg font-black text-gray-900 tracking-tight">Edit Permission Details</h2>
            
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider">Permission Key</label>
                <input
                  type="text"
                  required
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-border/80 focus:border-[#0038A8]/50 rounded-xl outline-none text-xs font-mono"
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
                    checked={selectedPermission.is_active}
                    onChange={(e) => setSelectedPermission({ ...selectedPermission, is_active: e.target.checked })}
                    className="h-4 w-4 rounded-md border-border/80 text-[#0038A8] focus:ring-[#0038A8]/50"
                  />
                  <span className="text-xs font-bold text-slate-700">Permission Active</span>
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
                    {saving ? "Updating..." : "Update Key"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
