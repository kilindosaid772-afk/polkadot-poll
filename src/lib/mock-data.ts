import { User, Election, Candidate, Vote, BlockchainTransaction, DashboardStats } from '@/types/election';

export const mockCandidates: Candidate[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    party: 'Progressive Party',
    photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face',
    bio: 'Former Senator with 15 years of public service experience. Focused on education and healthcare reform.',
    electionId: '1',
    voteCount: 4523,
  },
  {
    id: '2',
    name: 'Michael Chen',
    party: 'Unity Alliance',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
    bio: 'Business leader and philanthropist. Committed to economic growth and environmental sustainability.',
    electionId: '1',
    voteCount: 3891,
  },
  {
    id: '3',
    name: 'Amara Okonkwo',
    party: 'Democratic Front',
    photo: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&h=200&fit=crop&crop=face',
    bio: 'Civil rights advocate and community organizer. Fighting for equality and social justice.',
    electionId: '1',
    voteCount: 3156,
  },
  {
    id: '4',
    name: 'David Martinez',
    party: 'Independent',
    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
    bio: 'Technology entrepreneur bringing innovation to governance. Focused on digital transformation.',
    electionId: '1',
    voteCount: 2234,
  },
];

export const mockElections: Election[] = [
  {
    id: '1',
    title: 'Presidential Election 2024',
    description: 'National presidential election to elect the next head of state for a 4-year term.',
    startDate: '2024-11-01T00:00:00Z',
    endDate: '2024-11-30T23:59:59Z',
    status: 'active',
    totalVotes: 13804,
    candidates: mockCandidates,
  },
  {
    id: '2',
    title: 'City Council Election',
    description: 'Local election to choose representatives for the city council.',
    startDate: '2024-12-01T00:00:00Z',
    endDate: '2024-12-15T23:59:59Z',
    status: 'upcoming',
    totalVotes: 0,
    candidates: [],
  },
  {
    id: '3',
    title: 'Student Union Elections',
    description: 'Annual student body elections for university governance.',
    startDate: '2024-09-01T00:00:00Z',
    endDate: '2024-09-15T23:59:59Z',
    status: 'completed',
    totalVotes: 8924,
    candidates: [],
  },
];

export const mockVoters: User[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@email.com',
    nationalId: 'NID-2024-0001',
    phone: '+1234567890',
    role: 'voter',
    isApproved: true,
    hasVoted: true,
    createdAt: '2024-10-15T10:30:00Z',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane.smith@email.com',
    nationalId: 'NID-2024-0002',
    phone: '+1234567891',
    role: 'voter',
    isApproved: true,
    hasVoted: false,
    createdAt: '2024-10-16T14:20:00Z',
  },
  {
    id: '3',
    name: 'Robert Wilson',
    email: 'robert.wilson@email.com',
    nationalId: 'NID-2024-0003',
    phone: '+1234567892',
    role: 'voter',
    isApproved: false,
    hasVoted: false,
    createdAt: '2024-10-20T09:15:00Z',
  },
];

export const mockVotes: Vote[] = [
  {
    id: '1',
    hash: '0x7f9e8d7c6b5a4938271605f4e3d2c1b0a9f8e7d6c5b4a3928170',
    electionId: '1',
    candidateId: '1',
    voterHash: '0xabc123def456',
    blockNumber: 15847293,
    timestamp: '2024-11-15T14:30:00Z',
    status: 'confirmed',
  },
  {
    id: '2',
    hash: '0x8a9b0c1d2e3f4051627384950a6b7c8d9e0f1a2b3c4d5e6f7',
    electionId: '1',
    candidateId: '2',
    voterHash: '0xdef789abc012',
    blockNumber: 15847294,
    timestamp: '2024-11-15T14:31:00Z',
    status: 'confirmed',
  },
];

export const mockTransactions: BlockchainTransaction[] = [
  {
    hash: '0x7f9e8d7c6b5a4938271605f4e3d2c1b0a9f8e7d6c5b4a3928170',
    blockNumber: 15847293,
    timestamp: '2024-11-15T14:30:00Z',
    type: 'vote',
    data: { candidateId: '1', electionId: '1' },
    confirmations: 156,
  },
  {
    hash: '0x8a9b0c1d2e3f4051627384950a6b7c8d9e0f1a2b3c4d5e6f7',
    blockNumber: 15847294,
    timestamp: '2024-11-15T14:31:00Z',
    type: 'vote',
    data: { candidateId: '2', electionId: '1' },
    confirmations: 155,
  },
  {
    hash: '0x1a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f70819',
    blockNumber: 15847200,
    timestamp: '2024-11-01T00:00:00Z',
    type: 'election_created',
    data: { electionId: '1', title: 'Presidential Election 2024' },
    confirmations: 249,
  },
];

export const mockDashboardStats: DashboardStats = {
  totalVoters: 25847,
  approvedVoters: 23156,
  pendingVoters: 2691,
  activeElections: 1,
  totalVotesCast: 13804,
  blockchainHeight: 15847350,
};

export function generateVoteHash(): string {
  const chars = '0123456789abcdef';
  let hash = '0x';
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
}

export function generateVoterHash(): string {
  const chars = '0123456789abcdef';
  let hash = '0x';
  for (let i = 0; i < 12; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
}
