import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Search from "@/components/global/Search";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Trash2, Eye } from "lucide-react";
import { api } from "@/lib/api";
import { useNavigate } from "react-router";
import CustomPagination from "@/components/global/CustomPagination";
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
import { AddStudentDialog } from "@/components/dialogs/AddStudentDialog";

interface Student {
  id: string;
  username?: string;
  email: string;
  full_name?: string;
  grade_level_name?: string;
  department?: string;
  image?: string;
}

export default function StudentsPage() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [meta, setMeta] = useState({ page: 1, total: 0, limit: 10 });
  const [yearFilter, setYearFilter] = useState("");
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

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(
        `/users/students?page=${page}&limit=10`
      );
      
      if (data.data) {
        // Fetch profile data for each student
        const studentsWithProfiles = await Promise.all(
          data.data.map(async (student: Student) => {
            try {
              const profileRes = await api.get(`/profiles/${student.id}`);
              
              // Get grade level and department from nested student_profile
              const studentProfile = profileRes.data.student_profile;
              
              return {
                ...student,
                full_name: profileRes.data.full_name,
                image: profileRes.data.pfp || profileRes.data.image,
                grade_level_name: studentProfile?.grade_level_name || "-",
                department: studentProfile?.department || "-",
              };
            } catch (err) {
              // If profile not found, just return student without profile
              return student;
            }
          })
        );
        setStudents(studentsWithProfiles);
        setMeta(data.meta || { page, total: 0, limit: 10 });
      } else {
        setStudents([]);
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [page]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/users/${deleteId}`);
      toast.success("Student deleted successfully");
      fetchStudents();
    } catch (error) {
      toast.error("Failed to delete student");
      console.log(error);
    } finally {
      setIsDeleteOpen(false);
      setDeleteId(null);
    }
  };

  const filteredStudents = students.filter(
    (student) =>
      (student.email?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        student.username?.toLowerCase().includes(debouncedSearch.toLowerCase())) &&
      (yearFilter === "" || student.grade_level_name === yearFilter) &&
      (departmentFilter === "" || student.department === departmentFilter)
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Students</h2>
          <p className="text-muted-foreground">
            Manage student directory and year level assignments.
          </p>
        </div>
        <AddStudentDialog onStudentAdded={fetchStudents} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <Search
                search={search}
                setSearch={setSearch}
                title="students"
              />
            </div>
            <div className="flex gap-3 flex-wrap">
              <select
                value={yearFilter}
                onChange={(e) => {
                  setYearFilter(e.target.value);
                  setPage(1);
                }}
                className="h-10 px-3 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">All Year Levels</option>
                {Array.from(new Set(students.map((s) => s.grade_level_name))).filter(Boolean).map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <select
                value={departmentFilter}
                onChange={(e) => {
                  setDepartmentFilter(e.target.value);
                  setPage(1);
                }}
                className="h-10 px-3 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">All Departments</option>
                {Array.from(new Set(students.map((s) => s.department))).filter(Boolean).map((dept) => (
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
              Loading students...
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No students found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    {/* <TableHead>Year Level</TableHead> */}
                    <TableHead>Year Level</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => {
                    const initials = (student.full_name || student.username || "S")
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2);

                    return (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <ProfileAvatar
                              src={student.image}
                              alt={student.full_name || student.username || "Student"}
                              fallback={initials}
                              size="sm"
                            />
                            <span>{student.full_name || student.username || "-"}</span>
                          </div>
                        </TableCell>
                        <TableCell>{student.email}</TableCell>
                        <TableCell>{student.grade_level_name || "-"}</TableCell>
                        <TableCell>{student.department || "-"}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    navigate(`/users/students/${student.id}`);
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
                                    setDeleteId(student.id);
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
        {students.length > 0 && (
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
            <AlertDialogTitle>Delete Student</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this student? This action cannot
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
