import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatsCard } from '@/components/shared/StatsCard';
import { TransactionCard } from '@/components/shared/TransactionCard';
import { mockDashboardStats, mockTransactions, mockElections, mockVoters } from '@/lib/mock-data';
import { Users, UserCheck, Vote, Box, Activity, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';

const votingData = [
  { time: '00:00', votes: 120 },
  { time: '04:00', votes: 89 },
  { time: '08:00', votes: 456 },
  { time: '12:00', votes: 892 },
  { time: '16:00', votes: 1234 },
  { time: '20:00', votes: 678 },
  { time: '24:00', votes: 234 },
];

const dailyStats = [
  { day: 'Mon', voters: 2400, votes: 1800 },
  { day: 'Tue', voters: 1398, votes: 1200 },
  { day: 'Wed', voters: 3800, votes: 3200 },
  { day: 'Thu', voters: 4908, votes: 4100 },
  { day: 'Fri', voters: 4800, votes: 4000 },
  { day: 'Sat', voters: 3800, votes: 3400 },
  { day: 'Sun', voters: 3490, votes: 2980 },
];

export default function AdminDashboard() {
  const stats = mockDashboardStats;
  const activeElection = mockElections.find(e => e.status === 'active');

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold">Dashboard Overview</h1>
          <p className="text-muted-foreground">Real-time election statistics and blockchain activity</p>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatsCard
            title="Total Voters"
            value={stats.totalVoters}
            icon={Users}
            variant="primary"
            trend={{ value: 12.5, isPositive: true }}
          />
          <StatsCard
            title="Approved"
            value={stats.approvedVoters}
            icon={UserCheck}
            variant="success"
          />
          <StatsCard
            title="Pending"
            value={stats.pendingVoters}
            icon={Users}
            variant="warning"
          />
          <StatsCard
            title="Active Elections"
            value={stats.activeElections}
            icon={Calendar}
            variant="accent"
          />
          <StatsCard
            title="Votes Cast"
            value={stats.totalVotesCast}
            icon={Vote}
            variant="primary"
          />
          <StatsCard
            title="Block Height"
            value={stats.blockchainHeight.toLocaleString()}
            icon={Box}
            variant="default"
          />
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Voting Activity */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold">Voting Activity</h3>
                <p className="text-sm text-muted-foreground">Votes cast over time today</p>
              </div>
              <Activity className="h-5 w-5 text-muted-foreground" />
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={votingData}>
                <defs>
                  <linearGradient id="colorVotes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Area type="monotone" dataKey="votes" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorVotes)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Weekly Stats */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold">Weekly Statistics</h3>
                <p className="text-sm text-muted-foreground">Registrations vs Votes</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dailyStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="voters" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Registrations" />
                <Bar dataKey="votes" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} name="Votes" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Active Election */}
          {activeElection && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-semibold mb-4">Active Election</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-lg font-medium">{activeElection.title}</p>
                  <p className="text-sm text-muted-foreground">{activeElection.candidates.length} candidates</p>
                </div>
                <div className="space-y-2">
                  {activeElection.candidates.slice(0, 3).map((candidate, index) => (
                    <div key={candidate.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img src={candidate.photo} alt={candidate.name} className="h-8 w-8 rounded-full object-cover" />
                        <span className="text-sm">{candidate.name}</span>
                      </div>
                      <span className="text-sm font-medium">{candidate.voteCount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-2 border-t border-border">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Votes</span>
                    <span className="font-medium">{activeElection.totalVotes.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pending Approvals */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="font-semibold mb-4">Pending Approvals</h3>
            <div className="space-y-3">
              {mockVoters.filter(v => !v.isApproved).slice(0, 4).map((voter) => (
                <div key={voter.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <div>
                    <p className="text-sm font-medium">{voter.name}</p>
                    <p className="text-xs text-muted-foreground">{voter.nationalId}</p>
                  </div>
                  <span className="px-2 py-1 rounded bg-warning/10 text-warning text-xs">Pending</span>
                </div>
              ))}
              {mockVoters.filter(v => !v.isApproved).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No pending approvals</p>
              )}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="font-semibold mb-4">Recent Transactions</h3>
            <div className="space-y-3">
              {mockTransactions.slice(0, 3).map((tx) => (
                <div key={tx.hash} className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-primary capitalize">{tx.type.replace('_', ' ')}</span>
                    <span className="text-xs text-muted-foreground">{tx.confirmations} conf</span>
                  </div>
                  <p className="font-mono text-xs truncate">{tx.hash}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
