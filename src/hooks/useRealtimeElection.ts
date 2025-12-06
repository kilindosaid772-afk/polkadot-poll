import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { ElectionWithCandidates } from './useElections';
import { Tables } from '@/integrations/supabase/types';

type Candidate = Tables<'candidates'>;
type Election = Tables<'elections'>;

export function useRealtimeElection(electionId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!electionId) return;

    console.log('Setting up realtime subscription for election:', electionId);

    // Subscribe to candidate vote changes
    const candidatesChannel = supabase
      .channel(`candidates-${electionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'candidates',
          filter: `election_id=eq.${electionId}`,
        },
        (payload) => {
          console.log('Candidate updated:', payload);
          // Optimistically update the cache
          queryClient.setQueryData(['election', electionId], (oldData: ElectionWithCandidates | undefined) => {
            if (!oldData) return oldData;
            
            const updatedCandidate = payload.new as Candidate;
            const updatedCandidates = oldData.candidates.map(c =>
              c.id === updatedCandidate.id ? updatedCandidate : c
            );
            
            return {
              ...oldData,
              candidates: updatedCandidates.sort((a, b) => b.vote_count - a.vote_count),
            };
          });
        }
      )
      .subscribe();

    // Subscribe to election changes (total_votes)
    const electionChannel = supabase
      .channel(`election-${electionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'elections',
          filter: `id=eq.${electionId}`,
        },
        (payload) => {
          console.log('Election updated:', payload);
          queryClient.setQueryData(['election', electionId], (oldData: ElectionWithCandidates | undefined) => {
            if (!oldData) return oldData;
            const updatedElection = payload.new as Election;
            return {
              ...oldData,
              total_votes: updatedElection.total_votes,
              status: updatedElection.status,
            };
          });
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up realtime subscriptions');
      supabase.removeChannel(candidatesChannel);
      supabase.removeChannel(electionChannel);
    };
  }, [electionId, queryClient]);
}

export function useRealtimeElections() {
  const queryClient = useQueryClient();

  useEffect(() => {
    console.log('Setting up realtime subscription for all elections');

    const channel = supabase
      .channel('all-elections')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'elections',
        },
        (payload) => {
          console.log('Elections changed:', payload);
          queryClient.invalidateQueries({ queryKey: ['elections'] });
          queryClient.invalidateQueries({ queryKey: ['activeElection'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'candidates',
        },
        (payload) => {
          console.log('Candidates changed:', payload);
          queryClient.invalidateQueries({ queryKey: ['elections'] });
          
          // Also update specific election query if we have the election_id
          const candidate = payload.new as Candidate;
          if (candidate?.election_id) {
            queryClient.invalidateQueries({ queryKey: ['election', candidate.election_id] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
