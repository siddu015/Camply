import { useState } from "react";
import { CheckCircle, Book } from "lucide-react";
import { useTheme } from '@/lib/theme-provider';
import { cn } from '@/lib/utils';
import type { UserHandbook } from "@/types/database";
import { FileUpload } from "@/components/ui/file-upload";
import SimpleLoader from "@/components/SimpleLoader";
import { uploadHandbook } from '../lib/handbookUpload';

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

  const handleFileUpload = async (files: File[]) => {
    if (files.length === 0) return;
    
    const file = files[0];
    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await uploadHandbook(file, userId, academicId);
      
      if (result.success && result.handbook) {
        setSuccess("Handbook uploaded successfully! Processing will begin shortly.");
        onUploadSuccess(result.handbook);
      } else {
        setError(result.error || "Upload failed");
      }
    } catch (err) {
      console.error('Upload error:', err);
      const errorMessage = err instanceof Error ? err.message : "Upload failed";
      setError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  if (uploading || error) {
    return (
      <div className="bg-background border border-border rounded-xl p-6 min-h-[400px]">
        <SimpleLoader 
          size="md"
          text={uploading ? "Uploading handbook..." : "Processing your request..."}
          fullScreen={false}
        />
      </div>
    );
  }

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
          "border-border hover:border-primary/50"
        )}>
          <FileUpload onChange={handleFileUpload} />
        </div>

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

        {success && (
          <div className="flex items-center space-x-3 text-green-600 bg-green-50 dark:bg-green-950/30 p-4 rounded-lg border border-green-200 dark:border-green-900">
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm font-medium">{success}</span>
          </div>
        )}
      </div>
    </div>
  );
} 