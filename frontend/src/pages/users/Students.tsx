import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { Trash2, Eye, Loader2, Search, Users } from "lucide-react";
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

interface Pagination {
  page: number;
  total: number;
  limit: number;
}

export default function StudentsPage() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [meta, setMeta] = useState<Pagination>({ page: 1, total: 0, limit: 10 });
  const [yearFilter, setYearFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const hasInitialized = useRef(false);

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

  const fetchStudents = useCallback(async () => {
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
  }, [page]);

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      fetchStudents();
    }
  }, [page, fetchStudents]);

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
        student.username?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        student.full_name?.toLowerCase().includes(debouncedSearch.toLowerCase())) &&
      (yearFilter === "" || student.grade_level_name === yearFilter) &&
      (departmentFilter === "" || student.department === departmentFilter)
  );

  const totalPages = Math.ceil(meta.total / meta.limit);

  return (
    <div className="p-6 md:p-10 space-y-6 w-full">
      {/* Header Section */}
      <div className="relative z-10">
        {/* Title & Description */}
        <div className="mb-8 space-y-2">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-5xl md:text-6xl font-black text-gray-900 dark:text-white leading-tight tracking-tight">
                Students
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 font-medium mt-2">
                Manage and view student directory and assignments
              </p>
            </div>
            <AddStudentDialog onStudentAdded={fetchStudents} />
          </div>
        </div>

        {/* Search & Filters */}
        <div className="mb-8 space-y-4">
          <div className="relative group">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#72e3ad] z-10 pointer-events-none" />
              <Input
                type="text"
                placeholder="Search students by name, email, or username..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-12 pr-4 py-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur border border-gray-200 dark:border-slate-700 rounded-lg shadow-sm focus:shadow-lg focus:border-green-400 dark:focus:border-green-500 dark:text-white dark:placeholder:text-gray-500 font-medium"
              />
            </div>
          </div>
          <div className="flex gap-3 flex-wrap">
            <select
              value={yearFilter}
              onChange={(e) => {
                setYearFilter(e.target.value);
                setPage(1);
              }}
              className="h-10 px-3 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#72e3ad]"
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
              className="h-10 px-3 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#72e3ad]"
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

        {/* Students Table */}
        {loading ? (
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur border-0 shadow-md dark:border dark:border-slate-700">
            <CardContent className="pt-12 pb-12">
              <div className="flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-12 w-12 text-[#72e3ad]" />
                <p className="text-gray-600 dark:text-gray-400 font-medium">Loading students...</p>
              </div>
            </CardContent>
          </Card>
        ) : filteredStudents.length === 0 ? (
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur border-0 shadow-md dark:border dark:border-slate-700">
            <CardContent className="pt-12 pb-12">
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-gray-200 dark:from-slate-700 to-gray-300 dark:to-slate-600 rounded-full flex items-center justify-center">
                  <Users className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400 font-medium">No students found</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden shadow-lg hover:shadow-2xl">
            <div className="bg-gradient-to-r from-green-50 dark:from-slate-800 to-emerald-50 dark:to-slate-700 border-b border-gray-200 dark:border-slate-700 py-4 px-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Student Directory</h2>
                <div className="px-3 py-1 bg-[#72e3ad]/20 dark:bg-[#006239]/30 rounded-full">
                  <span className="text-xs font-bold text-[#1d7e59] dark:text-[#72e3ad]">{filteredStudents.length} students</span>
                </div>
              </div>
            </div>
            <Table className="w-full">
              <TableHeader>
                <TableRow className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
                  <TableHead className="font-black text-gray-900 dark:text-white text-xs uppercase tracking-wider px-6">Name</TableHead>
                  <TableHead className="font-black text-gray-900 dark:text-white text-xs uppercase tracking-wider px-6">Email</TableHead>
                  <TableHead className="font-black text-gray-900 dark:text-white text-xs uppercase tracking-wider px-6">Year Level</TableHead>
                  <TableHead className="font-black text-gray-900 dark:text-white text-xs uppercase tracking-wider px-6">Department</TableHead>
                  <TableHead className="text-right font-black text-gray-900 dark:text-white text-xs uppercase tracking-wider px-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
                    <TableBody>
                      {filteredStudents.map((student, index) => {
                        const initials = (student.full_name || student.username || "S")
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2);

                        return (
                          <TableRow
                            key={student.id}
                            className={`border-b border-gray-100 dark:border-slate-700 hover:bg-green-50/80 dark:hover:bg-slate-700/70 transition-all duration-200 cursor-pointer group ${
                              index % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-gray-50/50 dark:bg-slate-800/50"
                            }`}
                          >
                            <TableCell className="font-bold text-gray-900 dark:text-white max-w-xs truncate px-6">
                              <div className="flex items-center gap-2.5">
                                <ProfileAvatar
                                  src={student.image}
                                  alt={student.full_name || student.username || "Student"}
                                  fallback={initials}
                                  size="sm"
                                />
                                <span className="group-hover:text-[#72e3ad] dark:group-hover:text-[#72e3ad] transition-colors">{student.full_name || student.username || "-"}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-gray-600 dark:text-gray-400 max-w-xs truncate text-sm px-6">{student.email}</TableCell>
                            <TableCell className="px-6">
                              <Badge className="px-3 py-1 bg-[#72e3ad]/20 dark:bg-[#006239]/30 text-[#1d7e59] dark:text-[#72e3ad] text-xs font-bold uppercase tracking-wider border-0">
                                {student.grade_level_name || "-"}
                              </Badge>
                            </TableCell>
                            <TableCell className="px-6">
                              <Badge className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider border-0">
                                {student.department || "-"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right space-x-2 px-6">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                                      onClick={() => {
                                        navigate(`/users/students/${student.id}`);
                                      }}
                                    >
                                      <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>View & Edit Profile</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                                      onClick={() => {
                                        setDeleteId(student.id);
                                        setIsDeleteOpen(true);
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4 text-red-500 dark:text-red-400" />
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
            {totalPages >= 1 && (
              <div className="border-t border-gray-100 dark:border-slate-700 py-4 px-6">
                <CustomPagination
                  page={page}
                  setPage={setPage}
                  totalPages={totalPages}
                  loading={loading}
                />
              </div>
            )}
          </div>
        )}
      </div>

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
