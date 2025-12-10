import { useState, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useElectionsWithCandidates, ElectionWithCandidates } from '@/hooks/useElections';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend 
} from 'recharts';
import { GitCompare, Loader2, Trophy, Users, Vote, TrendingUp, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const COLORS = ['hsl(199, 89%, 48%)', 'hsl(262, 83%, 58%)', 'hsl(142, 76%, 36%)', 'hsl(38, 92%, 50%)', 'hsl(0, 84%, 60%)'];

export default function CompareElections() {
  const navigate = useNavigate();
  const { data: elections, isLoading } = useElectionsWithCandidates();
  const [selectedElections, setSelectedElections] = useState<string[]>([]);

  const completedElections = useMemo(() => {
    return elections?.filter(e => e.status === 'completed' || e.status === 'active') || [];
  }, [elections]);

  const selectedData = useMemo(() => {
    return completedElections.filter(e => selectedElections.includes(e.id));
  }, [completedElections, selectedElections]);

  const comparisonData = useMemo(() => {
    if (selectedData.length < 2) return [];

    return selectedData.map(election => {
      const totalVotes = election.candidates.reduce((sum, c) => sum + (c.vote_count || 0), 0);
      const winner = [...election.candidates].sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0))[0];
      
      return {
        name: election.title.length > 20 ? election.title.substring(0, 20) + '...' : election.title,
        fullTitle: election.title,
        totalVotes,
        candidateCount: election.candidates.length,
        winnerVotes: winner?.vote_count || 0,
        winnerName: winner?.name || 'N/A',
        winnerParty: winner?.party || 'N/A',
        winnerPercentage: totalVotes > 0 ? ((winner?.vote_count || 0) / totalVotes * 100).toFixed(1) : '0',
        status: election.status,
        date: format(new Date(election.end_date), 'MMM d, yyyy'),
      };
    });
  }, [selectedData]);

  const toggleElection = (electionId: string) => {
    setSelectedElections(prev => {
      if (prev.includes(electionId)) {
        return prev.filter(id => id !== electionId);
      }
      if (prev.length >= 4) {
        return prev;
      }
      return [...prev, electionId];
    });
  };

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

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-12">
        <div className="container">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="icon" onClick={() => navigate('/results')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">
                <span className="gradient-text">Compare Elections</span>
              </h1>
              <p className="text-muted-foreground">Select up to 4 elections to compare their results</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Election Selection */}
            <div className="lg:col-span-1">
              <div className="rounded-xl border border-border bg-card p-4">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <GitCompare className="h-4 w-4" />
                  Select Elections ({selectedElections.length}/4)
                </h3>
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {completedElections.map(election => (
                    <label
                      key={election.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedElections.includes(election.id)
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:bg-muted/50'
                      }`}
                    >
                      <Checkbox
                        checked={selectedElections.includes(election.id)}
                        onCheckedChange={() => toggleElection(election.id)}
                        disabled={!selectedElections.includes(election.id) && selectedElections.length >= 4}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{election.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {election.total_votes} votes
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(election.end_date), 'MMM yyyy')}
                          </span>
                        </div>
                      </div>
                    </label>
                  ))}
                  {completedElections.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No completed elections to compare
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Comparison Results */}
            <div className="lg:col-span-2 space-y-6">
              {selectedData.length < 2 ? (
                <div className="rounded-xl border border-border bg-card p-12 text-center">
                  <GitCompare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Select Elections to Compare</h3>
                  <p className="text-muted-foreground">
                    Choose at least 2 elections from the list to see the comparison
                  </p>
                </div>
              ) : (
                <>
                  {/* Vote Comparison Chart */}
                  <div className="rounded-xl border border-border bg-card p-6">
                    <h3 className="text-lg font-semibold mb-4">Total Votes Comparison</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={comparisonData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                        <YAxis stroke="hsl(var(--muted-foreground))" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                          formatter={(value: number, name: string) => [value.toLocaleString(), name]}
                        />
                        <Legend />
                        <Bar 
                          dataKey="totalVotes" 
                          name="Total Votes" 
                          fill="hsl(var(--primary))" 
                          radius={[4, 4, 0, 0]} 
                        />
                        <Bar 
                          dataKey="winnerVotes" 
                          name="Winner Votes" 
                          fill="hsl(var(--accent))" 
                          radius={[4, 4, 0, 0]} 
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Election Cards Comparison */}
                  <div className="grid md:grid-cols-2 gap-4">
                    {comparisonData.map((data, index) => (
                      <div 
                        key={data.fullTitle}
                        className="rounded-xl border border-border bg-card p-5"
                        style={{ borderLeftColor: COLORS[index % COLORS.length], borderLeftWidth: '4px' }}
                      >
                        <h4 className="font-semibold mb-3 truncate" title={data.fullTitle}>
                          {data.fullTitle}
                        </h4>
                        
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground flex items-center gap-2">
                              <Vote className="h-4 w-4" />
                              Total Votes
                            </span>
                            <span className="font-semibold">{data.totalVotes.toLocaleString()}</span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              Candidates
                            </span>
                            <span className="font-semibold">{data.candidateCount}</span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground flex items-center gap-2">
                              <Trophy className="h-4 w-4" />
                              Winner
                            </span>
                            <div className="text-right">
                              <p className="font-semibold">{data.winnerName}</p>
                              <p className="text-xs text-muted-foreground">
                                {data.winnerParty} • {data.winnerPercentage}%
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground flex items-center gap-2">
                              <TrendingUp className="h-4 w-4" />
                              Date
                            </span>
                            <span className="font-semibold">{data.date}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
