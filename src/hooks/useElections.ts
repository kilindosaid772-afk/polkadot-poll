import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

export type Election = Tables<'elections'>;
export type Candidate = Tables<'candidates'>;

export interface ElectionWithCandidates extends Election {
  candidates: Candidate[];
}

export function useElections() {
  return useQuery({
    queryKey: ['elections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('elections')
        .select('*')
        .order('start_date', { ascending: false });

      if (error) throw error;
      return data as Election[];
    },
  });
}

export function useElectionsWithCandidates() {
  return useQuery({
    queryKey: ['electionsWithCandidates'],
    queryFn: async () => {
      const { data: elections, error: electionsError } = await supabase
        .from('elections')
        .select('*')
        .order('start_date', { ascending: false });

      if (electionsError) throw electionsError;

      const { data: candidates, error: candidatesError } = await supabase
        .from('candidates')
        .select('*')
        .order('vote_count', { ascending: false });

      if (candidatesError) throw candidatesError;

      return elections.map(election => ({
        ...election,
        candidates: (candidates || []).filter(c => c.election_id === election.id),
      })) as ElectionWithCandidates[];
    },
  });
}

export function useElection(id: string) {
  return useQuery({
    queryKey: ['election', id],
    queryFn: async () => {
      const { data: election, error: electionError } = await supabase
        .from('elections')
        .select('*')
        .eq('id', id)
        .single();

      if (electionError) throw electionError;

      const { data: candidates, error: candidatesError } = await supabase
        .from('candidates')
        .select('*')
        .eq('election_id', id)
        .order('vote_count', { ascending: false });

      if (candidatesError) throw candidatesError;

      return {
        ...election,
        candidates: candidates || [],
      } as ElectionWithCandidates;
    },
    enabled: !!id,
  });
}

export function useActiveElection() {
  return useQuery({
    queryKey: ['activeElection'],
    queryFn: async () => {
      const { data: election, error: electionError } = await supabase
        .from('elections')
        .select('*')
        .eq('status', 'active')
        .maybeSingle();

      if (electionError) throw electionError;
      if (!election) return null;

      const { data: candidates, error: candidatesError } = await supabase
        .from('candidates')
        .select('*')
        .eq('election_id', election.id)
        .order('vote_count', { ascending: false });

      if (candidatesError) throw candidatesError;

      return {
        ...election,
        candidates: candidates || [],
      } as ElectionWithCandidates;
    },
  });
}
