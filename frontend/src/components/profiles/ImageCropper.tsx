import { useState } from "react";
import Cropper from "react-easy-crop";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";

interface ImageCropperProps {
  imageSrc: string;
  open: boolean;
  onCropComplete: (croppedImage: Blob) => void;
  onCancel: () => void;
}

interface CroppedAreaPixels {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function ImageCropper({
  imageSrc,
  open,
  onCropComplete,
  onCancel,
}: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CroppedAreaPixels | null>(null);

  const onCropChange = (crop: { x: number; y: number }) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom: number) => {
    setZoom(zoom);
  };

  const onCropAreaChange = (_croppedArea: any, croppedAreaPixels: CroppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleCropConfirm = async () => {
    if (!croppedAreaPixels) return;

    try {
      // Create canvas and crop the image
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = croppedAreaPixels.width;
        canvas.height = croppedAreaPixels.height;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(
          image,
          croppedAreaPixels.x,
          croppedAreaPixels.y,
          croppedAreaPixels.width,
          croppedAreaPixels.height,
          0,
          0,
          croppedAreaPixels.width,
          croppedAreaPixels.height
        );

        // Convert canvas to blob
        canvas.toBlob((blob) => {
          if (blob) {
            onCropComplete(blob);
          }
        }, "image/jpeg", 0.95);
      };
      image.src = imageSrc;
    } catch (error) {
      console.error("Error cropping image:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Crop Your Image</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Cropper */}
          <div className="relative w-full h-96 bg-muted rounded-lg overflow-hidden">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={true}
              onCropChange={onCropChange}
              onCropAreaChange={onCropAreaChange}
              onZoomChange={onZoomChange}
              restrictPosition={true}
            />
          </div>

          {/* Zoom Slider */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium min-w-fit">Zoom:</span>
            <Slider
              value={[zoom]}
              onValueChange={(value) => onZoomChange(value[0])}
              min={1}
              max={3}
              step={0.1}
              className="flex-1"
            />
            <span className="text-sm text-muted-foreground min-w-fit">
              {(zoom * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleCropConfirm}>
            Crop & Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
