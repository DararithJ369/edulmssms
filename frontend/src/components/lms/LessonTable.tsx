import { Pencil, Trash2, FileText, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface Lesson {
  id: number;
  course_id: number;
  title: string;
  description?: string;
  content?: string;
  order: number;
  created_at: string;
}

interface Props {
  data: Lesson[];
  onEdit: (lesson: Lesson) => void;
  onDelete: (id: number) => void;
  isInstructor: boolean;
}

const LessonTable = ({ data, onEdit, onDelete, isInstructor }: Props) => {
  return (
    <div className="border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gradient-to-r from-gray-50 dark:from-slate-800 to-green-50 dark:to-slate-700 border-b border-gray-200 dark:border-slate-700 hover:bg-gradient-to-r hover:from-gray-100 hover:to-green-100 dark:hover:from-slate-750 dark:hover:to-slate-650 transition-colors">
            <TableHead className="font-black text-gray-900 dark:text-white text-xs uppercase tracking-wider">Order</TableHead>
            <TableHead className="font-black text-gray-900 dark:text-white text-xs uppercase tracking-wider">Lesson Title</TableHead>
            <TableHead className="font-black text-gray-900 dark:text-white text-xs uppercase tracking-wider">Description</TableHead>
            <TableHead className="font-black text-gray-900 dark:text-white text-xs uppercase tracking-wider">Course</TableHead>
            <TableHead className="font-black text-gray-900 dark:text-white text-xs uppercase tracking-wider">Created</TableHead>
            <TableHead className="text-right font-black text-gray-900 dark:text-white text-xs uppercase tracking-wider">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((lesson, index) => (
            <TableRow
              key={lesson.id}
              className={`border-b border-gray-100 dark:border-slate-700 hover:bg-green-50/80 dark:hover:bg-slate-700/70 transition-all duration-200 cursor-pointer group ${
                index % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-gray-50/50 dark:bg-slate-800/50"
              }`}
            >
              <TableCell>
                <Badge variant="outline" className="bg-gradient-to-r from-green-50 dark:from-green-900/30 to-green-100/50 dark:to-green-900/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800 font-black px-3 py-1 text-xs uppercase tracking-wider hover:shadow-md transition-shadow group-hover:scale-110">
                  #{lesson.order}
                </Badge>
              </TableCell>
              <TableCell className="font-bold text-gray-900 dark:text-white max-w-xs truncate">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#72e3ad] dark:bg-[#006239] group-hover:scale-150 transition-transform duration-300"></div>
                  <span className="group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">{lesson.title}</span>
                </div>
              </TableCell>
              <TableCell className="text-gray-600 dark:text-gray-400 max-w-xs truncate text-sm">
                {lesson.description || (
                  <span className="text-gray-400 dark:text-gray-500 italic">No description</span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="bg-[#72e3ad]/20 dark:bg-[#006239]/30 text-[#1d7e59] dark:text-[#72e3ad] border-[#72e3ad]/40 dark:border-[#006239] font-black px-3 py-1 text-xs uppercase tracking-wider hover:shadow-md transition-shadow">
                  Course {lesson.course_id}
                </Badge>
              </TableCell>
              <TableCell className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {new Date(lesson.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </TableCell>
              <TableCell className="text-right">
                {isInstructor ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="h-8 w-8 p-0 hover:bg-green-100 dark:hover:bg-slate-700 transition-all duration-200 hover:scale-110 active:scale-95"
                      >
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4 text-gray-600 dark:text-gray-400 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 dark:bg-slate-800 dark:border-slate-700 shadow-lg">
                      <DropdownMenuLabel className="text-gray-900 dark:text-white font-bold text-sm">Quick Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator className="dark:bg-slate-700" />
                      <DropdownMenuItem
                        onClick={() => onEdit(lesson)}
                        className="cursor-pointer hover:bg-blue-50 focus:bg-blue-50 text-gray-700"
                      >
                        <Pencil className="mr-2 h-4 w-4 text-blue-600" />
                        <span>Edit Lesson</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDelete(lesson.id)}
                        className="cursor-pointer hover:bg-red-50 focus:bg-red-50 text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Delete</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hover:bg-blue-100 transition-colors"
                  >
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span className="ml-1 text-xs text-blue-600 hidden sm:inline">View</span>
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default LessonTable;
