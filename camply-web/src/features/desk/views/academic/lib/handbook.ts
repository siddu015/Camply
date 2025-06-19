import { supabase } from '@/lib/supabase';
import type { UserHandbook } from '@/types/database';

export const checkHandbookExists = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('user_handbooks')
      .select('handbook_id')
      .eq('user_id', userId)
      .in('processing_status', ['uploaded', 'processing', 'completed'])
      .limit(1);

    if (error) {
      console.error('Error checking handbook:', error);
      return false;
    }

    return data && data.length > 0;
  } catch (err) {
    console.error('Error checking handbook:', err);
    return false;
  }
};

export const getUserHandbook = async (userId: string): Promise<UserHandbook | null> => {
  try {
    const { data, error } = await supabase
      .from('user_handbooks')
      .select('*')
      .eq('user_id', userId)
      .in('processing_status', ['uploaded', 'processing', 'completed'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching handbook:', error);
      return null;
    }

    return data || null;
  } catch (err) {
    console.error('Error fetching handbook:', err);
    return null;
  }
};

export const getUserHandbooks = async (userId: string): Promise<UserHandbook[]> => {
  try {
    const { data, error } = await supabase
      .from('user_handbooks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching handbooks:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Error fetching handbooks:', err);
    return [];
  }
};

export const deleteHandbook = async (handbookId: string, userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('user_handbooks')
      .delete()
      .eq('handbook_id', handbookId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting handbook:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Error deleting handbook:', err);
    return false;
  }
};

export const subscribeToHandbookChanges = (
  userId: string,
  callback: () => void
) => {
  return supabase
    .channel(`handbook-updates-${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_handbooks',
        filter: `user_id=eq.${userId}`,
      },
      callback
    )
    .subscribe();
}; 