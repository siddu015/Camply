import { useState, useEffect, useCallback } from 'react';
import { 
  checkHandbookExists, 
  subscribeToHandbookChanges 
} from '../lib/handbook';

export const useHandbook = (userId: string) => {
  const [handbookExists, setHandbookExists] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkUserHandbook = useCallback(async () => {
    if (!userId) return;
    
    try {
      setError(null);
      const exists = await checkHandbookExists(userId);
      setHandbookExists(exists);
    } catch (err) {
      console.error('Error checking handbook:', err);
      setError(err instanceof Error ? err.message : 'Failed to check handbook status');
      setHandbookExists(false);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const refreshHandbook = () => {
    setLoading(true);
    checkUserHandbook();
  };

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    checkUserHandbook();

    const subscription = subscribeToHandbookChanges(userId, () => {
      checkUserHandbook();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [userId, checkUserHandbook]);

  return {
    handbookExists,
    loading,
    error,
    refreshHandbook,
  };
}; 