import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useVoters, useApproveVoter, useRejectVoter } from '@/hooks/useAdminData';
import { Search, CheckCircle, XCircle, Clock, Mail, Phone, Download, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function AdminVoters() {
  const { data: voters, isLoading } = useVoters();
  const approveVoter = useApproveVoter();
  const rejectVoter = useRejectVoter();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const handleApprove = async (userId: string) => {
    try {
      await approveVoter.mutateAsync(userId);
      toast.success('Voter approved successfully');
    } catch (error) {
      toast.error('Failed to approve voter');
    }
  };

  const handleReject = async (userId: string) => {
    try {
      await rejectVoter.mutateAsync(userId);
      toast.success('Voter registration rejected');
    } catch (error) {
      toast.error('Failed to reject voter');
    }
  };

  const filteredVoters = (voters || []).filter(voter => {
    const matchesSearch = voter.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      voter.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      voter.national_id.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filter === 'all') return matchesSearch;
    if (filter === 'pending') return matchesSearch && !voter.is_approved;
    if (filter === 'approved') return matchesSearch && voter.is_approved;
    if (filter === 'voted') return matchesSearch && voter.has_voted;
    return matchesSearch;
  });

  const stats = {
    total: voters?.length || 0,
    approved: voters?.filter(v => v.is_approved).length || 0,
    pending: voters?.filter(v => !v.is_approved).length || 0,
    voted: voters?.filter(v => v.has_voted).length || 0,
  };

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Voter Management</h1>
            <p className="text-muted-foreground">Approve and manage registered voters</p>
          </div>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Total Voters</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="rounded-xl border border-success/20 bg-success/5 p-4">
            <p className="text-sm text-success">Approved</p>
            <p className="text-2xl font-bold text-success">{stats.approved}</p>
          </div>
          <div className="rounded-xl border border-warning/20 bg-warning/5 p-4">
            <p className="text-sm text-warning">Pending</p>
            <p className="text-2xl font-bold text-warning">{stats.pending}</p>
          </div>
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
            <p className="text-sm text-primary">Voted</p>
            <p className="text-2xl font-bold text-primary">{stats.voted}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Voters</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="voted">Has Voted</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Voters Table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Voter</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">National ID</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Contact</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Registered</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredVoters.map((voter) => (
                <tr key={voter.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {voter.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{voter.name}</p>
                        <p className="text-sm text-muted-foreground">{voter.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm">{voter.national_id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {voter.email}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {voter.phone || 'N/A'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(voter.created_at), 'MMM d, yyyy')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {voter.is_approved ? (
                        <Badge className="bg-success/10 text-success border-success/20">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Approved
                        </Badge>
                      ) : (
                        <Badge className="bg-warning/10 text-warning border-warning/20">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                      {voter.has_voted && (
                        <Badge className="bg-primary/10 text-primary border-primary/20">
                          Voted
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {!voter.is_approved && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-success hover:text-success hover:bg-success/10"
                            onClick={() => handleApprove(voter.user_id)}
                            disabled={approveVoter.isPending}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleReject(voter.user_id)}
                            disabled={rejectVoter.isPending}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredVoters.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No voters found matching your criteria</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
