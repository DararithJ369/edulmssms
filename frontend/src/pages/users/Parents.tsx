import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Search from "@/components/global/Search";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Trash2, Eye } from "lucide-react";
import { api } from "@/lib/api";
import { useNavigate } from "react-router";
import CustomPagination from "@/components/global/CustomPagination";
import { AddParentDialog } from "@/components/dialogs/AddParentDialog";
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
import { ProfileAvatar } from "@/components/profiles/ProfileAvatar";

interface Parent {
  id: string;
  username?: string;
  email: string;
  full_name?: string;
  occupation?: string;
  emergency_phone?: string;
  image?: string;
}

export default function ParentsPage() {
  const navigate = useNavigate();
  const [parents, setParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [meta, setMeta] = useState({ page: 1, total: 0, limit: 10 });
  const [occupationFilter, setOccupationFilter] = useState("");

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

  const fetchParents = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(
        `/users/parents?page=${page}&limit=10`
      );
      
      if (data.data) {
        // Fetch profile data for each parent
        const parentsWithProfiles = await Promise.all(
          data.data.map(async (parent: Parent) => {
            try {
              const profileRes = await api.get(`/profiles/${parent.id}`);
              const parentProfile = profileRes.data.parent_profile;
              return {
                ...parent,
                full_name: profileRes.data.full_name,
                image: profileRes.data.pfp || profileRes.data.image,
                occupation: parentProfile?.occupation || "-",
                emergency_phone: parentProfile?.emergency_phone || "-",
              };
            } catch (err) {
              // If profile not found, just return parent without profile
              return parent;
            }
          })
        );
        setParents(parentsWithProfiles);
        setMeta(data.meta || { page, total: 0, limit: 10 });
      } else {
        setParents([]);
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to load parents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParents();
  }, [page]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/users/${deleteId}`);
      toast.success("Parent deleted successfully");
      fetchParents();
    } catch (error) {
      toast.error("Failed to delete parent");
      console.log(error);
    } finally {
      setIsDeleteOpen(false);
      setDeleteId(null);
    }
  };

  const filteredParents = parents.filter(
    (parent) =>
      (parent.email?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        parent.username?.toLowerCase().includes(debouncedSearch.toLowerCase())) &&
      (occupationFilter === "" || parent.occupation === occupationFilter)
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Parents</h2>
          <p className="text-muted-foreground">
            Manage parent directory and student associations.
          </p>
        </div>
        <AddParentDialog onParentAdded={fetchParents} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <Search
                search={search}
                setSearch={setSearch}
                title="parents"
              />
            </div>
            <div className="flex gap-3 flex-wrap">
              <select
                value={occupationFilter}
                onChange={(e) => {
                  setOccupationFilter(e.target.value);
                  setPage(1);
                }}
                className="h-10 px-3 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">All Occupations</option>
                {Array.from(new Set(parents.map((p) => p.occupation))).filter(Boolean).map((occ) => (
                  <option key={occ} value={occ}>
                    {occ}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading parents...
            </div>
          ) : filteredParents.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No parents found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Occupation</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredParents.map((parent) => {
                    const initials = (parent.full_name || parent.username || "P")
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2);

                    return (
                      <TableRow key={parent.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <ProfileAvatar
                              src={parent.image}
                              alt={parent.full_name || parent.username || "Parent"}
                              fallback={initials}
                              size="sm"
                            />
                            <span>{parent.full_name || parent.username || "-"}</span>
                          </div>
                        </TableCell>
                        <TableCell>{parent.email}</TableCell>
                        <TableCell>{parent.occupation || "-"}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    navigate(`/users/parents/${parent.id}`);
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
                                    setDeleteId(parent.id);
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
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        {parents.length > 0 && (
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
            <AlertDialogTitle>Delete Parent</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this parent? This action cannot
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
