export interface User {
  id: string;
  name: string;
  email: string;
  nationalId: string;
  phone: string;
  role: 'voter' | 'admin';
  isApproved: boolean;
  hasVoted: boolean;
  createdAt: string;
}

export interface Candidate {
  id: string;
  name: string;
  party: string;
  photo: string;
  bio: string;
  electionId: string;
  voteCount: number;
}

export interface Election {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'active' | 'completed';
  totalVotes: number;
  candidates: Candidate[];
}

export interface Vote {
  id: string;
  hash: string;
  electionId: string;
  candidateId: string;
  voterHash: string;
  blockNumber: number;
  timestamp: string;
  status: 'pending' | 'confirmed' | 'rejected';
}

export interface BlockchainTransaction {
  hash: string;
  blockNumber: number;
  timestamp: string;
  type: 'vote' | 'election_created' | 'candidate_added';
  data: Record<string, unknown>;
  confirmations: number;
}

export interface DashboardStats {
  totalVoters: number;
  approvedVoters: number;
  pendingVoters: number;
  activeElections: number;
  totalVotesCast: number;
  blockchainHeight: number;
}
