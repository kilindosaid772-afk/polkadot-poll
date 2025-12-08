import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, TrendingUp, Clock, MapPin, Users, Vote, BarChart3 } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import { format, parseISO, startOfHour, eachHourOfInterval, subDays } from 'date-fns';

const CHART_COLORS = [
  'hsl(199 89% 48%)',
  'hsl(262 83% 58%)',
  'hsl(142 76% 36%)',
  'hsl(38 92% 50%)',
  'hsl(0 84% 60%)',
];

export default function AdminAnalytics() {
  const { data: votesData, isLoading: votesLoading } = useQuery({
    queryKey: ['admin-votes-analytics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('votes')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: electionsData } = useQuery({
    queryKey: ['admin-elections-analytics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('elections')
        .select('*, candidates(*)');
      if (error) throw error;
      return data;
    },
  });

  const { data: votersData } = useQuery({
    queryKey: ['admin-voters-analytics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');
      if (error) throw error;
      return data;
    },
  });

  // Calculate voting trends over time
  const votingTrends = () => {
    if (!votesData || votesData.length === 0) return [];
    
    const last7Days = subDays(new Date(), 7);
    const hourlyVotes: Record<string, number> = {};
    
    votesData.forEach(vote => {
      const date = parseISO(vote.created_at);
      const hourKey = format(startOfHour(date), 'yyyy-MM-dd HH:00');
      hourlyVotes[hourKey] = (hourlyVotes[hourKey] || 0) + 1;
    });

    // Group by day for the chart
    const dailyVotes: Record<string, number> = {};
    votesData.forEach(vote => {
      const date = format(parseISO(vote.created_at), 'MMM dd');
      dailyVotes[date] = (dailyVotes[date] || 0) + 1;
    });

    return Object.entries(dailyVotes).map(([date, count]) => ({
      date,
      votes: count,
    }));
  };

  // Calculate peak voting hours
  const peakVotingHours = () => {
    if (!votesData || votesData.length === 0) return [];
    
    const hourlyDistribution: Record<number, number> = {};
    
    for (let i = 0; i < 24; i++) {
      hourlyDistribution[i] = 0;
    }

    votesData.forEach(vote => {
      const hour = parseISO(vote.created_at).getHours();
      hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1;
    });

    return Object.entries(hourlyDistribution).map(([hour, count]) => ({
      hour: `${hour.toString().padStart(2, '0')}:00`,
      votes: count,
    }));
  };

  // Calculate votes per election
  const votesPerElection = () => {
    if (!electionsData) return [];
    
    return electionsData.map(election => ({
      name: election.title.length > 15 ? election.title.substring(0, 15) + '...' : election.title,
      votes: election.total_votes,
      status: election.status,
    }));
  };

  // Voter registration stats
  const voterStats = () => {
    if (!votersData) return { total: 0, approved: 0, pending: 0, voted: 0 };
    
    return {
      total: votersData.length,
      approved: votersData.filter(v => v.is_approved).length,
      pending: votersData.filter(v => !v.is_approved).length,
      voted: votersData.filter(v => v.has_voted).length,
    };
  };

  // Voter status pie chart data
  const voterStatusData = () => {
    const stats = voterStats();
    return [
      { name: 'Voted', value: stats.voted, color: CHART_COLORS[0] },
      { name: 'Approved (Not Voted)', value: stats.approved - stats.voted, color: CHART_COLORS[1] },
      { name: 'Pending Approval', value: stats.pending, color: CHART_COLORS[3] },
    ].filter(item => item.value > 0);
  };

  const stats = voterStats();

  if (votesLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Voter Analytics</h1>
          <p className="text-muted-foreground">Comprehensive voting statistics and trends</p>
        </div>

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Voters</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                {stats.approved} approved
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Votes Cast</CardTitle>
              <Vote className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{votesData?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                Across all elections
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Turnout Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.approved > 0 
                  ? ((stats.voted / stats.approved) * 100).toFixed(1)
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                Of approved voters
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Elections</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{electionsData?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                {electionsData?.filter(e => e.status === 'active').length || 0} active
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Voting Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Voting Trends
              </CardTitle>
              <CardDescription>Daily vote distribution over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {votingTrends().length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={votingTrends()}>
                      <defs>
                        <linearGradient id="voteGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(199 89% 48%)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(199 89% 48%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 33% 17%)" />
                      <XAxis 
                        dataKey="date" 
                        stroke="hsl(215 20% 55%)"
                        fontSize={12}
                      />
                      <YAxis 
                        stroke="hsl(215 20% 55%)"
                        fontSize={12}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(222 47% 10%)',
                          border: '1px solid hsl(217 33% 17%)',
                          borderRadius: '8px',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="votes"
                        stroke="hsl(199 89% 48%)"
                        strokeWidth={2}
                        fill="url(#voteGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No voting data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Peak Voting Hours */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-accent" />
                Peak Voting Hours
              </CardTitle>
              <CardDescription>Hourly distribution of votes (24h format)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {peakVotingHours().some(h => h.votes > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={peakVotingHours()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 33% 17%)" />
                      <XAxis 
                        dataKey="hour" 
                        stroke="hsl(215 20% 55%)"
                        fontSize={10}
                        interval={2}
                      />
                      <YAxis 
                        stroke="hsl(215 20% 55%)"
                        fontSize={12}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(222 47% 10%)',
                          border: '1px solid hsl(217 33% 17%)',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar 
                        dataKey="votes" 
                        fill="hsl(262 83% 58%)"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No voting data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Voter Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-success" />
                Voter Status Distribution
              </CardTitle>
              <CardDescription>Breakdown of voter participation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {voterStatusData().length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={voterStatusData()}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {voterStatusData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(222 47% 10%)',
                          border: '1px solid hsl(217 33% 17%)',
                          borderRadius: '8px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No voter data available
                  </div>
                )}
              </div>
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {voterStatusData().map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-muted-foreground">
                      {item.name}: {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Votes per Election */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Vote className="h-5 w-5 text-warning" />
                Votes per Election
              </CardTitle>
              <CardDescription>Total votes cast in each election</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {votesPerElection().length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={votesPerElection()} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 33% 17%)" />
                      <XAxis 
                        type="number"
                        stroke="hsl(215 20% 55%)"
                        fontSize={12}
                      />
                      <YAxis 
                        type="category"
                        dataKey="name"
                        stroke="hsl(215 20% 55%)"
                        fontSize={12}
                        width={100}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(222 47% 10%)',
                          border: '1px solid hsl(217 33% 17%)',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar 
                        dataKey="votes" 
                        fill="hsl(38 92% 50%)"
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No election data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
