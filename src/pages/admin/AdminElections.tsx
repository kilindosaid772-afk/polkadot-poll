import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useElections, Election } from '@/hooks/useElections';
import { useCreateElection, useUpdateElectionStatus, useDeleteElection } from '@/hooks/useAdminData';
import { Plus, Edit, Trash2, Play, Pause, Calendar, Users, Vote, Loader2, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
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
  const { data: elections, isLoading } = useElections();
  const createElection = useCreateElection();
  const updateStatus = useUpdateElectionStatus();
  const deleteElection = useDeleteElection();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
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

  const toggleStatus = async (election: Election) => {
    const newStatus = election.status === 'active' ? 'upcoming' : 'active';
    try {
      await updateStatus.mutateAsync({ electionId: election.id, status: newStatus });
      toast.success(`Election ${newStatus === 'active' ? 'started' : 'paused'}`);
    } catch (error) {
      toast.error('Failed to update election status');
    }
  };

  const completeElection = async (electionId: string) => {
    try {
      await updateStatus.mutateAsync({ electionId, status: 'completed' });
      toast.success('Election marked as completed');
    } catch (error) {
      toast.error('Failed to complete election');
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
                                onClick={() => completeElection(election.id)}
                                disabled={updateStatus.isPending}
                                title="Complete Election"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                          </>
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
    </AdminLayout>
  );
}
