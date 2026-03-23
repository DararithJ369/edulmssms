import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ImageCropper } from "./ImageCropper";

interface ImageUploadProps {
  onImageSelect: (file: File) => void;
  onImageDelete?: () => void;
  preview?: string;
  disabled?: boolean;
  className?: string;
}

export function ImageUpload({
  onImageSelect,
  onImageDelete,
  preview,
  disabled = false,
  className,
}: ImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(preview);
  const [showCropper, setShowCropper] = useState(false);
  const [selectedImageForCrop, setSelectedImageForCrop] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }

    // Create preview and open cropper
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImageForCrop(reader.result as string);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    // Create a File from the blob
    const croppedFile = new File([croppedBlob], "cropped-image.jpg", {
      type: "image/jpeg",
    });

    // Create preview URL
    const previewUrl = URL.createObjectURL(croppedBlob);
    setPreviewUrl(previewUrl);

    // Notify parent with the cropped file
    onImageSelect(croppedFile);

    // Close cropper
    setShowCropper(false);
    setSelectedImageForCrop(null);
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const handleClear = () => {
    setPreviewUrl(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    // Notify parent that image was deleted
    onImageDelete?.();
  };

  return (
    <>
      <div className={cn("flex flex-col gap-4", className)}>
        <div className="relative w-48 h-48 mx-auto">
          {/* Preview or Placeholder */}
          {previewUrl ? (
            <div className="relative w-full h-full">
              <img
                src={previewUrl}
                alt="Profile preview"
                className="w-full h-full object-cover rounded-xl border-2 border-muted"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={handleClear}
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div
              onClick={handleClick}
              className={cn(
                "w-full h-full rounded-xl border-2 border-dashed border-muted-foreground/25 flex items-center justify-center cursor-pointer hover:border-muted-foreground/50 transition bg-muted/50",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="text-center">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground font-medium">Click to upload</p>
              </div>
            </div>
          )}
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled}
        />

        {/* Upload Button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleClick}
          disabled={disabled}
          className="w-full"
        >
          <Upload className="h-4 w-4 mr-2" />
          {previewUrl ? "Change Photo" : "Upload Photo"}
        </Button>

        {/* Help Text */}
        <p className="text-xs text-muted-foreground text-center">
          JPG, PNG or GIF (Max 5MB) • Crop to square
        </p>
      </div>

      {/* Image Cropper Dialog */}
      {selectedImageForCrop && (
        <ImageCropper
          imageSrc={selectedImageForCrop}
          open={showCropper}
          onCropComplete={handleCropComplete}
          onCancel={() => {
            setShowCropper(false);
            setSelectedImageForCrop(null);
            if (fileInputRef.current) {
              fileInputRef.current.value = "";
            }
          }}
        />
      )}
    </>
  );
}

