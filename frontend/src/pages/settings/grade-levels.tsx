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

interface GradeLevel {
  id: number;
  name: string;
  code?: string | null;
  description?: string | null;
  order?: number | null;
  is_active?: boolean;
}

interface Pagination {
  page: number;
  total: number;
  limit: number;
}

type ApiError = { response?: { data?: { message?: string } } };

export default function GradeLevels() {
  const [items, setItems] = useState<GradeLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<Pagination>({ page: 1, total: 0, limit: 10 });

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [order, setOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);

  const [editing, setEditing] = useState<GradeLevel | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const fetchLevels = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`${API.GRADE_LEVELS.GET_ALL}?page=${page}&limit=10`);
      setItems(data.data || []);
      setMeta(data.meta || { page, total: 0, limit: 10 });
    } catch (error) {
      const message = (error as ApiError).response?.data?.message || "Failed to load grade levels";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLevels();
  }, [page]);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("name", name);
      if (code) formData.append("code", code);
      if (description) formData.append("description", description);
      formData.append("order", String(order));
      formData.append("is_active", String(isActive));

      await api.post(API.GRADE_LEVELS.CREATE, formData);
      toast.success("Grade level created");
      setName("");
      setCode("");
      setDescription("");
      setOrder(0);
      setIsActive(true);
      fetchLevels();
    } catch (error) {
      const message = (error as ApiError).response?.data?.message || "Failed to create grade level";
      toast.error(message);
    }
  };

  const handleUpdate = async () => {
    if (!editing) return;
    try {
      const formData = new FormData();
      if (editing.name) formData.append("name", editing.name);
      if (editing.code) formData.append("code", editing.code);
      if (editing.description) formData.append("description", editing.description);
      if (editing.order !== undefined && editing.order !== null) {
        formData.append("order", String(editing.order));
      }
      if (editing.is_active !== undefined) {
        formData.append("is_active", String(editing.is_active));
      }

      await api.put(API.GRADE_LEVELS.UPDATE(editing.id), formData);
      toast.success("Grade level updated");
      setIsEditOpen(false);
      setEditing(null);
      fetchLevels();
    } catch (error) {
      const message = (error as ApiError).response?.data?.message || "Failed to update grade level";
      toast.error(message);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(API.GRADE_LEVELS.DELETE(id));
      toast.success("Grade level deleted");
      fetchLevels();
    } catch (error) {
      const message = (error as ApiError).response?.data?.message || "Failed to delete grade level";
      toast.error(message);
    }
  };

  const totalPages = Math.ceil(meta.total / meta.limit);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <div className="border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-6xl mx-auto px-8 py-12">
          <h1 className="notion-header">Grade Levels</h1>
          <p className="notion-subheader">Manage grade levels and ordering</p>
          <div className="notion-divider"></div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8 space-y-6">
        <div className="notion-card p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="Code" value={code} onChange={(e) => setCode(e.target.value)} />
            <Input
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Input
              type="number"
              placeholder="Order"
              value={order}
              onChange={(e) => setOrder(Number(e.target.value))}
            />
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
              Add Grade Level
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">Loading grade levels...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No grade levels found</p>
          </div>
        ) : (
          <div className="notion-card overflow-hidden">
            <div className="notion-table">
              <table className="w-full">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Code</th>
                    <th>Order</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((level) => (
                    <tr key={level.id}>
                      <td>{level.name}</td>
                      <td>{level.code || "—"}</td>
                      <td>{level.order ?? "—"}</td>
                      <td>{level.is_active ? "Active" : "Inactive"}</td>
                      <td className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditing({ ...level });
                              setIsEditOpen(true);
                            }}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDelete(level.id)}
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
            <DialogTitle className="dark:text-white">Edit Grade Level</DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              Update grade level details
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <Input
                placeholder="Name"
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              />
              <Input
                placeholder="Code"
                value={editing.code || ""}
                onChange={(e) => setEditing({ ...editing, code: e.target.value })}
              />
              <Input
                placeholder="Description"
                value={editing.description || ""}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              />
              <Input
                type="number"
                placeholder="Order"
                value={editing.order ?? 0}
                onChange={(e) => setEditing({ ...editing, order: Number(e.target.value) })}
              />
              <label className="text-sm text-gray-600 dark:text-gray-300">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={editing.is_active ?? true}
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
    </div>
  );
}
