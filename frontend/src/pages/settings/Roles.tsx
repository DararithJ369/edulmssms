import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { API } from "@/lib/endpoints";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface RoleRecord {
  id: number;
  name: string;
  description?: string | null;
  is_active: boolean;
}

interface PermissionRecord {
  id: number;
  key: string;
  description?: string | null;
  is_active: boolean;
}

interface Pagination {
  page: number;
  total: number;
  limit: number;
}

type ApiError = { response?: { data?: { message?: string } } };

export default function Roles() {
  const [items, setItems] = useState<RoleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<Pagination>({ page: 1, total: 0, limit: 10 });

  const [permissions, setPermissions] = useState<PermissionRecord[]>([]);
  const [permissionsLoading, setPermissionsLoading] = useState(true);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [rolePermissionIds, setRolePermissionIds] = useState<number[]>([]);
  const [permissionsSaving, setPermissionsSaving] = useState(false);
  const [permissionKey, setPermissionKey] = useState("");
  const [permissionDescription, setPermissionDescription] = useState("");
  const [editingPermission, setEditingPermission] = useState<PermissionRecord | null>(null);
  const [isPermissionEditOpen, setIsPermissionEditOpen] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [editing, setEditing] = useState<RoleRecord | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`${API.ROLES.GET_ALL}?page=${page}&limit=10`);
      setItems(data.data || []);
      setMeta(data.meta || { page, total: 0, limit: 10 });
    } catch (error) {
      const message = (error as ApiError).response?.data?.message || "Failed to load roles";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, [page]);

  useEffect(() => {
    if (items.length === 0) {
      setSelectedRoleId(null);
      return;
    }
    if (!selectedRoleId || !items.some((role) => role.id === selectedRoleId)) {
      setSelectedRoleId(items[0].id);
    }
  }, [items, selectedRoleId]);

  const fetchPermissions = async () => {
    try {
      setPermissionsLoading(true);
      const { data } = await api.get(`${API.PERMISSIONS.GET_ALL}?page=1&limit=200`);
      setPermissions(data.data || []);
    } catch (error) {
      const message =
        (error as ApiError).response?.data?.message || "Failed to load permissions";
      toast.error(message);
    } finally {
      setPermissionsLoading(false);
    }
  };

  const fetchRolePermissions = async (roleId: number) => {
    try {
      const { data } = await api.get(API.ROLES.GET_PERMISSIONS(roleId));
      setRolePermissionIds(data.permission_ids || []);
    } catch (error) {
      const message =
        (error as ApiError).response?.data?.message || "Failed to load role permissions";
      toast.error(message);
      setRolePermissionIds([]);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  useEffect(() => {
    if (selectedRoleId) {
      fetchRolePermissions(selectedRoleId);
    }
  }, [selectedRoleId]);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    try {
      await api.post(API.ROLES.CREATE, {
        name,
        description: description || undefined,
        is_active: isActive,
      });
      toast.success("Role created");
      setName("");
      setDescription("");
      setIsActive(true);
      fetchRoles();
    } catch (error) {
      const message = (error as ApiError).response?.data?.message || "Failed to create role";
      toast.error(message);
    }
  };

  const handleUpdate = async () => {
    if (!editing) return;
    try {
      await api.put(API.ROLES.UPDATE(editing.id), {
        name: editing.name,
        description: editing.description || undefined,
        is_active: editing.is_active,
      });
      toast.success("Role updated");
      setIsEditOpen(false);
      setEditing(null);
      fetchRoles();
    } catch (error) {
      const message = (error as ApiError).response?.data?.message || "Failed to update role";
      toast.error(message);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(API.ROLES.DELETE(id));
      toast.success("Role deleted");
      fetchRoles();
    } catch (error) {
      const message = (error as ApiError).response?.data?.message || "Failed to delete role";
      toast.error(message);
    }
  };

  const handleTogglePermission = (permissionId: number) => {
    setRolePermissionIds((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleSavePermissions = async () => {
    if (!selectedRoleId) return;
    try {
      setPermissionsSaving(true);
      await api.put(API.ROLES.SET_PERMISSIONS(selectedRoleId), {
        permission_ids: rolePermissionIds,
      });
      toast.success("Permissions updated");
    } catch (error) {
      const message =
        (error as ApiError).response?.data?.message || "Failed to update permissions";
      toast.error(message);
    } finally {
      setPermissionsSaving(false);
    }
  };

  const handleCreatePermission = async () => {
    if (!permissionKey.trim()) {
      toast.error("Permission key is required");
      return;
    }
    try {
      await api.post(API.PERMISSIONS.CREATE, {
        key: permissionKey.trim(),
        description: permissionDescription || undefined,
        is_active: true,
      });
      toast.success("Permission created");
      setPermissionKey("");
      setPermissionDescription("");
      fetchPermissions();
    } catch (error) {
      const message =
        (error as ApiError).response?.data?.message || "Failed to create permission";
      toast.error(message);
    }
  };

  const handleUpdatePermission = async () => {
    if (!editingPermission) return;
    try {
      await api.put(API.PERMISSIONS.UPDATE(editingPermission.id), {
        key: editingPermission.key,
        description: editingPermission.description || undefined,
        is_active: editingPermission.is_active,
      });
      toast.success("Permission updated");
      setIsPermissionEditOpen(false);
      setEditingPermission(null);
      fetchPermissions();
    } catch (error) {
      const message =
        (error as ApiError).response?.data?.message || "Failed to update permission";
      toast.error(message);
    }
  };

  const handleDeletePermission = async (permissionId: number) => {
    try {
      await api.delete(API.PERMISSIONS.DELETE(permissionId));
      toast.success("Permission deleted");
      fetchPermissions();
      setRolePermissionIds((prev) => prev.filter((id) => id !== permissionId));
    } catch (error) {
      const message =
        (error as ApiError).response?.data?.message || "Failed to delete permission";
      toast.error(message);
    }
  };

  const totalPages = Math.ceil(meta.total / meta.limit);

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-6xl mx-auto px-8 py-12">
          <h1 className="notion-header">Roles & Permissions</h1>
          <p className="notion-subheader">Manage user roles</p>
          <div className="notion-divider"></div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8 space-y-6">
        <div className="notion-card p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input placeholder="Role name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-600 dark:text-gray-300">
              <input
                type="checkbox"
                className="mr-2"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              Active
            </label>
            <Button onClick={handleCreate} className="bg-[#72e3ad] hover:bg-[#5bd39a] text-[#0b3d2c]">
              <Plus className="w-4 h-4 mr-2" />
              Add Role
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">Loading roles...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No roles found</p>
          </div>
        ) : (
          <div className="notion-card overflow-hidden">
            <div className="notion-table">
              <table className="w-full">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((row) => (
                    <tr key={row.id}>
                      <td>{row.name}</td>
                      <td>{row.description || "—"}</td>
                      <td>{row.is_active ? "Active" : "Inactive"}</td>
                      <td className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditing({ ...row });
                              setIsEditOpen(true);
                            }}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDelete(row.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="notion-card p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Permissions Matrix
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Assign permissions to a role
            </p>
          </div>

          {items.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Create a role to manage permissions.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="md:col-span-2">
                <label className="text-sm text-gray-600 dark:text-gray-300">
                  Role
                </label>
                <select
                  className="mt-1 w-full border border-gray-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                  value={selectedRoleId ?? ""}
                  onChange={(e) => setSelectedRoleId(Number(e.target.value))}
                >
                  {items.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                onClick={handleSavePermissions}
                className="bg-[#72e3ad] hover:bg-[#5bd39a] text-[#0b3d2c]"
                disabled={!selectedRoleId || permissionsSaving}
              >
                {permissionsSaving ? "Saving..." : "Save Permissions"}
              </Button>
            </div>
          )}

          {permissionsLoading ? (
            <div className="text-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500 dark:text-gray-400">Loading permissions...</p>
            </div>
          ) : permissions.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No permissions found. Add permissions in the backend first.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {permissions.map((permission) => {
                const checked = rolePermissionIds.includes(permission.id);
                return (
                  <label
                    key={permission.id}
                    className={`flex items-start gap-3 border border-gray-200 dark:border-slate-700 rounded-md px-3 py-2 text-sm ${
                      permission.is_active ? "" : "opacity-60"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={checked}
                      onChange={() => handleTogglePermission(permission.id)}
                    />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {permission.key}
                      </div>
                      <div className="text-gray-500 dark:text-gray-400">
                        {permission.description || "No description"}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div className="notion-card p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Permission Catalog
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Create and manage permission keys
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <Input
              placeholder="permission.key"
              value={permissionKey}
              onChange={(e) => setPermissionKey(e.target.value)}
            />
            <Input
              placeholder="Description"
              value={permissionDescription}
              onChange={(e) => setPermissionDescription(e.target.value)}
            />
            <Button onClick={handleCreatePermission} className="bg-[#72e3ad] hover:bg-[#5bd39a] text-[#0b3d2c]">
              <Plus className="w-4 h-4 mr-2" />
              Add Permission
            </Button>
          </div>

          {permissionsLoading ? (
            <div className="text-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500 dark:text-gray-400">Loading permissions...</p>
            </div>
          ) : permissions.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No permissions found yet.
            </p>
          ) : (
            <div className="notion-table">
              <table className="w-full">
                <thead>
                  <tr>
                    <th>Key</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {permissions.map((permission) => (
                    <tr key={permission.id}>
                      <td>{permission.key}</td>
                      <td>{permission.description || "—"}</td>
                      <td>{permission.is_active ? "Active" : "Inactive"}</td>
                      <td className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingPermission({ ...permission });
                              setIsPermissionEditOpen(true);
                            }}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDeletePermission(permission.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 pt-8">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="notion-button"
            >
              ← Previous
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, page - 2);
              return start + i;
            }).map((p) =>
              p <= totalPages ? (
                <Button
                  key={p}
                  onClick={() => setPage(p)}
                  className={
                    page === p
                      ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold"
                      : "notion-button"
                  }
                >
                  {p}
                </Button>
              ) : null
            )}
            <Button
              variant="outline"
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="notion-button"
            >
              Next →
            </Button>
          </div>
        )}
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="dark:bg-slate-800 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Edit Role</DialogTitle>
            <DialogDescription className="dark:text-gray-400">Update role details</DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <Input
                placeholder="Role name"
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              />
              <Input
                placeholder="Description"
                value={editing.description || ""}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              />
              <label className="text-sm text-gray-600 dark:text-gray-300">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={editing.is_active}
                  onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })}
                />
                Active
              </label>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdate} className="bg-[#72e3ad] hover:bg-[#5bd39a] text-[#0b3d2c]">
                  Save
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isPermissionEditOpen} onOpenChange={setIsPermissionEditOpen}>
        <DialogContent className="dark:bg-slate-800 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Edit Permission</DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              Update permission details
            </DialogDescription>
          </DialogHeader>
          {editingPermission && (
            <div className="space-y-4">
              <Input
                placeholder="permission.key"
                value={editingPermission.key}
                onChange={(e) =>
                  setEditingPermission({ ...editingPermission, key: e.target.value })
                }
              />
              <Input
                placeholder="Description"
                value={editingPermission.description || ""}
                onChange={(e) =>
                  setEditingPermission({
                    ...editingPermission,
                    description: e.target.value,
                  })
                }
              />
              <label className="text-sm text-gray-600 dark:text-gray-300">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={editingPermission.is_active}
                  onChange={(e) =>
                    setEditingPermission({
                      ...editingPermission,
                      is_active: e.target.checked,
                    })
                  }
                />
                Active
              </label>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsPermissionEditOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdatePermission} className="bg-[#72e3ad] hover:bg-[#5bd39a] text-[#0b3d2c]">
                  Save
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
