import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface HandbookFile {
  handbook_id: string;
  original_filename: string;
  storage_path: string;
  processing_status: 'uploaded' | 'processing' | 'completed' | 'failed';
  upload_date: string;
  file_size_bytes?: number;
  error_message?: string;
}

export function useHandbookFiles(userId?: string) {
  const [handbooks, setHandbooks] = useState<HandbookFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHandbooks = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: dbError } = await supabase
        .from('user_handbooks')
        .select(`
          handbook_id,
          original_filename,
          storage_path,
          processing_status,
          upload_date,
          file_size_bytes,
          error_message
        `)
        .eq('user_id', userId)
        .order('upload_date', { ascending: false });

      if (dbError) {
        throw dbError;
      }

      setHandbooks(data || []);
    } catch (err) {
      console.error('Error fetching handbooks:', err);
      setError(err instanceof Error ? err.message : 'Failed to load handbooks');
    } finally {
      setLoading(false);
    }
  };

  const getSignedUrl = async (storagePath: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.storage
        .from('handbooks')
        .createSignedUrl(storagePath, 3600); // 1 hour expiry

      if (error) {
        console.error('Error creating signed URL:', error);
        return null;
      }

      return data.signedUrl;
    } catch (err) {
      console.error('Error getting signed URL:', err);
      return null;
    }
  };

  const openHandbook = async (handbook: HandbookFile) => {
    const signedUrl = await getSignedUrl(handbook.storage_path);
    if (signedUrl) {
      window.open(signedUrl, '_blank');
    } else {
      alert('Unable to open handbook. Please try again.');
    }
  };

  useEffect(() => {
    fetchHandbooks();
  }, [userId]);

  return {
    handbooks,
    loading,
    error,
    refetch: fetchHandbooks,
    openHandbook,
    getSignedUrl
  };
} 