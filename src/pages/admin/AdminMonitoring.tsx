import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { CircularProgress } from '@/components/shared/CircularProgress';
import { StatsCard } from '@/components/shared/StatsCard';
import { useElections } from '@/hooks/useElections';
import { useApprovedVoterCount } from '@/hooks/useVoterCount';
import { useSendTurnoutAlert, useSendDeadlineReminder } from '@/hooks/useAdminData';
import { supabase } from '@/integrations/supabase/client';
import { 
  Activity, Users, Vote, Clock, AlertTriangle, Bell, 
  TrendingUp, TrendingDown, RefreshCw, Loader2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { formatDistanceToNow, differenceInHours } from 'date-fns';

interface TurnoutThreshold {
  level: 'critical' | 'warning' | 'healthy';
  min: number;
  max: number;
  color: string;
  label: string;
}

const thresholds: TurnoutThreshold[] = [
  { level: 'critical', min: 0, max: 25, color: 'text-destructive', label: 'Critical' },
  { level: 'warning', min: 25, max: 50, color: 'text-warning', label: 'Low' },
  { level: 'healthy', min: 50, max: 100, color: 'text-success', label: 'Healthy' },
];

export default function AdminMonitoring() {
  const { data: elections, isLoading: electionsLoading, refetch: refetchElections } = useElections();
  const { data: voterCount, isLoading: voterCountLoading } = useApprovedVoterCount();
  const sendTurnoutAlert = useSendTurnoutAlert();
  const sendDeadlineReminder = useSendDeadlineReminder();
  
  const [alertThreshold, setAlertThreshold] = useState(30);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const activeElections = elections?.filter(e => e.status === 'active') || [];

  // Subscribe to real-time vote updates
  useEffect(() => {
    const channel = supabase
      .channel('monitoring-votes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'votes',
        },
        (payload) => {
          console.log('Vote change detected:', payload);
          refetchElections();
          toast.info('New vote recorded', { duration: 2000 });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'elections',
        },
        (payload) => {
          console.log('Election updated:', payload);
          refetchElections();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetchElections]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetchElections();
    setIsRefreshing(false);
    toast.success('Data refreshed');
  };

  const getTurnoutLevel = (percent: number): TurnoutThreshold => {
    return thresholds.find(t => percent >= t.min && percent < t.max) || thresholds[2];
  };

  const handleSendAlert = async (election: any, turnoutPercent: number) => {
    try {
      await sendTurnoutAlert.mutateAsync({
        electionId: election.id,
        electionTitle: election.title,
        turnoutPercentage: turnoutPercent,
        threshold: alertThreshold,
      });
      toast.success('Turnout alert sent to administrators');
    } catch (error) {
      toast.error('Failed to send alert');
    }
  };

  const handleSendReminder = async (election: any, hoursRemaining: number) => {
    try {
      await sendDeadlineReminder.mutateAsync({
        electionId: election.id,
        electionTitle: election.title,
        endDate: election.end_date,
        hoursRemaining,
      });
      toast.success('Deadline reminders sent to voters');
    } catch (error) {
      toast.error('Failed to send reminders');
    }
  };

  const isLoading = electionsLoading || voterCountLoading;

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
            <h1 className="text-2xl font-bold">Real-Time Monitoring</h1>
            <p className="text-muted-foreground">Live voter turnout tracking with automatic alerts</p>
          </div>
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Overview Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Active Elections"
            value={activeElections.length}
            icon={Vote}
            variant="primary"
          />
          <StatsCard
            title="Registered Voters"
            value={voterCount || 0}
            icon={Users}
            variant="default"
          />
          <StatsCard
            title="Alert Threshold"
            value={`${alertThreshold}%`}
            icon={AlertTriangle}
            variant="warning"
          />
          <StatsCard
            title="Monitoring"
            value="Live"
            icon={Activity}
            variant="success"
          />
        </div>

        {/* Alert Threshold Setting */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-semibold mb-4">Automatic Alert Settings</h3>
          <div className="flex items-center gap-4">
            <label className="text-sm text-muted-foreground">
              Send automatic low turnout alerts when below:
            </label>
            <select
              value={alertThreshold}
              onChange={(e) => setAlertThreshold(Number(e.target.value))}
              className="px-3 py-2 rounded-lg border border-input bg-background text-sm"
            >
              <option value={20}>20%</option>
              <option value={25}>25%</option>
              <option value={30}>30%</option>
              <option value={40}>40%</option>
              <option value={50}>50%</option>
            </select>
            <Badge variant="outline" className="text-xs">
              <Bell className="h-3 w-3 mr-1" />
              Auto-alerts enabled
            </Badge>
          </div>
        </div>

        {/* Active Elections Monitoring */}
        {activeElections.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Active Elections</h3>
            <p className="text-muted-foreground">There are no active elections to monitor at this time.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {activeElections.map((election) => {
              const turnoutPercent = voterCount && voterCount > 0 
                ? (election.total_votes / voterCount) * 100 
                : 0;
              const turnoutLevel = getTurnoutLevel(turnoutPercent);
              const hoursRemaining = differenceInHours(new Date(election.end_date), new Date());
              const isUrgent = hoursRemaining <= 24;
              const isCritical = hoursRemaining <= 2;

              return (
                <div 
                  key={election.id} 
                  className={`rounded-xl border bg-card overflow-hidden ${
                    turnoutPercent < alertThreshold ? 'border-warning' : 'border-border'
                  }`}
                >
                  {/* Election Header */}
                  <div className="p-6 border-b border-border">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-xl font-semibold">{election.title}</h3>
                          <Badge variant={isCritical ? 'destructive' : isUrgent ? 'secondary' : 'outline'}>
                            {isCritical ? '🚨 Closing Soon' : isUrgent ? '⏰ < 24h left' : 'Active'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Ends {formatDistanceToNow(new Date(election.end_date), { addSuffix: true })}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSendReminder(election, hoursRemaining)}
                          disabled={sendDeadlineReminder.isPending}
                        >
                          <Bell className="h-4 w-4 mr-1" />
                          Send Reminders
                        </Button>
                        {turnoutPercent < alertThreshold && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleSendAlert(election, turnoutPercent)}
                            disabled={sendTurnoutAlert.isPending}
                          >
                            <AlertTriangle className="h-4 w-4 mr-1" />
                            Alert Admins
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Monitoring Content */}
                  <div className="p-6">
                    <div className="grid lg:grid-cols-3 gap-8">
                      {/* Turnout Progress */}
                      <div className="flex flex-col items-center justify-center">
                        <CircularProgress 
                          value={election.total_votes}
                          maxValue={voterCount || 1}
                          size={180}
                          strokeWidth={12}
                          label="Voter Turnout"
                        />
                        <div className="mt-4 text-center">
                          <Badge 
                            variant="outline" 
                            className={turnoutLevel.color}
                          >
                            {turnoutLevel.label} Turnout
                          </Badge>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="space-y-4">
                        <div className="p-4 rounded-lg bg-muted/50">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Votes Cast</span>
                            <Vote className="h-4 w-4 text-primary" />
                          </div>
                          <p className="text-2xl font-bold mt-1">{election.total_votes.toLocaleString()}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/50">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Eligible Voters</span>
                            <Users className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <p className="text-2xl font-bold mt-1">{(voterCount || 0).toLocaleString()}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/50">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Time Remaining</span>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <p className="text-2xl font-bold mt-1">{hoursRemaining}h</p>
                        </div>
                      </div>

                      {/* Threshold Indicators */}
                      <div className="space-y-3">
                        <h4 className="font-medium mb-3">Turnout Thresholds</h4>
                        {thresholds.map((threshold) => (
                          <div 
                            key={threshold.level}
                            className={`p-3 rounded-lg border ${
                              turnoutLevel.level === threshold.level 
                                ? 'border-primary bg-primary/5' 
                                : 'border-border'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {turnoutPercent >= threshold.min && turnoutPercent < threshold.max ? (
                                  <TrendingUp className={`h-4 w-4 ${threshold.color}`} />
                                ) : (
                                  <TrendingDown className="h-4 w-4 text-muted-foreground" />
                                )}
                                <span className={`text-sm font-medium ${
                                  turnoutLevel.level === threshold.level ? threshold.color : ''
                                }`}>
                                  {threshold.label}
                                </span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {threshold.min}% - {threshold.max}%
                              </span>
                            </div>
                          </div>
                        ))}

                        {turnoutPercent < alertThreshold && (
                          <div className="mt-4 p-3 rounded-lg bg-warning/10 border border-warning">
                            <div className="flex items-center gap-2 text-warning">
                              <AlertTriangle className="h-4 w-4" />
                              <span className="text-sm font-medium">Below Alert Threshold</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Automatic alerts will be sent to administrators.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
