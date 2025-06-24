import { supabase } from '@/lib/supabase';
import type { UserHandbook } from '@/types/database';

export interface UploadValidationError {
  message: string;
}

export interface UploadProgress {
  uploading: boolean;
  progress?: number;
  error?: string;
  success?: string;
}

export const validateHandbookFile = (file: File): string | null => {
  if (file.type !== "application/pdf") {
    return "Please upload a PDF file only";
  }
  if (file.size > 100 * 1024 * 1024) {
    return "File size must be less than 100MB";
  }
  return null;
};

export const generateFilePath = (userId: string, originalFilename: string): string => {
  const fileExt = originalFilename.split(".").pop();
  const fileName = `${Date.now()}-${Math.random()
    .toString(36)
    .substring(2)}.${fileExt}`;
  return `user-handbooks/${userId}/${fileName}`;
};

export const uploadFileToStorage = async (
  file: File, 
  filePath: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('Uploading file to path:', filePath);
    console.log('File size:', file.size, 'bytes');
    console.log('File type:', file.type);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("handbooks")
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return { success: false, error: `Upload failed: ${uploadError.message}` };
    }

    console.log('File uploaded successfully:', uploadData);
    return { success: true };
  } catch (err) {
    console.error('Upload error:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : "Unknown upload error" 
    };
  }
};

export const createHandbookRecord = async (
  userId: string,
  academicId: string,
  filePath: string,
  file: File
): Promise<{ success: boolean; handbook?: UserHandbook; error?: string }> => {
  try {
    const { data: handbook, error: dbError } = await supabase
      .from("user_handbooks")
      .insert({
        user_id: userId,
        academic_id: academicId,
        storage_path: filePath,
        original_filename: file.name,
        file_size_bytes: file.size,
        processing_status: 'uploaded',
        upload_date: new Date().toISOString()
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database insert error:', dbError);
      await supabase.storage.from("handbooks").remove([filePath]);
      return { 
        success: false, 
        error: `Database error: ${dbError.message}` 
      };
    }

    console.log('Handbook record created:', handbook);
    return { success: true, handbook };
  } catch (err) {
    console.error('Database error:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : "Unknown database error" 
    };
  }
};

export const triggerBackendProcessing = async (
  _handbookId: string,
  userId: string,
  academicId: string,
  storagePath: string,
  originalFilename: string,
  fileSizeBytes: number
): Promise<{ success: boolean; error?: string }> => {
  try {
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    
    if (!backendUrl) {
      throw new Error('VITE_BACKEND_URL environment variable is required');
    }

    const response = await fetch(`${backendUrl}/handbook/process`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        academic_id: academicId,
        storage_path: storagePath,
        original_filename: originalFilename,
        file_size_bytes: fileSizeBytes
      }),
    });

    if (!response.ok) {
      console.error('Handbook processing request failed:', response.status, response.statusText);
      return { success: false, error: 'Handbook processing request failed' };
    }

    const data = await response.json();
    console.log('Processing started:', data);

    return { success: true };
  } catch (err) {
    console.error('Backend processing failed:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : "Backend processing failed" 
    };
  }
};

export const checkUserAuthentication = async (): Promise<{ 
  authenticated: boolean; 
  error?: string 
}> => {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return { 
        authenticated: false, 
        error: "You must be logged in to upload files" 
      };
    }
    return { authenticated: true };
  } catch (err) {
    return { 
      authenticated: false, 
      error: err instanceof Error ? err.message : "Authentication check failed" 
    };
  }
};

export const uploadHandbook = async (
  file: File,
  userId: string,
  academicId: string
): Promise<{ 
  success: boolean; 
  handbook?: UserHandbook; 
  error?: string;
  processingStarted?: boolean;
}> => {
  try {
    const validationError = validateHandbookFile(file);
    if (validationError) {
      return { success: false, error: validationError };
    }

    const authResult = await checkUserAuthentication();
    if (!authResult.authenticated) {
      return { success: false, error: authResult.error };
    }

    const filePath = generateFilePath(userId, file.name);

    const uploadResult = await uploadFileToStorage(file, filePath);
    if (!uploadResult.success) {
      return { success: false, error: uploadResult.error };
    }

    const dbResult = await createHandbookRecord(userId, academicId, filePath, file);
    if (!dbResult.success) {
      return { success: false, error: dbResult.error };
    }

    console.log('Starting automatic PDF processing...');
    const processingResult = await triggerBackendProcessing(
      dbResult.handbook!.handbook_id,
      userId,
      academicId,
      filePath,
      file.name,
      file.size
    );

    if (processingResult.success) {
      console.log('PDF processing started successfully');
    } else {
      console.warn('Processing failed to start:', processingResult.error);
    }

    return { 
      success: true, 
      handbook: dbResult.handbook,
      processingStarted: processingResult.success
    };
  } catch (err) {
    console.error('Upload handbook error:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : "Upload failed" 
    };
  }
}; 
