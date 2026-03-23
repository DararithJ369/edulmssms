import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface AddStudentDialogProps {
  onStudentAdded?: () => void;
}

export function AddStudentDialog({ onStudentAdded }: AddStudentDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    full_name: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddStudent = async () => {
    if (!formData.username || !formData.email || !formData.password) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      // Step 1: Create User with student role
      const userRes = await api.post("/users", {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: "student",
      });

      const userId = userRes.data.id;

      // Step 2: Create User Profile
      await api.post(`/profiles/${userId}`, {
        full_name: formData.full_name || formData.username,
      });

      // Step 3: Create Student Profile
      await api.post(`/students/${userId}/profile`, {});

      toast.success("Student created successfully!");
      setFormData({
        username: "",
        email: "",
        password: "",
        full_name: "",
      });
      setOpen(false);
      onStudentAdded?.();
    } catch (error: any) {
      toast.error(
        error.response?.data?.detail || "Failed to create student"
      );
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full md:w-auto gap-2">
          <Plus className="h-4 w-4" />
          Add Student
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Student</DialogTitle>
          <DialogDescription>
            Create a new student account. Fill in the basic information.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="username" className="text-xs font-medium">
              Username *
            </Label>
            <Input
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="e.g., john_doe"
              disabled={loading}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="email" className="text-xs font-medium">
              Email *
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="e.g., john@example.com"
              disabled={loading}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-xs font-medium">
              Password *
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Minimum 8 characters"
              disabled={loading}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="full_name" className="text-xs font-medium">
              Full Name
            </Label>
            <Input
              id="full_name"
              name="full_name"
              value={formData.full_name}
              onChange={handleInputChange}
              placeholder="e.g., John Doe"
              disabled={loading}
              className="mt-1"
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddStudent}
              disabled={loading}
            >
              {loading ? "Creating..." : "Add Student"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
