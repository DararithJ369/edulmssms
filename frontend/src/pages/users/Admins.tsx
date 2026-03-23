import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Search from "@/components/global/Search";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Trash2, Eye } from "lucide-react";
import { api } from "@/lib/api";
import { useNavigate } from "react-router";
import CustomPagination from "@/components/global/CustomPagination";
import { AddAdminDialog } from "@/components/dialogs/AddAdminDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Admin {
  _id?: string;
  id?: string;
  name?: string;
  username?: string;
  email: string;
  role?: string;
}

export default function AdminsPage() {
  const navigate = useNavigate();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [meta, setMeta] = useState({ page: 1, total: 0, limit: 10 });

  // Delete States
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Handle Debounce (Wait 500ms after typing stops)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);

    return () => clearTimeout(handler);
  }, [search]);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(
        `/users/admins?page=${page}&limit=10`
      );
      
      if (data.data) {
        setAdmins(data.data);
        setMeta(data.meta || { page, total: 0, limit: 10 });
      } else {
        setAdmins([]);
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to load admins");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, [page]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/users/${deleteId}`);
      toast.success("Admin deleted successfully");
      fetchAdmins();
    } catch (error) {
      toast.error("Failed to delete admin");
      console.log(error);
    } finally {
      setIsDeleteOpen(false);
      setDeleteId(null);
    }
  };

  const filteredAdmins = admins.filter(
    (admin) =>
      admin.email?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      admin.username?.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Administrators</h2>
          <p className="text-muted-foreground">
            Manage system administrators and their permissions.
          </p>
        </div>
        <AddAdminDialog onAdminAdded={fetchAdmins} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex gap-2">
            <Search
              search={search}
              setSearch={setSearch}
              title="admins"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading admins...
            </div>
          ) : filteredAdmins.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No admins found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAdmins.map((admin) => (
                    <TableRow key={admin.id || admin._id}>
                      <TableCell className="font-medium">
                        {admin.username || "-"}
                      </TableCell>
                      <TableCell>{admin.email}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs">
                          Active
                        </span>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  navigate(`/users/${admin.id || admin._id}`);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>View & Edit Profile</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setDeleteId(admin.id || admin._id || "");
                                  setIsDeleteOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        {admins.length > 0 && (
          <CustomPagination
            page={page}
            setPage={setPage}
            totalPages={Math.ceil(meta.total / meta.limit)}
            loading={loading}
          />
        )}
      </Card>

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Admin</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this admin? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600">
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
