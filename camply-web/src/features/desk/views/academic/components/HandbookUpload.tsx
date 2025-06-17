import { useState } from "react";
import { Loader2, AlertCircle, CheckCircle, Book } from "lucide-react";
import { useTheme } from '@/lib/theme-provider';
import { cn } from '@/lib/utils';
import { supabase } from "@/lib/supabase";
import type { UserHandbook } from "@/types/database";
import { FileUpload } from "@/components/ui/file-upload";

interface HandbookUploadProps {
  userId: string;
  academicId: string;
  onUploadSuccess: (handbook: UserHandbook) => void;
}

export function HandbookUpload({
  userId,
  academicId,
  onUploadSuccess,
}: HandbookUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const validateFile = (file: File): string | null => {
    if (file.type !== "application/pdf") {
      return "Please upload a PDF file only";
    }
    if (file.size > 100 * 1024 * 1024) {
      // 100MB limit
      return "File size must be less than 100MB";
    }
    return null;
  };

  const uploadHandbook = async (files: File[]) => {
    if (files.length === 0) return;
    
    const file = files[0];
    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate file
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      // Generate unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2)}.${fileExt}`;
      const filePath = `user-handbooks/${userId}/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("handbooks")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create database record
      const { data: handbook, error: dbError } = await supabase
        .from("user_handbooks")
        .insert({
          user_id: userId,
          academic_id: academicId,
          storage_path: filePath,
          original_filename: file.name,
          file_size_bytes: file.size,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Trigger backend processing
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
      await fetch(`${backendUrl}/process-handbook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handbook_id: handbook.handbook_id,
          user_id: userId,
        }),
      });

      setSuccess("Handbook uploaded successfully! Processing will begin shortly.");
      onUploadSuccess(handbook);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-background border border-border rounded-xl p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-3">
        <div className={cn(
          "p-2 rounded-lg",
          isDark ? "bg-primary/10" : "bg-primary/5",
        )}>
          <Book className="h-5 w-5 text-primary" />
        </div>
        Upload Department Handbook
      </h3>

      <div className="space-y-4">
        <div className={cn(
          "border-2 border-dashed rounded-xl transition-colors",
          uploading ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/50"
        )}>
          {uploading ? (
            <div className="p-10 flex flex-col items-center justify-center">
              <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
              <p className="text-foreground font-medium">Uploading handbook...</p>
              <p className="text-muted-foreground text-sm mt-1">
                This may take a few moments
              </p>
            </div>
          ) : (
            <FileUpload onChange={uploadHandbook} />
          )}
        </div>

        {/* File Requirements */}
        <div className={cn(
          "p-4 rounded-lg",
          isDark ? "bg-muted/30" : "bg-muted/20"
        )}>
          <h4 className="text-sm font-medium text-foreground mb-2">
            File Requirements:
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• PDF format only</li>
            <li>• Maximum file size: 100MB</li>
            <li>• Department/Academic handbook or rulebook</li>
            <li>• Processing takes 2-5 minutes depending on file size</li>
          </ul>
        </div>

        {/* Success Message */}
        {success && (
          <div className="flex items-center space-x-3 text-green-600 bg-green-50 dark:bg-green-950/30 p-4 rounded-lg border border-green-200 dark:border-green-900">
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm font-medium">{success}</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="flex items-center space-x-3 text-red-600 bg-red-50 dark:bg-red-950/30 p-4 rounded-lg border border-red-200 dark:border-red-900">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}
      </div>
    </div>
  );
} 