import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Search from "@/components/global/Search";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Trash2, Eye } from "lucide-react";
import { api } from "@/lib/api";
import { useNavigate } from "react-router";
import CustomPagination from "@/components/global/CustomPagination";
import { AddInstructorDialog } from "@/components/dialogs/AddInstructorDialog";
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

interface Instructor {
  id: string;
  username?: string;
  email: string;
  full_name?: string;
  department?: string;
  position?: string;
  image?: string;
}

export default function TeachersPage() {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [meta, setMeta] = useState({ page: 1, total: 0, limit: 10 });
  const [departmentFilter, setDepartmentFilter] = useState("");

  // Delete States
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Handle Debounce (Wait 500ms after typing stops)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to page 1 when search changes
    }, 500);

    return () => clearTimeout(handler);
  }, [search]);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(
        `/users/instructors?page=${page}&limit=10`
      );
      
      if (data.data) {
        // Fetch profile data for each instructor
        const teachersWithProfiles = await Promise.all(
          data.data.map(async (teacher: Instructor) => {
            try {
              const profileRes = await api.get(`/profiles/${teacher.id}`);
              const instructorProfile = profileRes.data.instructor_profile;
              return {
                ...teacher,
                full_name: profileRes.data.full_name,
                image: profileRes.data.pfp || profileRes.data.image,
                department: instructorProfile?.department || "-",
                position: instructorProfile?.position || "-",
              };
            } catch (err) {
              // If profile not found, just return teacher without profile
              return teacher;
            }
          })
        );
        setTeachers(teachersWithProfiles);
        setMeta(data.meta || { page, total: 0, limit: 10 });
      } else {
        setTeachers([]);
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to load instructors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, [page]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/users/${deleteId}`);
      toast.success("Instructor deleted successfully");
      fetchTeachers();
    } catch (error) {
      toast.error("Failed to delete instructor");
      console.log(error);
    } finally {
      setIsDeleteOpen(false);
      setDeleteId(null);
    }
  };

  const filteredTeachers = teachers.filter(
    (teacher) =>
      (teacher.email?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        teacher.username?.toLowerCase().includes(debouncedSearch.toLowerCase())) &&
      (departmentFilter === "" || teacher.department === departmentFilter)
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Instructors</h2>
          <p className="text-muted-foreground">
            Manage instructor directory and course assignments.
          </p>
        </div>
        <AddInstructorDialog onInstructorAdded={fetchTeachers} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <Search
                search={search}
                setSearch={setSearch}
                title="instructors"
              />
            </div>
            <div className="flex gap-3 flex-wrap">
              <select
                value={departmentFilter}
                onChange={(e) => {
                  setDepartmentFilter(e.target.value);
                  setPage(1);
                }}
                className="h-10 px-3 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">All Departments</option>
                {Array.from(new Set(teachers.map((t) => t.department))).filter(Boolean).map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading instructors...
            </div>
          ) : filteredTeachers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No instructors found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTeachers.map((teacher) => {
                    const initials = (teacher.full_name || teacher.username || "I")
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2);

                    return (
                      <TableRow key={teacher.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <ProfileAvatar
                              src={teacher.image}
                              alt={teacher.full_name || teacher.username || "Instructor"}
                              fallback={initials}
                              size="sm"
                            />
                            <span>{teacher.full_name || teacher.username || "-"}</span>
                          </div>
                        </TableCell>
                        <TableCell>{teacher.email}</TableCell>
                        <TableCell>{teacher.position || "-"}</TableCell>
                        <TableCell>{teacher.department || "-"}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    navigate(`/users/instructors/${teacher.id}`);
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
                                    setDeleteId(teacher.id);
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
        {teachers.length > 0 && (
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
            <AlertDialogTitle>Delete Instructor</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this instructor? This action cannot
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
