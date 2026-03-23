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

interface AddAdminDialogProps {
  onAdminAdded?: () => void;
}

export function AddAdminDialog({ onAdminAdded }: AddAdminDialogProps) {
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

  const handleAddAdmin = async () => {
    if (!formData.username || !formData.email || !formData.password) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      // Create User with admin role
      const userRes = await api.post("/users", {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: "admin",
      });

      const userId = userRes.data.id;

      // Create User Profile
      await api.post(`/profiles/${userId}`, {
        full_name: formData.full_name || formData.username,
      });

      toast.success("Admin created successfully!");
      setFormData({
        username: "",
        email: "",
        password: "",
        full_name: "",
      });
      setOpen(false);
      onAdminAdded?.();
    } catch (error: any) {
      toast.error(
        error.response?.data?.detail || "Failed to create admin"
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
          Add Admin
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Admin</DialogTitle>
          <DialogDescription>
            Create a new admin account. Fill in the basic information.
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
              placeholder="e.g., admin_user"
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
              placeholder="e.g., admin@example.com"
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
              placeholder="e.g., Admin User"
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
              onClick={handleAddAdmin}
              disabled={loading}
            >
              {loading ? "Creating..." : "Add Admin"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
