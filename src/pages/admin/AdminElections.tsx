import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useElectionsWithCandidates, ElectionWithCandidates } from '@/hooks/useElections';
import { useCreateElection, useUpdateElectionStatus, useDeleteElection, useSendResultsNotification } from '@/hooks/useAdminData';
import { Plus, Edit, Trash2, Play, Pause, Calendar, Users, Vote, Loader2, CheckCircle, Download, FileText, FileSpreadsheet, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { generateElectionResultsPDF, generateElectionResultsCSV, downloadCSV, ElectionResultData } from '@/lib/pdfUtils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useRealtimeElections } from '@/hooks/useRealtimeElection';

const statusConfig = {
  upcoming: { label: 'Upcoming', color: 'bg-warning/10 text-warning border-warning/20' },
  active: { label: 'Active', color: 'bg-success/10 text-success border-success/20' },
  completed: { label: 'Completed', color: 'bg-muted text-muted-foreground border-border' },
};

export default function AdminElections() {
  const navigate = useNavigate();
  const { data: elections, isLoading } = useElectionsWithCandidates();
  const createElection = useCreateElection();
  const updateStatus = useUpdateElectionStatus();
  const deleteElection = useDeleteElection();
  const sendResultsNotification = useSendResultsNotification();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [resendDialogOpen, setResendDialogOpen] = useState(false);
  const [electionToResend, setElectionToResend] = useState<{ id: string; title: string } | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [electionToComplete, setElectionToComplete] = useState<string | null>(null);
  const [sendNotification, setSendNotification] = useState(true);
  const [electionToDelete, setElectionToDelete] = useState<string | null>(null);
  const [newElection, setNewElection] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
  });

  // Enable realtime updates
  useRealtimeElections();

  const handleCreate = async () => {
    if (!newElection.title || !newElection.startDate || !newElection.endDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await createElection.mutateAsync({
        title: newElection.title,
        description: newElection.description,
        startDate: new Date(newElection.startDate).toISOString(),
        endDate: new Date(newElection.endDate).toISOString(),
      });
      setIsCreateOpen(false);
      setNewElection({ title: '', description: '', startDate: '', endDate: '' });
      toast.success('Election created successfully');
    } catch (error) {
      toast.error('Failed to create election');
    }
  };

  const toggleStatus = async (election: ElectionWithCandidates) => {
    const newStatus = election.status === 'active' ? 'upcoming' : 'active';
    try {
      await updateStatus.mutateAsync({ electionId: election.id, status: newStatus });
      toast.success(`Election ${newStatus === 'active' ? 'started' : 'paused'}`);
    } catch (error) {
      toast.error('Failed to update election status');
    }
  };

  const handleCompleteElection = async () => {
    if (!electionToComplete) return;
    try {
      await updateStatus.mutateAsync({ 
        electionId: electionToComplete, 
        status: 'completed',
        sendNotification 
      });
      toast.success(sendNotification 
        ? 'Election completed and notifications sent' 
        : 'Election marked as completed');
      setCompleteDialogOpen(false);
      setElectionToComplete(null);
    } catch (error) {
      toast.error('Failed to complete election');
    }
  };

  const handleResendNotification = async () => {
    if (!electionToResend) return;
    setIsResending(true);
    try {
      const result = await sendResultsNotification.mutateAsync({
        electionId: electionToResend.id,
        electionTitle: electionToResend.title,
      });
      toast.success(`Notifications sent to ${result.sent} voters`);
      setResendDialogOpen(false);
      setElectionToResend(null);
    } catch (error) {
      toast.error('Failed to send notifications');
    } finally {
      setIsResending(false);
    }
  };

  const handleDelete = async () => {
    if (!electionToDelete) return;
    try {
      await deleteElection.mutateAsync(electionToDelete);
      toast.success('Election deleted');
      setDeleteDialogOpen(false);
      setElectionToDelete(null);
    } catch (error) {
      toast.error('Failed to delete election');
    }
  };

  const getElectionResultData = (election: ElectionWithCandidates): ElectionResultData => {
    const candidates = election.candidates || [];
    const totalVotes = candidates.reduce((sum, c) => sum + (c.vote_count || 0), 0);
    
    return {
      electionTitle: election.title,
      electionDescription: election.description || '',
      startDate: election.start_date,
      endDate: election.end_date,
      status: election.status,
      totalVotes: totalVotes,
      candidates: candidates.map(c => ({
        name: c.name,
        party: c.party,
        voteCount: c.vote_count || 0,
        percentage: totalVotes > 0 ? ((c.vote_count || 0) / totalVotes) * 100 : 0,
      })),
    };
  };

  const exportToPDF = (election: ElectionWithCandidates) => {
    const data = getElectionResultData(election);
    const pdf = generateElectionResultsPDF(data);
    pdf.save(`election-results-${election.title.toLowerCase().replace(/\s+/g, '-')}.pdf`);
    toast.success('Election results exported to PDF');
  };

  const exportToCSV = (election: ElectionWithCandidates) => {
    const data = getElectionResultData(election);
    const csv = generateElectionResultsCSV(data);
    downloadCSV(csv, `election-results-${election.title.toLowerCase().replace(/\s+/g, '-')}.csv`);
    toast.success('Election results exported to CSV');
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
            <h1 className="text-2xl font-bold">Elections</h1>
            <p className="text-muted-foreground">Manage all elections in the system</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Election
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Election</DialogTitle>
                <DialogDescription>
                  Fill in the details to create a new election
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newElection.title}
                    onChange={(e) => setNewElection({ ...newElection, title: e.target.value })}
                    placeholder="Election title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newElection.description}
                    onChange={(e) => setNewElection({ ...newElection, description: e.target.value })}
                    placeholder="Election description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="datetime-local"
                      value={newElection.startDate}
                      onChange={(e) => setNewElection({ ...newElection, startDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="datetime-local"
                      value={newElection.endDate}
                      onChange={(e) => setNewElection({ ...newElection, endDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={createElection.isPending}>
                  {createElection.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Election
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Elections Table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Election</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Duration</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Votes</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Export</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {elections?.map((election) => {
                const config = statusConfig[election.status as keyof typeof statusConfig] || statusConfig.upcoming;
                return (
                  <tr key={election.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium">{election.title}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1">{election.description}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={config.color}>{config.label}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {format(new Date(election.start_date), 'MMM d')} - {format(new Date(election.end_date), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Vote className="h-4 w-4 text-muted-foreground" />
                        {election.total_votes.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => exportToPDF(election)}
                          title="Export to PDF"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => exportToCSV(election)}
                          title="Export to CSV"
                        >
                          <FileSpreadsheet className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {election.status !== 'completed' && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleStatus(election)}
                              disabled={updateStatus.isPending}
                              title={election.status === 'active' ? 'Pause' : 'Start'}
                            >
                              {election.status === 'active' ? (
                                <Pause className="h-4 w-4" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                            </Button>
                            {election.status === 'active' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setElectionToComplete(election.id);
                                  setCompleteDialogOpen(true);
                                }}
                                disabled={updateStatus.isPending}
                                title="Complete Election"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                          </>
                        )}
                        {election.status === 'completed' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setElectionToResend({ id: election.id, title: election.title });
                              setResendDialogOpen(true);
                            }}
                            title="Resend Results Notification"
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/admin/candidates?election=${election.id}`)}
                        >
                          <Users className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => {
                            setElectionToDelete(election.id);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {(!elections || elections.length === 0) && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No elections found. Create one to get started.</p>
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Election</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this election? This action cannot be undone.
              All candidates and votes associated with this election will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Complete Election</AlertDialogTitle>
            <AlertDialogDescription>
              Mark this election as completed. This will finalize the results.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={sendNotification}
                onChange={(e) => setSendNotification(e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Send results notification to all voters</span>
              </div>
            </label>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleCompleteElection}>
              Complete Election
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={resendDialogOpen} onOpenChange={setResendDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resend Results Notification</AlertDialogTitle>
            <AlertDialogDescription>
              Send the election results for "{electionToResend?.title}" to all approved voters via email.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isResending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleResendNotification} disabled={isResending}>
              {isResending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Notifications
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
