import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { mockTransactions } from '@/lib/mock-data';
import { Download, Search, Filter, FileText, Vote, UserPlus, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';

const auditLogs = [
  {
    id: '1',
    action: 'ELECTION_CREATED',
    user: 'admin@election.gov',
    details: 'Created election: Presidential Election 2024',
    timestamp: '2024-11-01T00:00:00Z',
    ip: '192.168.1.1',
  },
  {
    id: '2',
    action: 'CANDIDATE_ADDED',
    user: 'admin@election.gov',
    details: 'Added candidate: Sarah Johnson to Presidential Election 2024',
    timestamp: '2024-11-01T01:00:00Z',
    ip: '192.168.1.1',
  },
  {
    id: '3',
    action: 'VOTER_APPROVED',
    user: 'admin@election.gov',
    details: 'Approved voter registration: John Doe (NID-2024-0001)',
    timestamp: '2024-11-15T10:30:00Z',
    ip: '192.168.1.1',
  },
  {
    id: '4',
    action: 'VOTE_CAST',
    user: 'voter_hash_abc123',
    details: 'Vote recorded on blockchain - Block #15847293',
    timestamp: '2024-11-15T14:30:00Z',
    ip: '10.0.0.45',
  },
  {
    id: '5',
    action: 'ELECTION_STARTED',
    user: 'admin@election.gov',
    details: 'Started election: Presidential Election 2024',
    timestamp: '2024-11-01T00:00:00Z',
    ip: '192.168.1.1',
  },
];

const actionConfig: Record<string, { icon: typeof Vote; color: string }> = {
  ELECTION_CREATED: { icon: Calendar, color: 'text-accent' },
  CANDIDATE_ADDED: { icon: UserPlus, color: 'text-success' },
  VOTER_APPROVED: { icon: UserPlus, color: 'text-primary' },
  VOTE_CAST: { icon: Vote, color: 'text-primary' },
  ELECTION_STARTED: { icon: Calendar, color: 'text-success' },
};

export default function AdminAudit() {
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  const exportAuditLog = () => {
    const data = JSON.stringify(auditLogs, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Audit Logs</h1>
            <p className="text-muted-foreground">Complete audit trail of all system activities</p>
          </div>
          <Button onClick={exportAuditLog}>
            <Download className="h-4 w-4 mr-2" />
            Export Full Log
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Total Events</p>
            <p className="text-2xl font-bold">{auditLogs.length}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Elections</p>
            <p className="text-2xl font-bold">{auditLogs.filter(l => l.action.includes('ELECTION')).length}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Votes</p>
            <p className="text-2xl font-bold">{auditLogs.filter(l => l.action === 'VOTE_CAST').length}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Admin Actions</p>
            <p className="text-2xl font-bold">{auditLogs.filter(l => l.user.includes('admin')).length}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search audit logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="ELECTION_CREATED">Election Created</SelectItem>
              <SelectItem value="ELECTION_STARTED">Election Started</SelectItem>
              <SelectItem value="CANDIDATE_ADDED">Candidate Added</SelectItem>
              <SelectItem value="VOTER_APPROVED">Voter Approved</SelectItem>
              <SelectItem value="VOTE_CAST">Vote Cast</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Audit Log Table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Timestamp</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Action</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">User</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Details</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredLogs.map((log) => {
                const config = actionConfig[log.action] || { icon: FileText, color: 'text-muted-foreground' };
                const Icon = config.icon;

                return (
                  <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(log.timestamp), 'MMM d, yyyy HH:mm:ss')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${config.color}`} />
                        <span className="text-sm font-medium">{log.action.replace(/_/g, ' ')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-mono">{log.user}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-muted-foreground">{log.details}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-mono text-muted-foreground">{log.ip}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Blockchain Transactions Reference */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-semibold mb-4">Blockchain Transactions Reference</h3>
          <p className="text-sm text-muted-foreground mb-4">
            All vote transactions are immutably recorded on the Polkadot blockchain. 
            View the transaction hashes below for verification.
          </p>
          <div className="space-y-2">
            {mockTransactions.slice(0, 5).map((tx) => (
              <div key={tx.hash} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="font-mono text-sm truncate flex-1 mr-4">{tx.hash}</span>
                <span className="text-xs text-muted-foreground">Block #{tx.blockNumber}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
