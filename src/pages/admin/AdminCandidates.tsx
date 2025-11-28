import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { mockCandidates, mockElections } from '@/lib/mock-data';
import { Candidate } from '@/types/election';
import { Plus, Edit, Trash2, Vote } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function AdminCandidates() {
  const [candidates, setCandidates] = useState<Candidate[]>(mockCandidates);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newCandidate, setNewCandidate] = useState({
    name: '',
    party: '',
    bio: '',
    photo: '',
    electionId: '1',
  });

  const handleCreate = () => {
    if (!newCandidate.name || !newCandidate.party) {
      toast.error('Please fill in all required fields');
      return;
    }

    const candidate: Candidate = {
      id: String(candidates.length + 1),
      name: newCandidate.name,
      party: newCandidate.party,
      bio: newCandidate.bio,
      photo: newCandidate.photo || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
      electionId: newCandidate.electionId,
      voteCount: 0,
    };

    setCandidates([...candidates, candidate]);
    setIsCreateOpen(false);
    setNewCandidate({ name: '', party: '', bio: '', photo: '', electionId: '1' });
    toast.success('Candidate added successfully');
  };

  const handleDelete = (id: string) => {
    setCandidates(candidates.filter(c => c.id !== id));
    toast.success('Candidate removed');
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Candidates</h1>
            <p className="text-muted-foreground">Manage election candidates</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Candidate
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Candidate</DialogTitle>
                <DialogDescription>
                  Enter the candidate details
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="election">Election</Label>
                  <Select
                    value={newCandidate.electionId}
                    onValueChange={(value) => setNewCandidate({ ...newCandidate, electionId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {mockElections.map((election) => (
                        <SelectItem key={election.id} value={election.id}>
                          {election.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={newCandidate.name}
                    onChange={(e) => setNewCandidate({ ...newCandidate, name: e.target.value })}
                    placeholder="Candidate name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="party">Political Party</Label>
                  <Input
                    id="party"
                    value={newCandidate.party}
                    onChange={(e) => setNewCandidate({ ...newCandidate, party: e.target.value })}
                    placeholder="Party affiliation"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Biography</Label>
                  <Textarea
                    id="bio"
                    value={newCandidate.bio}
                    onChange={(e) => setNewCandidate({ ...newCandidate, bio: e.target.value })}
                    placeholder="Brief biography"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="photo">Photo URL</Label>
                  <Input
                    id="photo"
                    value={newCandidate.photo}
                    onChange={(e) => setNewCandidate({ ...newCandidate, photo: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate}>Add Candidate</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Candidates Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {candidates.map((candidate) => {
            const election = mockElections.find(e => e.id === candidate.electionId);
            
            return (
              <div key={candidate.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start gap-4">
                  <img
                    src={candidate.photo}
                    alt={candidate.name}
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{candidate.name}</h3>
                    <p className="text-sm text-primary">{candidate.party}</p>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{candidate.bio}</p>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-2 text-sm">
                    <Vote className="h-4 w-4 text-muted-foreground" />
                    <span>{candidate.voteCount.toLocaleString()} votes</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-destructive"
                      onClick={() => handleDelete(candidate.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {election && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Election: {election.title}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}
