import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';

export interface CloudinaryUploadOptions {
  folder: string;
  maxSize?: number; // in MB, defaults to 5MB
  allowedTypes?: string[]; // defaults to common image types
}

export interface CloudinaryUploadResult {
  url: string;
  uploadMethod: 'cloudinary' | 'supabase';
  folder: string;
}

export interface CloudinaryUploadError {
  message: string;
  code?: string;
}

// Default allowed image types
const DEFAULT_ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/webp'
];

// Client-side validation function
function validateFile(
  file: File, 
  maxSize: number = 5, 
  allowedTypes: string[] = DEFAULT_ALLOWED_TYPES
): { isValid: boolean; error?: string } {
  // Check file size
  const maxSizeBytes = maxSize * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      isValid: false,
      error: `File is too large. Maximum size is ${maxSize}MB.`
    };
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    const allowedTypesDisplay = allowedTypes
      .map(type => type.replace('image/', '').toUpperCase())
      .join(', ');
    return {
      isValid: false,
      error: `Invalid file type. Allowed types: ${allowedTypesDisplay}`
    };
  }

  return { isValid: true };
}

// Upload function that calls the Supabase Edge function
async function uploadToCloudinary(
  file: File,
  options: CloudinaryUploadOptions
): Promise<CloudinaryUploadResult> {
  const formData = new FormData();
  formData.append('imageFile', file);
  formData.append('folder', options.folder);

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cloudinary-upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    let errorMessage = 'Upload failed';
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
    } catch {
      errorMessage = `Upload failed (${response.status})`;
    }
    throw new Error(errorMessage);
  }

  const result = await response.json();
  
  if (!result.success || !result.imageUrl) {
    throw new Error('Upload completed but no URL was returned');
  }

  return {
    url: result.imageUrl,
    uploadMethod: result.uploadMethod || 'cloudinary',
    folder: options.folder
  };
}

export function useCloudinaryUpload() {
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const uploadMutation = useMutation({
    mutationFn: async ({
      file,
      options
    }: {
      file: File;
      options: CloudinaryUploadOptions;
    }): Promise<CloudinaryUploadResult> => {
      // Client-side validation
      const validation = validateFile(file, options.maxSize, options.allowedTypes);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Set initial progress
      setUploadProgress(10);

      try {
        // Simulate progress during upload
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => Math.min(prev + 10, 90));
        }, 200);

        const result = await uploadToCloudinary(file, options);
        
        clearInterval(progressInterval);
        setUploadProgress(100);
        
        // Reset progress after a short delay
        setTimeout(() => setUploadProgress(0), 1000);
        
        return result;
      } catch (error) {
        setUploadProgress(0);
        throw error;
      }
    },
    onError: () => {
      setUploadProgress(0);
    }
  });

  const uploadFile = useCallback(
    (file: File, options: CloudinaryUploadOptions) => {
      return uploadMutation.mutateAsync({ file, options });
    },
    [uploadMutation]
  );

  const uploadProfilePhoto = useCallback(
    (file: File, maxSize: number = 5) => {
      return uploadFile(file, {
        folder: 'assets/profile-photos',
        maxSize,
        allowedTypes: DEFAULT_ALLOWED_TYPES
      });
    },
    [uploadFile]
  );

  const uploadIssueScreenshot = useCallback(
    (file: File) => {
      return uploadFile(file, {
        folder: 'issues/screenshots',
        maxSize: 5,
        allowedTypes: DEFAULT_ALLOWED_TYPES
      });
    },
    [uploadFile]
  );

  const uploadEventImage = useCallback(
    (file: File) => {
      return uploadFile(file, {
        folder: 'events/images',
        maxSize: 10,
        allowedTypes: DEFAULT_ALLOWED_TYPES
      });
    },
    [uploadFile]
  );

  const uploadOrganizationLogo = useCallback(
    (file: File) => {
      return uploadFile(file, {
        folder: 'organizations/logos',
        maxSize: 2,
        allowedTypes: DEFAULT_ALLOWED_TYPES
      });
    },
    [uploadFile]
  );

  return {
    // Upload functions
    uploadFile,
    uploadProfilePhoto,
    uploadIssueScreenshot,
    uploadEventImage,
    uploadOrganizationLogo,
    
    // State
    isUploading: uploadMutation.isPending,
    uploadProgress,
    error: uploadMutation.error as CloudinaryUploadError | null,
    
    // Utilities
    reset: uploadMutation.reset,
    validateFile: (file: File, maxSize?: number, allowedTypes?: string[]) => 
      validateFile(file, maxSize, allowedTypes)
  };
}