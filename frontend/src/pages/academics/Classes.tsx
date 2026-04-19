import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { useClasses } from "@/hooks/useClasses";

import { Button } from "@/components/ui/button";
import type { Class } from "@/types";
import Search from "@/components/global/Search";
import CustomAlert from "@/components/global/CustomAlert";
import ClassTable from "@/components/classes/ClassTable";
import ClassForm from "@/components/classes/ClassForm";

const Classes = () => {
  // Use optimized hook with automatic pagination and search handling
  const { classes, meta, loading, error, deleteClass, setPage } = useClasses();

  const [search, setSearch] = useState("");
  // Dialog States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);

  // Delete Alert States
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleCreate = () => {
    setEditingClass(null);
    setIsFormOpen(true);
  };

  const handleEdit = (cls: Class) => {
    setEditingClass(cls);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      const success = await deleteClass(parseInt(deleteId));
      if (success) {
        toast.success("Class deleted successfully");
      }
    } finally {
      setIsDeleteOpen(false);
      setDeleteId(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Classes</h1>
          <p className="text-muted-foreground">
            Manage grades, sections, and teacher assignments.
          </p>
        </div>
        <div className="flex gap-2">
          <Search search={search} setSearch={setSearch} title="Classes" />
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" /> Create Class
          </Button>
        </div>
      </div>
      {/* table */}
      <ClassTable
        data={classes}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        page={meta.page}
        setPage={setPage}
        totalPages={Math.ceil(meta.total / meta.limit)}
      />
      {/* form */}
      <ClassForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        initialData={editingClass}
        onSuccess={() => {
          setEditingClass(null);
          // Data will auto-refetch due to hook
        }}
      />
      {/* alert */}
      <CustomAlert
        handleDelete={confirmDelete}
        isOpen={isDeleteOpen}
        setIsOpen={setIsDeleteOpen}
        title="Delete Class"
        description="Are you sure you want to delete this class? This action cannot be undone."
      />
    </div>
  );
};

export default Classes;
