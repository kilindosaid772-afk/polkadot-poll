import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useElections } from '@/hooks/useElections';
import { useAddCandidate, useDeleteCandidate } from '@/hooks/useAdminData';
import { Plus, Edit, Trash2, Vote, Loader2 } from 'lucide-react';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useElection } from '@/hooks/useElections';
import { useRealtimeElections } from '@/hooks/useRealtimeElection';

export default function AdminCandidates() {
  const [searchParams] = useSearchParams();
  const electionIdFromUrl = searchParams.get('election');
  
  const { data: elections, isLoading: electionsLoading } = useElections();
  const addCandidate = useAddCandidate();
  const deleteCandidate = useDeleteCandidate();
  
  const [selectedElectionId, setSelectedElectionId] = useState<string>('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [candidateToDelete, setCandidateToDelete] = useState<string | null>(null);
  const [newCandidate, setNewCandidate] = useState({
    name: '',
    party: '',
    bio: '',
    photo: '',
  });

  // Enable realtime updates
  useRealtimeElections();

  // Set selected election from URL or first available
  useEffect(() => {
    if (electionIdFromUrl) {
      setSelectedElectionId(electionIdFromUrl);
    } else if (elections && elections.length > 0 && !selectedElectionId) {
      setSelectedElectionId(elections[0].id);
    }
  }, [electionIdFromUrl, elections, selectedElectionId]);

  const { data: electionWithCandidates, isLoading: candidatesLoading } = useElection(selectedElectionId);

  const handleCreate = async () => {
    if (!newCandidate.name || !newCandidate.party || !selectedElectionId) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await addCandidate.mutateAsync({
        electionId: selectedElectionId,
        name: newCandidate.name,
        party: newCandidate.party,
        bio: newCandidate.bio,
        photo: newCandidate.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(newCandidate.name)}&background=random`,
      });
      setIsCreateOpen(false);
      setNewCandidate({ name: '', party: '', bio: '', photo: '' });
      toast.success('Candidate added successfully');
    } catch (error) {
      toast.error('Failed to add candidate');
    }
  };

  const handleDelete = async () => {
    if (!candidateToDelete) return;
    try {
      await deleteCandidate.mutateAsync(candidateToDelete);
      toast.success('Candidate removed');
      setDeleteDialogOpen(false);
      setCandidateToDelete(null);
    } catch (error) {
      toast.error('Failed to delete candidate');
    }
  };

  if (electionsLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  const candidates = electionWithCandidates?.candidates || [];
  const selectedElection = elections?.find(e => e.id === selectedElectionId);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Candidates</h1>
            <p className="text-muted-foreground">Manage election candidates</p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={selectedElectionId} onValueChange={setSelectedElectionId}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Select election" />
              </SelectTrigger>
              <SelectContent>
                {elections?.map((election) => (
                  <SelectItem key={election.id} value={election.id}>
                    {election.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button disabled={!selectedElectionId}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Candidate
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Candidate</DialogTitle>
                  <DialogDescription>
                    Add a candidate to {selectedElection?.title}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
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
                    <Label htmlFor="photo">Photo URL (optional)</Label>
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
                  <Button onClick={handleCreate} disabled={addCandidate.isPending}>
                    {addCandidate.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Add Candidate
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {!selectedElectionId && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Select an election to view its candidates</p>
          </div>
        )}

        {selectedElectionId && candidatesLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {selectedElectionId && !candidatesLoading && (
          <>
            {candidates.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No candidates yet. Add one to get started.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {candidates.map((candidate) => (
                  <div key={candidate.id} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-start gap-4">
                      <img
                        src={candidate.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(candidate.name)}&background=random`}
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
                        <span>{candidate.vote_count.toLocaleString()} votes</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => {
                            setCandidateToDelete(candidate.id);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Candidate</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this candidate? This action cannot be undone.
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
