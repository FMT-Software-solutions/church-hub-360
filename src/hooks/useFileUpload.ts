import { useState, useCallback } from 'react';

// Types for the upload functionality
export interface UploadParams {
  file: File;
  bucketName: string;
  fileName?: string;
}

export interface UploadResponse {
  success: boolean;
  message: string;
  fileName: string;
  bucketName: string;
  etag: string;
  size: number;
  contentType: string;
  url: string;
  downloadUrl: string;
}

export interface UploadError {
  success: false;
  message: string;
  error?: string;
}

export interface UseFileUploadReturn {
  uploadFile: (params: UploadParams) => Promise<UploadResponse>;
  isUploading: boolean;
  error: string | null;
  clearError: () => void;
}

const UPLOAD_ENDPOINT = 'https://fmtsoftware.com/api/upload';

export function useFileUpload(): UseFileUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const uploadFile = useCallback(async (params: UploadParams): Promise<UploadResponse> => {
    const { file, bucketName, fileName } = params;

    // Clear any previous errors
    setError(null);
    setIsUploading(true);

    try {
      // Validate inputs
      if (!file) {
        throw new Error('File is required');
      }
      if (!bucketName) {
        throw new Error('Bucket name is required');
      }

      // Create FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucketName', bucketName);
      
      if (fileName) {
        formData.append('fileName', fileName);
      }

      // Make the upload request
      const response = await fetch(UPLOAD_ENDPOINT, {
        method: 'POST',
        body: formData,
      });

      // Parse the response
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `Upload failed with status ${response.status}`);
      }

      if (!result.success) {
        throw new Error(result.message || 'Upload failed');
      }

      return result as UploadResponse;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during upload';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  }, []);

  return {
    uploadFile,
    isUploading,
    error,
    clearError,
  };
}