import { useState } from 'react';
import { triggerBackendProcessing } from '../lib/handbookUpload';
import { supabase } from '@/lib/supabase';

export function HandbookTestButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTestProcessing = async () => {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      // Get current user session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        setError('User not authenticated');
        return;
      }

      const userId = session.user.id;

      // Get the latest uploaded handbook for this user
      const { data: handbooks, error: handbookError } = await supabase
        .from('user_handbooks')
        .select('handbook_id, original_filename, processing_status')
        .eq('user_id', userId)
        .order('upload_date', { ascending: false })
        .limit(1);

      if (handbookError) {
        setError(`Database error: ${handbookError.message}`);
        return;
      }

      if (!handbooks || handbooks.length === 0) {
        setError('No handbook found. Please upload a handbook first.');
        return;
      }

      const handbook = handbooks[0];
      console.log('Found handbook:', handbook);

      // Trigger backend processing
      const processingResult = await triggerBackendProcessing(handbook.handbook_id, userId);

      if (processingResult.success) {
        setResult(`Successfully triggered processing for handbook: ${handbook.original_filename} (ID: ${handbook.handbook_id})`);
      } else {
        setError(`Processing failed: ${processingResult.error}`);
      }

    } catch (err) {
      console.error('Test processing error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-4">
      <h3 className="text-lg font-semibold text-foreground">Test Handbook Processing</h3>
      <p className="text-sm text-muted-foreground">
        Test the handbook processing functionality with your already uploaded file.
      </p>
      
      <button
        onClick={handleTestProcessing}
        disabled={loading}
        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Testing Processing...
          </div>
        ) : (
          'Test Handbook Processing'
        )}
      </button>

      {result && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
          <p className="text-sm">{result}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <p className="text-sm">{error}</p>
        </div>
      )}
    </div>
  );
} 