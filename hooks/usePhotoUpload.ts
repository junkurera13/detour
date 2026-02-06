import { useMutation, useConvex } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useState, useCallback } from 'react';
import { Id } from '@/convex/_generated/dataModel';

interface UploadProgress {
  current: number;
  total: number;
  percentage: number;
}

interface UsePhotoUploadReturn {
  uploadPhotos: (localUris: string[]) => Promise<string[]>;
  isUploading: boolean;
  progress: UploadProgress | null;
  error: string | null;
  reset: () => void;
}

export function usePhotoUpload(): UsePhotoUploadReturn {
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const convex = useConvex();


  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setIsUploading(false);
    setProgress(null);
    setError(null);
  }, []);

  const uploadSinglePhoto = async (localUri: string, retries = 3): Promise<string> => {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        // 1. Get upload URL from Convex
        const uploadUrl = await generateUploadUrl();

        // 2. Fetch the local file and convert to blob
        const response = await fetch(localUri);
        const blob = await response.blob();

        // 3. Upload to Convex storage
        const uploadResponse = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            'Content-Type': blob.type || 'image/jpeg',
          },
          body: blob,
        });

        if (!uploadResponse.ok) {
          throw new Error(`Upload failed: ${uploadResponse.statusText}`);
        }

        // 4. Get the storage ID from response
        const { storageId } = await uploadResponse.json();

        // 5. Convert to public URL
        const publicUrl = await convex.query(api.files.getUrl, { storageId: storageId as Id<"_storage"> });

        return publicUrl;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error('Upload failed');

        // Wait before retry with exponential backoff
        if (attempt < retries) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    throw lastError ?? new Error('Upload failed after retries');
  };

  const uploadPhotos = useCallback(
    async (localUris: string[]): Promise<string[]> => {
      // Filter out empty strings
      const validUris = localUris.filter((uri) => uri && uri.length > 0);

      if (validUris.length === 0) {
        return [];
      }

      setIsUploading(true);
      setError(null);
      setProgress({ current: 0, total: validUris.length, percentage: 0 });

      const uploadedUrls: string[] = [];

      try {
        for (let i = 0; i < validUris.length; i++) {
          const uri = validUris[i];

          // Skip if already a remote URL (http/https)
          if (uri.startsWith('http://') || uri.startsWith('https://')) {
            uploadedUrls.push(uri);
          } else {
            const publicUrl = await uploadSinglePhoto(uri);
            uploadedUrls.push(publicUrl);
          }

          setProgress({
            current: i + 1,
            total: validUris.length,
            percentage: Math.round(((i + 1) / validUris.length) * 100),
          });
        }

        return uploadedUrls;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Upload failed';
        setError(message);
        throw err;
      } finally {
        setIsUploading(false);
      }
    },
    [generateUploadUrl, convex]
  );

  return {
    uploadPhotos,
    isUploading,
    progress,
    error,
    reset,
  };
}
