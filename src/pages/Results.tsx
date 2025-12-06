import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { CandidateCard } from '@/components/shared/CandidateCard';
import { useElection, useElections } from '@/hooks/useElections';
import { useRealtimeElection } from '@/hooks/useRealtimeElection';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Trophy, Users, Vote, TrendingUp, Loader2, Radio } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const COLORS = ['hsl(199, 89%, 48%)', 'hsl(262, 83%, 58%)', 'hsl(142, 76%, 36%)', 'hsl(38, 92%, 50%)'];

export default function Results() {
  const { electionId } = useParams();
  const navigate = useNavigate();
  
  // If no electionId, get the most recent completed or active election
  const { data: elections } = useElections();
  const defaultElectionId = electionId || elections?.find(e => e.status === 'completed' || e.status === 'active')?.id;
  
  const { data: election, isLoading, error } = useElection(defaultElectionId || '');
  
  // Enable realtime updates for this election
  useRealtimeElection(defaultElectionId);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!election || error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">No Results Available</h1>
            <p className="text-muted-foreground mb-4">There are no election results to display.</p>
            <Button onClick={() => navigate('/elections')}>View Elections</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const chartData = election.candidates.map(c => ({
    name: c.name.split(' ')[1] || c.name,
    votes: c.vote_count,
    fullName: c.name,
    party: c.party,
  }));

  const pieData = election.candidates.map(c => ({
    name: c.name,
    value: c.vote_count,
  }));

  const sortedCandidates = [...election.candidates].sort((a, b) => b.vote_count - a.vote_count);
  const winner = sortedCandidates[0];
  const totalVotes = election.total_votes;

  if (!winner || election.candidates.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">No Candidates</h1>
            <p className="text-muted-foreground mb-4">This election has no candidates yet.</p>
            <Button onClick={() => navigate('/elections')}>View Elections</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-12">
        <div className="container">
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">
                <span className="gradient-text">Election Results</span>
              </h1>
              {election.status === 'active' && (
                <Badge className="bg-success/10 text-success border-success/20 animate-pulse">
                  <Radio className="h-3 w-3 mr-1" />
                  Live
                </Badge>
              )}
            </div>
            <p className="text-lg text-muted-foreground">{election.title}</p>
            {election.status === 'active' && (
              <p className="text-sm text-success mt-1">Results update in real-time as votes are cast</p>
            )}
          </div>

          {/* Winner Banner */}
          <div className="rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 p-8 mb-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative">
                <img 
                  src={winner.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(winner.name)}&background=random`} 
                  alt={winner.name}
                  className="h-24 w-24 rounded-full object-cover border-4 border-primary"
                />
                <div className="absolute -top-2 -right-2 h-10 w-10 rounded-full bg-warning flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-warning-foreground" />
                </div>
              </div>
              <div className="text-center md:text-left">
                <p className="text-sm text-primary font-medium mb-1">Leading Candidate</p>
                <h2 className="text-2xl font-bold">{winner.name}</h2>
                <p className="text-muted-foreground">{winner.party}</p>
                <p className="text-lg font-semibold mt-2">
                  {winner.vote_count.toLocaleString()} votes ({totalVotes > 0 ? ((winner.vote_count / totalVotes) * 100).toFixed(1) : 0}%)
                </p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Vote className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Votes</p>
                  <p className="text-lg font-bold">{totalVotes.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Candidates</p>
                  <p className="text-lg font-bold">{election.candidates.length}</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="text-lg font-bold capitalize">{election.status}</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Margin</p>
                  <p className="text-lg font-bold">
                    {sortedCandidates.length > 1 
                      ? (sortedCandidates[0].vote_count - sortedCandidates[1].vote_count).toLocaleString()
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          {totalVotes > 0 && (
            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="text-lg font-semibold mb-4">Vote Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number, name: string, props: any) => [
                        value.toLocaleString(),
                        props.payload.fullName
                      ]}
                    />
                    <Bar dataKey="votes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="text-lg font-semibold mb-4">Vote Share</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => [value.toLocaleString(), 'Votes']}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-4 mt-4">
                  {pieData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-2">
                      <div 
                        className="h-3 w-3 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm text-muted-foreground">{entry.name.split(' ')[1] || entry.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Candidate Cards */}
          <h3 className="text-xl font-semibold mb-4">All Candidates</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {sortedCandidates.map((candidate, index) => (
              <div key={candidate.id} className="relative">
                {index === 0 && totalVotes > 0 && (
                  <div className="absolute -top-2 -left-2 z-10 h-8 w-8 rounded-full bg-warning flex items-center justify-center">
                    <Trophy className="h-4 w-4 text-warning-foreground" />
                  </div>
                )}
                <CandidateCard 
                  candidate={candidate} 
                  showVotes 
                  totalVotes={totalVotes}
                />
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
