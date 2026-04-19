import { useState } from "react";
import { toast } from "sonner";
import { Loader2, BookOpen } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Lesson | null;
  onSuccess: (data: any) => Promise<void>;
}

const LessonForm = ({
  open,
  onOpenChange,
  initialData,
  onSuccess,
}: Props) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
    content: initialData?.content || "",
    course_id: initialData?.course_id?.toString() || "",
    order: initialData?.order?.toString() || "1",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      toast.error("Lesson title is required");
      return;
    }
    if (!formData.course_id) {
      toast.error("Course is required");
      return;
    }

    try {
      setLoading(true);
      await onSuccess({
        title: formData.title,
        description: formData.description || null,
        content: formData.content || null,
        course_id: parseInt(formData.course_id),
        order: parseInt(formData.order),
      });
      onOpenChange(false);
      setFormData({
        title: "",
        description: "",
        content: "",
        course_id: "",
        order: "1",
      });
    } catch (error) {
      // Error is handled by parent component
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-white/95 dark:bg-slate-800/95 backdrop-blur border border-gray-200 dark:border-slate-700">
        <DialogHeader className="space-y-2 border-b border-gray-100 dark:border-slate-700 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#72e3ad] dark:bg-[#006239] rounded-lg">
              <BookOpen className="h-5 w-5 text-gray-900 dark:text-gray-100" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                {initialData ? "Edit Lesson" : "Create New Lesson"}
              </DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400 mt-1">
                {initialData
                  ? "Update your lesson details and content"
                  : "Add a new lesson to your course"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-gray-900 dark:text-white font-semibold">
              Lesson Title *
            </Label>
            <Input
              id="title"
              name="title"
              placeholder="e.g., Introduction to Python Basics"
              value={formData.title}
              onChange={handleChange}
              disabled={loading}
              className="h-11 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all dark:placeholder:text-gray-500\"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-gray-900 dark:text-white font-semibold">
              Description
            </Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Brief description of what students will learn"
              value={formData.description}
              onChange={handleChange}
              disabled={loading}
              rows={2}
              className="bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all resize-none dark:placeholder:text-gray-500\"
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content" className="text-gray-900 dark:text-white font-semibold">
              Content (HTML or Text)
            </Label>
            <Textarea
              id="content"
              name="content"
              placeholder="Paste lesson content, course materials, or learning objectives here"
              value={formData.content}
              onChange={handleChange}
              disabled={loading}
              rows={4}
              className="bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-none dark:placeholder:text-gray-500"
            />
          </div>

          {/* Course ID & Order - Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Course ID */}
            <div className="space-y-2">
              <Label htmlFor="course_id" className="text-gray-900 dark:text-white font-semibold">
                Course ID *
              </Label>
              <Input
                id="course_id"
                name="course_id"
                type="number"
                placeholder="e.g., 1"
                value={formData.course_id}
                onChange={handleChange}
                disabled={loading}
                className="h-11 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all dark:placeholder:text-gray-500"
              />
            </div>

            {/* Order */}
            <div className="space-y-2">
              <Label htmlFor="order" className="text-gray-900 dark:text-white font-semibold">
                Lesson Order
              </Label>
              <Input
                id="order"
                name="order"
                type="number"
                min="1"
                placeholder="1"
                value={formData.order}
                onChange={handleChange}
                disabled={loading}
                className="h-11 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all dark:placeholder:text-gray-500"
              />
            </div>
          </div>

          <DialogFooter className="border-t border-gray-100 dark:border-slate-700 pt-4 flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors h-9 px-3 text-sm rounded-lg"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#72e3ad] hover:bg-[#5edd9a] dark:bg-[#006239] dark:hover:bg-[#005230] text-gray-900 dark:text-gray-100 shadow-md hover:shadow-lg transition-all px-4 h-9 text-sm rounded-lg font-medium"
            >
              {loading && <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />}
              {initialData ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LessonForm;
