import { useState, useEffect } from "react";
import { FileText, Clock, CheckCircle, XCircle, Loader2, Activity } from "lucide-react";
import { useTheme } from '@/lib/theme-provider';
import { cn } from '@/lib/utils';
import { supabase } from "@/lib/supabase";
import type { UserHandbook } from "@/types/database";

interface HandbookStatusProps {
  userId: string;
  onHandbookReady: (handbook: UserHandbook) => void;
}

export function HandbookStatus({
  userId,
  onHandbookReady,
}: HandbookStatusProps) {
  const [handbooks, setHandbooks] = useState<UserHandbook[]>([]);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  useEffect(() => {
    fetchHandbooks();

    // Set up real-time subscription
    const subscription = supabase
      .channel("handbook-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_handbooks",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            setHandbooks((prev) =>
              prev.map((h) =>
                h.handbook_id === payload.new.handbook_id
                  ? (payload.new as UserHandbook)
                  : h
              )
            );

            if (payload.new.processing_status === "completed") {
              onHandbookReady(payload.new as UserHandbook);
            }
          } else if (payload.eventType === "INSERT") {
            setHandbooks((prev) => [payload.new as UserHandbook, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId, onHandbookReady]);

  const fetchHandbooks = async () => {
    try {
      const { data, error } = await supabase
        .from("user_handbooks")
        .select("*")
        .eq("user_id", userId)
        .order("upload_date", { ascending: false });

      if (error) throw error;
      setHandbooks(data || []);

      // Check if any completed handbooks exist
      const completedHandbook = data?.find(h => h.processing_status === 'completed');
      if (completedHandbook) {
        onHandbookReady(completedHandbook);
      }
    } catch (err) {
      console.error("Error fetching handbooks:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "uploaded":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "processing":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "uploaded":
        return "Waiting to process";
      case "processing":
        return "Processing handbook...";
      case "completed":
        return "Ready for questions";
      case "failed":
        return "Processing failed";
      default:
        return "Unknown status";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "uploaded":
        return "text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-900";
      case "processing":
        return "text-blue-600 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900";
      case "completed":
        return "text-green-600 bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900";
      case "failed":
        return "text-red-600 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900";
      default:
        return "text-gray-600 bg-gray-50 dark:bg-gray-950/30 border-gray-200 dark:border-gray-900";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="bg-background border border-border rounded-xl p-6">
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary mr-3" />
          <span className="text-muted-foreground">Loading handbooks...</span>
        </div>
      </div>
    );
  }

  if (handbooks.length === 0) {
    return (
      <div className="bg-background border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-3">
          <div className={cn(
            "p-2 rounded-lg",
            isDark ? "bg-primary/10" : "bg-primary/5",
          )}>
            <Activity className="h-5 w-5 text-primary" />
          </div>
          Handbook Status
        </h3>
        <div className="text-center py-8">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">No handbooks uploaded yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Upload your department handbook to get started
          </p>
        </div>
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
          <Activity className="h-5 w-5 text-primary" />
        </div>
        Your Handbooks
      </h3>

      <div className="space-y-4">
        {handbooks.map((handbook) => (
          <div
            key={handbook.handbook_id}
            className={cn(
              "p-4 rounded-lg border transition-all duration-200",
              getStatusColor(handbook.processing_status)
            )}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <div className={cn(
                  "p-2 rounded-lg mt-1",
                  isDark ? "bg-background/80" : "bg-background/60"
                )}>
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate text-foreground">
                    {handbook.original_filename}
                  </p>
                  <div className="flex items-center space-x-4 mt-1 text-sm text-muted-foreground">
                    <span>
                      Uploaded {new Date(handbook.upload_date).toLocaleDateString()}
                    </span>
                    {handbook.file_size_bytes && (
                      <span>
                        {formatFileSize(handbook.file_size_bytes)}
                      </span>
                    )}
                  </div>
                  {handbook.processed_date && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Processed {new Date(handbook.processed_date).toLocaleDateString()}
                    </p>
                  )}
                  {handbook.error_message && (
                    <p className="text-xs text-red-600 mt-1 bg-red-50 dark:bg-red-950/30 p-2 rounded">
                      Error: {handbook.error_message}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-3 ml-4">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(handbook.processing_status)}
                  <span className="text-sm font-medium">
                    {getStatusText(handbook.processing_status)}
                  </span>
                </div>
              </div>
            </div>

            {handbook.processing_status === "completed" && (
              <div className="mt-3 pt-3 border-t border-current/20">
                <p className="text-xs text-muted-foreground">
                  ✅ Ready to answer questions about your handbook
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 