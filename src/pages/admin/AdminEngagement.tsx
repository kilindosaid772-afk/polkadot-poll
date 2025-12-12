import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, eachDayOfInterval, startOfDay, endOfDay } from 'date-fns';
import { 
  TrendingUp, Users, Vote, Calendar, 
  BarChart3, PieChart as PieChartIcon, Loader2, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useElections } from '@/hooks/useElections';
import { useApprovedVoterCount } from '@/hooks/useVoterCount';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface Vote {
  id: string;
  created_at: string;
  election_id: string;
  voter_id: string;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))', 'hsl(var(--muted))'];

export default function AdminEngagement() {
  const [timeRange, setTimeRange] = useState<string>('30');
  const [selectedElection, setSelectedElection] = useState<string>('all');

  const { data: elections, isLoading: electionsLoading } = useElections();
  const { data: voterCount } = useApprovedVoterCount();

  // Fetch all votes for analytics
  const { data: votes, isLoading: votesLoading } = useQuery({
    queryKey: ['votes-analytics', timeRange],
    queryFn: async () => {
      const startDate = subDays(new Date(), parseInt(timeRange));
      const { data, error } = await supabase
        .from('votes')
        .select('id, created_at, election_id, voter_id')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as Vote[];
    },
  });

  // Fetch voter profiles for demographics
  const { data: profiles, isLoading: profilesLoading } = useQuery({
    queryKey: ['voter-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, created_at, is_approved, has_voted');

      if (error) throw error;
      return data;
    },
  });

  const isLoading = electionsLoading || votesLoading || profilesLoading;

  // Calculate daily vote trends
  const getDailyTrends = () => {
    if (!votes) return [];
    
    const days = parseInt(timeRange);
    const dateInterval = eachDayOfInterval({
      start: subDays(new Date(), days - 1),
      end: new Date(),
    });

    return dateInterval.map(date => {
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);
      
      const dayVotes = votes.filter(v => {
        const voteDate = new Date(v.created_at);
        return voteDate >= dayStart && voteDate <= dayEnd &&
          (selectedElection === 'all' || v.election_id === selectedElection);
      });

      return {
        date: format(date, 'MMM d'),
        votes: dayVotes.length,
        cumulative: 0, // Will be calculated below
      };
    });
  };

  const dailyTrends = getDailyTrends();
  
  // Calculate cumulative votes
  let cumulative = 0;
  dailyTrends.forEach(day => {
    cumulative += day.votes;
    day.cumulative = cumulative;
  });

  // Calculate election-wise turnout
  const getElectionTurnout = () => {
    if (!elections || !voterCount) return [];
    
    return elections.map(election => ({
      name: election.title.length > 20 ? election.title.substring(0, 17) + '...' : election.title,
      fullName: election.title,
      votes: election.total_votes,
      turnout: voterCount > 0 ? ((election.total_votes / voterCount) * 100).toFixed(1) : 0,
      status: election.status,
    }));
  };

  // Calculate voter engagement by status
  const getVoterEngagement = () => {
    if (!profiles) return [];
    
    const voted = profiles.filter(p => p.has_voted).length;
    const notVoted = profiles.filter(p => p.is_approved && !p.has_voted).length;
    const pending = profiles.filter(p => !p.is_approved).length;

    return [
      { name: 'Voted', value: voted, color: 'hsl(var(--success))' },
      { name: 'Not Voted', value: notVoted, color: 'hsl(var(--warning))' },
      { name: 'Pending Approval', value: pending, color: 'hsl(var(--muted))' },
    ];
  };

  // Calculate hourly distribution
  const getHourlyDistribution = () => {
    if (!votes) return [];
    
    const filteredVotes = selectedElection === 'all' 
      ? votes 
      : votes.filter(v => v.election_id === selectedElection);

    const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
      hour: `${hour.toString().padStart(2, '0')}:00`,
      votes: filteredVotes.filter(v => new Date(v.created_at).getHours() === hour).length,
    }));

    return hourlyData;
  };

  // Calculate key metrics
  const totalVotes = votes?.filter(v => selectedElection === 'all' || v.election_id === selectedElection).length || 0;
  const avgDailyVotes = dailyTrends.length > 0 ? (totalVotes / dailyTrends.length).toFixed(1) : 0;
  const peakDay = dailyTrends.reduce((max, day) => day.votes > max.votes ? day : max, { date: '-', votes: 0 });
  
  // Trend calculation
  const recentDays = dailyTrends.slice(-7);
  const previousDays = dailyTrends.slice(-14, -7);
  const recentAvg = recentDays.reduce((sum, d) => sum + d.votes, 0) / Math.max(recentDays.length, 1);
  const previousAvg = previousDays.reduce((sum, d) => sum + d.votes, 0) / Math.max(previousDays.length, 1);
  const trendPercent = previousAvg > 0 ? ((recentAvg - previousAvg) / previousAvg * 100).toFixed(1) : 0;
  const trendUp = Number(trendPercent) >= 0;

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Voter Engagement Analytics</h1>
            <p className="text-muted-foreground">Turnout trends and demographic insights</p>
          </div>
          <div className="flex gap-3">
            <Select value={selectedElection} onValueChange={setSelectedElection}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select Election" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Elections</SelectItem>
                {elections?.map(election => (
                  <SelectItem key={election.id} value={election.id}>{election.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[150px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 Days</SelectItem>
                <SelectItem value="14">Last 14 Days</SelectItem>
                <SelectItem value="30">Last 30 Days</SelectItem>
                <SelectItem value="90">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Vote className="h-5 w-5 text-primary" />
              </div>
              <Badge variant={trendUp ? 'default' : 'secondary'} className="text-xs">
                {trendUp ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                {trendPercent}%
              </Badge>
            </div>
            <p className="text-3xl font-bold mt-3">{totalVotes.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Total Votes Cast</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
            </div>
            <p className="text-3xl font-bold mt-3">{avgDailyVotes}</p>
            <p className="text-sm text-muted-foreground">Avg. Daily Votes</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-warning" />
              </div>
            </div>
            <p className="text-3xl font-bold mt-3">{peakDay.votes}</p>
            <p className="text-sm text-muted-foreground">Peak Day ({peakDay.date})</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
            <p className="text-3xl font-bold mt-3">
              {voterCount && voterCount > 0 ? ((totalVotes / voterCount) * 100).toFixed(1) : 0}%
            </p>
            <p className="text-sm text-muted-foreground">Overall Turnout</p>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Daily Trends */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Daily Vote Trends
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyTrends}>
                  <defs>
                    <linearGradient id="colorVotes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="votes" 
                    stroke="hsl(var(--primary))" 
                    fillOpacity={1} 
                    fill="url(#colorVotes)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Cumulative Growth */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Cumulative Vote Growth
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyTrends}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="cumulative" 
                    stroke="hsl(var(--success))" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Voter Engagement Pie */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <PieChartIcon className="h-4 w-4" />
              Voter Status Distribution
            </h3>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={getVoterEngagement()}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {getVoterEngagement().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Election Turnout */}
          <div className="rounded-xl border border-border bg-card p-6 lg:col-span-2">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Vote className="h-4 w-4" />
              Election Turnout Comparison
            </h3>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getElectionTurnout()} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    className="text-xs" 
                    tick={{ fill: 'hsl(var(--muted-foreground))' }} 
                    width={120}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number, name: string) => [
                      name === 'turnout' ? `${value}%` : value,
                      name === 'turnout' ? 'Turnout' : 'Votes'
                    ]}
                  />
                  <Bar dataKey="votes" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Hourly Distribution */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Voting Activity by Hour of Day
          </h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getHourlyDistribution()}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="hour" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="votes" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}