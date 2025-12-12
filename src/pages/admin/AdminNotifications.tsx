import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { 
  Mail, CheckCircle, XCircle, Search, Filter, 
  Calendar, Users, Bell, MessageSquare, Loader2, Download
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useElections } from '@/hooks/useElections';

interface NotificationLog {
  id: string;
  election_id: string;
  recipient_email: string;
  recipient_name: string | null;
  notification_type: string;
  status: string;
  sent_at: string;
  error_message: string | null;
}

export default function AdminNotifications() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [electionFilter, setElectionFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');

  const { data: elections } = useElections();

  const { data: logs, isLoading } = useQuery({
    queryKey: ['all-notification-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notification_logs')
        .select('*')
        .order('sent_at', { ascending: false });

      if (error) throw error;
      return data as NotificationLog[];
    },
  });

  // Filter logs based on all criteria
  const filteredLogs = logs?.filter(log => {
    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        log.recipient_email.toLowerCase().includes(searchLower) ||
        (log.recipient_name?.toLowerCase().includes(searchLower) ?? false);
      if (!matchesSearch) return false;
    }

    // Status filter
    if (statusFilter !== 'all' && log.status !== statusFilter) return false;

    // Type filter
    if (typeFilter !== 'all' && log.notification_type !== typeFilter) return false;

    // Election filter
    if (electionFilter !== 'all' && log.election_id !== electionFilter) return false;

    // Date range filter
    if (dateRange !== 'all') {
      const sentDate = new Date(log.sent_at);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - sentDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (dateRange === 'today' && daysDiff > 0) return false;
      if (dateRange === 'week' && daysDiff > 7) return false;
      if (dateRange === 'month' && daysDiff > 30) return false;
    }

    return true;
  }) || [];

  const successCount = filteredLogs.filter(l => l.status === 'sent').length;
  const failedCount = filteredLogs.filter(l => l.status === 'failed').length;

  // Get unique notification types
  const notificationTypes = [...new Set(logs?.map(l => l.notification_type) || [])];

  const exportToCSV = () => {
    const headers = ['Recipient Name', 'Email', 'Type', 'Status', 'Sent At', 'Error'];
    const rows = filteredLogs.map(log => [
      log.recipient_name || 'Unknown',
      log.recipient_email,
      log.notification_type,
      log.status,
      format(new Date(log.sent_at), 'yyyy-MM-dd HH:mm:ss'),
      log.error_message || '',
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notification-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const getElectionTitle = (electionId: string) => {
    return elections?.find(e => e.id === electionId)?.title || 'Unknown Election';
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Notification History</h1>
            <p className="text-muted-foreground">View and filter all sent notifications</p>
          </div>
          <Button variant="outline" onClick={exportToCSV} disabled={filteredLogs.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid sm:grid-cols-4 gap-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{filteredLogs.length}</p>
                <p className="text-sm text-muted-foreground">Total Notifications</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{successCount}</p>
                <p className="text-sm text-muted-foreground">Sent Successfully</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{failedCount}</p>
                <p className="text-sm text-muted-foreground">Failed</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {new Set(filteredLogs.map(l => l.recipient_email)).size}
                </p>
                <p className="text-sm text-muted-foreground">Unique Recipients</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Filters</span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {notificationTypes.map(type => (
                  <SelectItem key={type} value={type} className="capitalize">{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={electionFilter} onValueChange={setElectionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Election" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Elections</SelectItem>
                {elections?.map(election => (
                  <SelectItem key={election.id} value={election.id}>{election.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredLogs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Election</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent At</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{log.recipient_name || 'Unknown'}</p>
                        <p className="text-sm text-muted-foreground">{log.recipient_email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {getElectionTitle(log.election_id)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {log.notification_type.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {log.recipient_email.includes('@') ? (
                          <>
                            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm">Email</span>
                          </>
                        ) : (
                          <>
                            <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm">SMS</span>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {log.status === 'sent' ? (
                        <Badge className="bg-success/10 text-success border-success/20">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Sent
                        </Badge>
                      ) : (
                        <Badge className="bg-destructive/10 text-destructive border-destructive/20">
                          <XCircle className="h-3 w-3 mr-1" />
                          Failed
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(log.sent_at), 'MMM d, yyyy h:mm a')}
                    </TableCell>
                    <TableCell className="text-sm text-destructive max-w-[200px] truncate">
                      {log.error_message || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-20 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No notifications found</p>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}