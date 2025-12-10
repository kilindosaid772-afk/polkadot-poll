import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useApprovedVoterCount() {
  return useQuery({
    queryKey: ['approvedVoterCount'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_approved', true);

      if (error) throw error;
      return count || 0;
    },
  });
}
