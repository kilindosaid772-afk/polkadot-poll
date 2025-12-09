import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

export type Profile = Tables<'profiles'>;

export function useVoters() {
  return useQuery({
    queryKey: ['voters'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Profile[];
    },
  });
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const [
        { count: totalVoters },
        { count: approvedVoters },
        { count: pendingVoters },
        { data: elections },
        { data: blockchainData },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_approved', true),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_approved', false),
        supabase.from('elections').select('status, total_votes'),
        supabase.from('blockchain_transactions').select('block_number').order('block_number', { ascending: false }).limit(1),
      ]);

      const activeElections = elections?.filter(e => e.status === 'active').length || 0;
      const totalVotesCast = elections?.reduce((sum, e) => sum + (e.total_votes || 0), 0) || 0;
      const blockchainHeight = blockchainData?.[0]?.block_number || 15847350;

      return {
        totalVoters: totalVoters || 0,
        approvedVoters: approvedVoters || 0,
        pendingVoters: pendingVoters || 0,
        activeElections,
        totalVotesCast,
        blockchainHeight,
      };
    },
  });
}

async function sendApprovalEmail(email: string, name: string, approved: boolean) {
  try {
    const response = await supabase.functions.invoke('send-approval-email', {
      body: { email, name, approved },
    });
    
    if (response.error) {
      console.error('Failed to send email:', response.error);
    } else {
      console.log('Approval email sent successfully');
    }
  } catch (error) {
    console.error('Error sending approval email:', error);
  }
}

export function useApproveVoter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      // Get the profile first for email
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email, name')
        .eq('user_id', userId)
        .single();

      if (profileError) throw profileError;

      const { error } = await supabase
        .from('profiles')
        .update({ is_approved: true })
        .eq('user_id', userId);

      if (error) throw error;

      // Send approval email in background
      if (profile) {
        sendApprovalEmail(profile.email, profile.name, true);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voters'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });
}

export function useRejectVoter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      // Get the profile first for email
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email, name')
        .eq('user_id', userId)
        .single();

      if (profileError) throw profileError;

      const { error } = await supabase
        .from('profiles')
        .update({ is_approved: false })
        .eq('user_id', userId);

      if (error) throw error;

      // Send rejection email in background
      if (profile) {
        sendApprovalEmail(profile.email, profile.name, false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voters'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });
}

export function useCreateElection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (election: {
      title: string;
      description: string;
      startDate: string;
      endDate: string;
    }) => {
      const { data, error } = await supabase
        .from('elections')
        .insert({
          title: election.title,
          description: election.description,
          start_date: election.startDate,
          end_date: election.endDate,
          status: 'upcoming',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['elections'] });
    },
  });
}

export function useAddCandidate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (candidate: {
      electionId: string;
      name: string;
      party: string;
      bio?: string;
      photo?: string;
    }) => {
      const { data, error } = await supabase
        .from('candidates')
        .insert({
          election_id: candidate.electionId,
          name: candidate.name,
          party: candidate.party,
          bio: candidate.bio || '',
          photo: candidate.photo || '',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['elections'] });
      queryClient.invalidateQueries({ queryKey: ['election', variables.electionId] });
    },
  });
}

export function useDeleteCandidate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (candidateId: string) => {
      const { error } = await supabase
        .from('candidates')
        .delete()
        .eq('id', candidateId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['elections'] });
    },
  });
}

export function useUpdateElectionStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ electionId, status, sendNotification }: { 
      electionId: string; 
      status: 'upcoming' | 'active' | 'completed';
      sendNotification?: boolean;
    }) => {
      // Get election title for notification
      const { data: election, error: electionError } = await supabase
        .from('elections')
        .select('title')
        .eq('id', electionId)
        .single();

      if (electionError) throw electionError;

      const { error } = await supabase
        .from('elections')
        .update({ status })
        .eq('id', electionId);

      if (error) throw error;

      // Send results notification if election is completed
      if (status === 'completed' && sendNotification && election) {
        try {
          const response = await supabase.functions.invoke('send-results-notification', {
            body: { electionId, electionTitle: election.title },
          });
          
          if (response.error) {
            console.error('Failed to send results notification:', response.error);
          } else {
            console.log('Results notification sent:', response.data);
          }
        } catch (notificationError) {
          console.error('Error sending results notification:', notificationError);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['elections'] });
      queryClient.invalidateQueries({ queryKey: ['activeElection'] });
    },
  });
}

export function useDeleteElection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (electionId: string) => {
      // First delete all candidates for this election
      const { error: candidatesError } = await supabase
        .from('candidates')
        .delete()
        .eq('election_id', electionId);

      if (candidatesError) throw candidatesError;

      // Then delete the election
      const { error } = await supabase
        .from('elections')
        .delete()
        .eq('id', electionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['elections'] });
    },
  });
}
