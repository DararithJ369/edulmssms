import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { Trash2, Eye, Loader2, Search } from "lucide-react";
import { api } from "@/lib/api";
import { useNavigate } from "react-router";
import { AddAdminDialog } from "@/components/dialogs/AddAdminDialog";
import CustomPagination from "@/components/global/CustomPagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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

interface Pagination {
  page: number;
  total: number;
  limit: number;
}

export default function AdminsPage() {
  const navigate = useNavigate();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    total: 0,
    limit: 10,
  });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const hasInitialized = useRef(false);

  // Handle Debounce (Wait 500ms after typing stops)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);

    return () => clearTimeout(handler);
  }, [search]);

  const fetchAdmins = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/users/admins?page=${page}&limit=10`);

      if (data.data) {
        setAdmins(data.data);
        setPagination(data.meta || { page, total: 0, limit: 10 });
      } else {
        setAdmins([]);
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to load admins");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      fetchAdmins();
    }
  }, [page, fetchAdmins]);

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

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  const filteredAdmins = admins.filter(
    (admin) =>
      admin.email?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      admin.username?.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  return (
    <div className="p-6 md:p-10 space-y-6 w-full">
      <div className="relative z-10">
        <div className="mb-8 space-y-2">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-5xl md:text-6xl font-black text-gray-900 dark:text-white leading-tight tracking-tight">
                Admins
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 font-medium mt-2">
                Manage system administrators and their permissions
              </p>
            </div>
            <AddAdminDialog onAdminAdded={fetchAdmins} />
          </div>
        </div>

        <div className="mb-8 space-y-4">
          <div className="relative group">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#72e3ad] z-10 pointer-events-none" />
              <Input
                type="text"
                placeholder="Search administrators by email or username..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-12 pr-4 py-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur border border-gray-200 dark:border-slate-700 rounded-lg shadow-sm focus:shadow-lg focus:border-green-400 dark:focus:border-green-500 dark:text-white dark:placeholder:text-gray-500 font-medium"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur border-0 shadow-md dark:border dark:border-slate-700">
            <CardContent className="pt-12 pb-12">
              <div className="flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-12 w-12 text-[#72e3ad]" />
                <p className="text-gray-600 dark:text-gray-400 font-medium">Loading administrators...</p>
              </div>
            </CardContent>
          </Card>
        ) : filteredAdmins.length === 0 ? (
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur border-0 shadow-md dark:border dark:border-slate-700">
            <CardContent className="pt-12 pb-12">
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-gray-200 dark:from-slate-700 to-gray-300 dark:to-slate-600 rounded-full flex items-center justify-center">
                  <Eye className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400 font-medium">No administrators found</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden shadow-lg hover:shadow-2xl">
            <div className="bg-gradient-to-r from-green-50 dark:from-slate-800 to-emerald-50 dark:to-slate-700 border-b border-gray-200 dark:border-slate-700 py-4 px-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Admin Directory</h2>
                <div className="px-3 py-1 bg-[#72e3ad]/20 dark:bg-[#006239]/30 rounded-full">
                  <span className="text-xs font-bold text-[#1d7e59] dark:text-[#72e3ad]">
                    {filteredAdmins.length} admins
                  </span>
                </div>
              </div>
            </div>
            <Table className="w-full">
              <TableHeader>
                <TableRow className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
                  <TableHead className="font-black text-gray-900 dark:text-white text-xs uppercase tracking-wider px-6">Name</TableHead>
                  <TableHead className="font-black text-gray-900 dark:text-white text-xs uppercase tracking-wider px-6">Email</TableHead>
                  <TableHead className="font-black text-gray-900 dark:text-white text-xs uppercase tracking-wider px-6">Status</TableHead>
                  <TableHead className="text-right font-black text-gray-900 dark:text-white text-xs uppercase tracking-wider px-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAdmins.map((admin, index) => (
                  <TableRow
                    key={admin.id || admin._id}
                    className={`border-b border-gray-100 dark:border-slate-700 hover:bg-green-50/80 dark:hover:bg-slate-700/70 transition-all duration-200 cursor-pointer group ${
                      index % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-gray-50/50 dark:bg-slate-800/50"
                    }`}
                  >
                    <TableCell className="font-bold text-gray-900 dark:text-white px-6">
                      {admin.username || "-"}
                    </TableCell>
                    <TableCell className="text-gray-700 dark:text-gray-300 px-6">{admin.email}</TableCell>
                    <TableCell className="px-6">
                      <Badge className="px-3 py-1 bg-[#72e3ad]/20 dark:bg-[#006239]/30 text-[#1d7e59] dark:text-[#72e3ad] text-xs font-bold uppercase tracking-wider border-0">
                        Active
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right px-6">
                      <div className="flex justify-end gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  navigate(`/users/${admin.id || admin._id}`);
                                }}
                                className="text-gray-700 dark:text-gray-300 hover:text-[#72e3ad] dark:hover:text-[#72e3ad] hover:bg-transparent"
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
                                className="text-gray-700 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400 hover:bg-transparent"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {totalPages >= 1 && (
              <CustomPagination loading={loading} page={page} setPage={setPage} totalPages={totalPages} />
            )}
          </div>
        )}
      </div>

      {/* Delete Alert Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent className="dark:bg-gray-800 dark:border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-white">Delete Admin</AlertDialogTitle>
            <AlertDialogDescription className="dark:text-gray-400">
              Are you sure you want to delete this admin? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
