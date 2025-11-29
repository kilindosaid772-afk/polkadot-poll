import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';

export type Vote = Tables<'votes'>;
export type BlockchainTransaction = Tables<'blockchain_transactions'>;

export function useUserVotes() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['userVotes', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('votes')
        .select('*')
        .eq('voter_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Vote[];
    },
    enabled: !!user,
  });
}

export function useBlockchainTransactions() {
  return useQuery({
    queryKey: ['blockchainTransactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blockchain_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as BlockchainTransaction[];
    },
  });
}

export function useVerifyVote(txHash: string) {
  return useQuery({
    queryKey: ['verifyVote', txHash],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blockchain_transactions')
        .select('*')
        .eq('tx_hash', txHash)
        .maybeSingle();

      if (error) throw error;
      return data as BlockchainTransaction | null;
    },
    enabled: !!txHash,
  });
}

function generateVoteHash(): string {
  const chars = '0123456789abcdef';
  let hash = '0x';
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
}

function generateVoterHash(): string {
  const chars = '0123456789abcdef';
  let hash = '0x';
  for (let i = 0; i < 12; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
}

export function useCastVote() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ electionId, candidateId }: { electionId: string; candidateId: string }) => {
      if (!user) throw new Error('Must be logged in to vote');

      const txHash = generateVoteHash();
      const voterHash = generateVoterHash();
      const blockNumber = Math.floor(15847000 + Math.random() * 1000);

      // Insert vote
      const { error: voteError } = await supabase
        .from('votes')
        .insert({
          election_id: electionId,
          candidate_id: candidateId,
          voter_id: user.id,
          voter_hash: voterHash,
          tx_hash: txHash,
          block_number: blockNumber,
          status: 'confirmed',
        });

      if (voteError) {
        if (voteError.code === '23505') {
          throw new Error('You have already voted in this election');
        }
        throw voteError;
      }

      // Insert blockchain transaction
      const { error: txError } = await supabase
        .from('blockchain_transactions')
        .insert({
          tx_hash: txHash,
          block_number: blockNumber,
          tx_type: 'vote',
          data: { candidateId, electionId },
          confirmations: Math.floor(Math.random() * 100) + 1,
        });

      if (txError) throw txError;

      // Update candidate vote count manually
      const { data: candidate } = await supabase
        .from('candidates')
        .select('vote_count')
        .eq('id', candidateId)
        .single();

      if (candidate) {
        await supabase
          .from('candidates')
          .update({ vote_count: (candidate.vote_count || 0) + 1 })
          .eq('id', candidateId);
      }

      // Update election total votes
      const { data: election } = await supabase
        .from('elections')
        .select('total_votes')
        .eq('id', electionId)
        .single();

      if (election) {
        await supabase
          .from('elections')
          .update({ total_votes: (election.total_votes || 0) + 1 })
          .eq('id', electionId);
      }

      // Update profile has_voted
      await supabase
        .from('profiles')
        .update({ has_voted: true })
        .eq('user_id', user.id);

      return { txHash, blockNumber };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userVotes'] });
      queryClient.invalidateQueries({ queryKey: ['elections'] });
      queryClient.invalidateQueries({ queryKey: ['activeElection'] });
      queryClient.invalidateQueries({ queryKey: ['blockchainTransactions'] });
    },
  });
}
