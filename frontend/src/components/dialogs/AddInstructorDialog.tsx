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

interface AddInstructorDialogProps {
  onInstructorAdded?: () => void;
}

export function AddInstructorDialog({ onInstructorAdded }: AddInstructorDialogProps) {
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

  const handleAddInstructor = async () => {
    if (!formData.username || !formData.email || !formData.password) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      // Step 1: Create User with instructor role
      const userRes = await api.post("/users", {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: "instructor",
      });

      const userId = userRes.data.id;

      // Step 2: Create User Profile
      await api.post(`/profiles/${userId}`, {
        full_name: formData.full_name || formData.username,
      });

      // Step 3: Create Instructor Profile
      await api.post(`/instructors/${userId}/profile`, {});

      toast.success("Instructor created successfully!");
      setFormData({
        username: "",
        email: "",
        password: "",
        full_name: "",
      });
      setOpen(false);
      onInstructorAdded?.();
    } catch (error: any) {
      toast.error(
        error.response?.data?.detail || "Failed to create instructor"
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
          Add Instructor
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Instructor</DialogTitle>
          <DialogDescription>
            Create a new instructor account. Fill in the basic information.
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
              placeholder="e.g., jane_smith"
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
              placeholder="e.g., jane@example.com"
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
              placeholder="e.g., Jane Smith"
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
              onClick={handleAddInstructor}
              disabled={loading}
            >
              {loading ? "Creating..." : "Add Instructor"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
