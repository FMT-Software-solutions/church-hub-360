import { useCallback, useEffect, useState } from 'react';
import { Button } from '../ui/button';
import {
  Cropper,
  CropperCropArea,
  CropperDescription,
  CropperImage,
} from '../ui/cropper';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

// Define type for pixel crop area
type Area = { x: number; y: number; width: number; height: number };

// Helper function to create image element
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

// Helper function to validate profile photo file
const validateProfilePhotoFile = (file: File): { isValid: boolean; error?: string } => {
  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return { isValid: false, error: 'File size must be less than 5MB' };
  }

  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'Please upload a valid image file (JPEG, PNG, GIF, or WebP)' };
  }

  return { isValid: true };
};

// Helper function to get cropped image as blob
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  outputSize: number = 400 // Square output size
): Promise<Blob | null> {
  try {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return null;
    }

    // Set canvas size to square output
    canvas.width = outputSize;
    canvas.height = outputSize;

    // Draw the cropped image onto the canvas as a square
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      outputSize,
      outputSize
    );

    // Convert canvas to blob
    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          resolve(blob);
        },
        'image/jpeg',
        0.9
      ); // High quality JPEG
    });
  } catch (error) {
    console.error('Error in getCroppedImg:', error);
    return null;
  }
}

interface ProfilePhotoCropperProps {
  isOpen: boolean;
  onClose: () => void;
  onCropComplete: (croppedFile: File) => void;
  imageFile: File | null;
  isUploading?: boolean;
}

export function ProfilePhotoCropper({
  isOpen,
  onClose,
  onCropComplete,
  imageFile,
  isUploading = false,
}: ProfilePhotoCropperProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Create image URL when file changes
  useEffect(() => {
    if (imageFile) {
      // Validate file first
      const validation = validateProfilePhotoFile(imageFile);
      if (!validation.isValid) {
        setError(validation.error || 'Invalid file');
        return;
      }

      setError(null);
      const url = URL.createObjectURL(imageFile);
      setImageUrl(url);

      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setImageUrl(null);
    }
  }, [imageFile]);

  // Cleanup URLs when component unmounts or dialog closes
  useEffect(() => {
    if (!isOpen) {
      if (croppedImageUrl) {
        URL.revokeObjectURL(croppedImageUrl);
        setCroppedImageUrl(null);
      }
      setCroppedAreaPixels(null);
      setError(null);
      setIsProcessing(false);
    }
  }, [isOpen, croppedImageUrl]);

  // Callback to update crop area state
  const handleCropChange = useCallback((pixels: Area | null) => {
    setCroppedAreaPixels(pixels);
  }, []);

  // Function to generate preview
  const handlePreview = async () => {
    if (!croppedAreaPixels || !imageUrl) {
      setError('No crop area selected.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const croppedBlob = await getCroppedImg(imageUrl, croppedAreaPixels);
      if (!croppedBlob) {
        throw new Error('Failed to generate cropped image.');
      }

      // Create preview URL
      const newCroppedUrl = URL.createObjectURL(croppedBlob);

      // Revoke old URL if it exists
      if (croppedImageUrl) {
        URL.revokeObjectURL(croppedImageUrl);
      }

      setCroppedImageUrl(newCroppedUrl);
    } catch (error) {
      console.error('Error during cropping:', error);
      setError(error instanceof Error ? error.message : 'Cropping failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Function to confirm and upload cropped image
  const handleKeep = async () => {
    if (!croppedAreaPixels || !imageUrl || !imageFile) {
      setError('No crop area selected.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const croppedBlob = await getCroppedImg(imageUrl, croppedAreaPixels);
      if (!croppedBlob) {
        throw new Error('Failed to generate cropped image.');
      }

      // Create a File object from the blob
      const croppedFile = new File([croppedBlob], `profile-${imageFile.name}`, {
        type: 'image/jpeg',
        lastModified: Date.now(),
      });

      onCropComplete(croppedFile);
    } catch (error) {
      console.error('Error during final cropping:', error);
      setError(error instanceof Error ? error.message : 'Cropping failed');
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  if (!imageFile || !imageUrl) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Crop Your Profile Photo</DialogTitle>
          <DialogDescription>
            Adjust the crop area to create a square profile photo. The cropped image will
            be used as your profile picture.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 overflow-hidden">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950/20 dark:text-red-400 p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-4 md:flex-row min-h-0">
            {/* Cropper Section */}
            <div className="flex-1 min-h-0">
              <Cropper
                className="h-80 md:h-96"
                image={imageUrl}
                onCropChange={handleCropChange}
              >
                <CropperDescription />
                <CropperImage />
                <CropperCropArea />
              </Cropper>
            </div>

            {/* Preview Section */}
            <div className="flex flex-col gap-4 w-full md:w-32">
              <div className="flex flex-col gap-2">
                <Button
                  onClick={handlePreview}
                  disabled={!croppedAreaPixels || isProcessing}
                  variant="outline"
                  size="sm"
                >
                  {isProcessing ? 'Processing...' : 'Preview'}
                </Button>

                {/* Preview Display */}
                <div className="aspect-square w-full overflow-hidden rounded-lg border bg-muted/50">
                  {croppedImageUrl ? (
                    <img
                      src={croppedImageUrl}
                      alt="Profile photo preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center p-4 text-center text-xs text-muted-foreground">
                      Profile photo preview will appear here
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isUploading || isProcessing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleKeep}
            disabled={!croppedAreaPixels || isUploading || isProcessing}
          >
            {isUploading
              ? 'Uploading...'
              : isProcessing
              ? 'Processing...'
              : 'Keep & Use Photo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}