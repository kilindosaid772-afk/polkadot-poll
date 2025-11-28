import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { mockElections } from '@/lib/mock-data';
import { Election } from '@/types/election';
import { Plus, Edit, Trash2, Play, Pause, Calendar, Users, Vote } from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const statusConfig = {
  upcoming: { label: 'Upcoming', color: 'bg-warning/10 text-warning border-warning/20' },
  active: { label: 'Active', color: 'bg-success/10 text-success border-success/20' },
  completed: { label: 'Completed', color: 'bg-muted text-muted-foreground border-border' },
};

export default function AdminElections() {
  const [elections, setElections] = useState<Election[]>(mockElections);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newElection, setNewElection] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
  });

  const handleCreate = () => {
    if (!newElection.title || !newElection.startDate || !newElection.endDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    const election: Election = {
      id: String(elections.length + 1),
      title: newElection.title,
      description: newElection.description,
      startDate: new Date(newElection.startDate).toISOString(),
      endDate: new Date(newElection.endDate).toISOString(),
      status: 'upcoming',
      totalVotes: 0,
      candidates: [],
    };

    setElections([...elections, election]);
    setIsCreateOpen(false);
    setNewElection({ title: '', description: '', startDate: '', endDate: '' });
    toast.success('Election created successfully');
  };

  const toggleStatus = (id: string) => {
    setElections(elections.map(e => {
      if (e.id === id) {
        const newStatus = e.status === 'active' ? 'upcoming' : 'active';
        toast.success(`Election ${newStatus === 'active' ? 'started' : 'paused'}`);
        return { ...e, status: newStatus as Election['status'] };
      }
      return e;
    }));
  };

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
                <Button onClick={handleCreate}>Create Election</Button>
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
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Candidates</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Votes</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {elections.map((election) => {
                const config = statusConfig[election.status];
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
                          {format(new Date(election.startDate), 'MMM d')} - {format(new Date(election.endDate), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {election.candidates.length}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Vote className="h-4 w-4 text-muted-foreground" />
                        {election.totalVotes.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {election.status !== 'completed' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleStatus(election.id)}
                          >
                            {election.status === 'active' ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
