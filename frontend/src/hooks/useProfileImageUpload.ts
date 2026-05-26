import { useState } from "react";
import { api } from "@/lib/api";
import { toast } from "react-toastify";

interface UseProfileImageUploadReturn {
  uploading: boolean;
  error: string | null;
  uploadImage: (userId: string, file: File) => Promise<string | null>;
}

export function useProfileImageUpload(): UseProfileImageUploadReturn {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadImage = async (
    userId: string,
    file: File
  ): Promise<string | null> => {
    try {
      setUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append("image", file);

      // Note: You might need to adjust this endpoint based on your backend
      // This could be a dedicated image upload endpoint or part of the profile update
      const { data } = await api.post(
        `/profiles/${userId}/image`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      toast.success("Image uploaded successfully");
      return data.image_url || data.image;
    } catch (err: any) {
      const message =
        err.response?.data?.detail || err.message || "Failed to upload image";
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  return {
    uploading,
    error,
    uploadImage,
  };
}
