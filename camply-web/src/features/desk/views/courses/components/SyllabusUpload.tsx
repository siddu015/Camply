import { useState } from 'react';
import { useTheme } from '@/lib/theme-provider';
import { cn } from '@/lib/utils';
import { FileUpload } from '@/components/ui/file-upload';
import { supabase } from '@/lib/supabase';
import { Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface SyllabusUploadProps {
  courseId: string;
  userId: string;
  onUploadSuccess: (storagePath: string) => void;
  onUploadError?: (error: string) => void;
}

export function SyllabusUpload({ courseId, userId, onUploadSuccess, onUploadError }: SyllabusUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const handleFileUpload = async (files: File[]) => {
    if (files.length === 0) return;
    
    const file = files[0];
    
    // Validate file type
    if (file.type !== 'application/pdf') {
      const errorMsg = 'Please upload a PDF file';
      setError(errorMsg);
      setUploadStatus('error');
      onUploadError?.(errorMsg);
      return;
    }

    // Validate file size (100MB max)
    if (file.size > 100 * 1024 * 1024) {
      const errorMsg = 'File size must be less than 100MB';
      setError(errorMsg);
      setUploadStatus('error');
      onUploadError?.(errorMsg);
      return;
    }

    setUploading(true);
    setUploadStatus('uploading');
    setError(null);

    try {
      // Generate unique filename
      const timestamp = new Date().getTime();
      const fileName = `syllabus_${timestamp}.pdf`;
      const filePath = `${userId}/${courseId}/${fileName}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('course_documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      // Update course with syllabus storage path
      const { error: updateError } = await supabase
        .from('courses')
        .update({ syllabus_storage_path: filePath })
        .eq('course_id', courseId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      setUploadStatus('success');
      onUploadSuccess(filePath);

      // Call backend to process syllabus
      try {
        await fetch('http://localhost:8001/process-syllabus', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            course_id: courseId,
            user_id: userId,
            storage_path: filePath
          }),
        });
      } catch (backendError) {
        console.warn('Backend processing failed:', backendError);
        // Don't fail the upload if backend processing fails
      }

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMsg);
      setUploadStatus('error');
      onUploadError?.(errorMsg);
    } finally {
      setUploading(false);
    }
  };

  const getStatusIcon = () => {
    switch (uploadStatus) {
      case 'uploading':
        return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      default:
        return <Upload className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusText = () => {
    switch (uploadStatus) {
      case 'uploading':
        return 'Uploading syllabus...';
      case 'success':
        return 'Syllabus uploaded successfully!';
      case 'error':
        return error || 'Upload failed';
      default:
        return 'Upload Course Syllabus';
    }
  };

  if (uploadStatus === 'success') {
    return (
      <div className={cn(
        "flex items-center justify-center gap-3 p-6 rounded-xl border",
        "bg-green-50/50 border-green-200/50 text-green-700",
        isDark && "bg-green-950/30 border-green-800/30 text-green-400"
      )}>
        <CheckCircle className="h-6 w-6" />
        <span className="font-medium">Syllabus uploaded successfully!</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          {getStatusIcon()}
          <h3 className="text-lg font-semibold text-foreground">
            {getStatusText()}
          </h3>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Upload your course syllabus to enable AI-powered content generation and study planning
        </p>
      </div>

      {uploadStatus !== 'error' && (
        <div className="max-w-md mx-auto">
          <FileUpload onChange={handleFileUpload} />
          
          {uploading && (
            <div className="mt-4 text-center">
              <div className="flex items-center justify-center gap-2 text-sm text-primary">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processing upload...</span>
              </div>
            </div>
          )}

          {error && (
            <div className={cn(
              "mt-4 p-3 rounded-lg border",
              "bg-destructive/10 border-destructive/20 text-destructive"
            )}>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            </div>
          )}
        </div>
      )}

      <div className={cn(
        "text-xs text-muted-foreground text-center space-y-1"
      )}>
        <p>• Supported format: PDF files only</p>
        <p>• Maximum file size: 100MB</p>
        <p>• AI will process your syllabus to create structured content</p>
      </div>
    </div>
  );
} 