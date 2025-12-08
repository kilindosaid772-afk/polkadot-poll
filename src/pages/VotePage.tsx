import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { CandidateCard } from '@/components/shared/CandidateCard';
import { useAuth } from '@/contexts/AuthContext';
import { useElection, Candidate } from '@/hooks/useElections';
import { useCastVote, useUserVotes } from '@/hooks/useVotes';
import { Vote, AlertTriangle, CheckCircle, Copy, ExternalLink, Loader2, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TwoFactorVerification } from '@/components/voting/TwoFactorVerification';

export default function VotePage() {
  const { electionId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, profile } = useAuth();
  
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [is2FAVerified, setIs2FAVerified] = useState(false);
  const [voteResult, setVoteResult] = useState<{ hash: string; blockNumber: number } | null>(null);

  const { data: election, isLoading: electionLoading, error: electionError } = useElection(electionId || '');
  const { data: userVotes } = useUserVotes();
  const castVoteMutation = useCastVote();

  const hasVotedInElection = userVotes?.some(v => v.election_id === electionId);

  if (electionLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!election || electionError) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Election Not Found</h1>
            <p className="text-muted-foreground mb-4">The requested election does not exist.</p>
            <Button onClick={() => navigate('/elections')}>View All Elections</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="h-16 w-16 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-warning" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Authentication Required</h1>
            <p className="text-muted-foreground mb-6">
              You must be logged in to cast your vote. Please sign in to continue.
            </p>
            <Button onClick={() => navigate('/login')}>Sign In to Vote</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!profile?.is_approved) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="h-16 w-16 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="h-8 w-8 text-warning" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Approval Required</h1>
            <p className="text-muted-foreground mb-6">
              Your voter registration is pending approval. Please wait for an administrator to approve your account.
            </p>
            <Button onClick={() => navigate('/voter')}>Go to Dashboard</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (hasVotedInElection) {
    const existingVote = userVotes?.find(v => v.election_id === electionId);
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center py-12 px-4">
          <div className="max-w-lg w-full">
            <div className="rounded-2xl border border-border bg-card p-8 text-center">
              <div className="h-20 w-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-10 w-10 text-success" />
              </div>
              
              <h1 className="text-2xl font-bold mb-2">Already Voted</h1>
              <p className="text-muted-foreground mb-6">
                You have already cast your vote in this election.
              </p>

              {existingVote && (
                <div className="rounded-lg bg-muted/50 p-4 mb-6 text-left">
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Block Number:</span>
                      <p className="font-mono">{existingVote.block_number.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Transaction Hash:</span>
                      <p className="font-mono text-xs break-all">{existingVote.tx_hash}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <Button className="w-full" variant="outline" onClick={() => navigate(`/verify?hash=${existingVote?.tx_hash}`)}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Verify on Blockchain
                </Button>
                <Button className="w-full" onClick={() => navigate('/voter')}>
                  Return to Dashboard
                </Button>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (election.status !== 'active') {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Vote className="h-8 w-8 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold mb-2">
              {election.status === 'upcoming' ? 'Election Not Started' : 'Election Ended'}
            </h1>
            <p className="text-muted-foreground mb-6">
              {election.status === 'upcoming' 
                ? `This election starts on ${new Date(election.start_date).toLocaleDateString()}.`
                : 'This election has ended. View the results below.'}
            </p>
            <Button onClick={() => navigate(election.status === 'completed' ? `/results/${electionId}` : '/elections')}>
              {election.status === 'completed' ? 'View Results' : 'View All Elections'}
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const handleSubmitVote = async () => {
    if (!selectedCandidate || !electionId) return;

    try {
      const result = await castVoteMutation.mutateAsync({
        electionId,
        candidateId: selectedCandidate.id,
      });

      setVoteResult({ hash: result.txHash, blockNumber: result.blockNumber });
      setShowConfirmation(false);
      toast.success('Your vote has been recorded on the blockchain!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to cast vote';
      toast.error(errorMessage);
    }
  };

  const copyHash = () => {
    if (voteResult) {
      navigator.clipboard.writeText(voteResult.hash);
      toast.success('Transaction hash copied to clipboard');
    }
  };

  if (voteResult) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center py-12 px-4">
          <div className="max-w-lg w-full">
            <div className="rounded-2xl border border-border bg-card p-8 text-center">
              <div className="h-20 w-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6 animate-pulse">
                <CheckCircle className="h-10 w-10 text-success" />
              </div>
              
              <h1 className="text-2xl font-bold mb-2">Vote Confirmed!</h1>
              <p className="text-muted-foreground mb-6">
                Your vote has been securely recorded on the blockchain.
              </p>

              <div className="rounded-lg bg-muted/50 p-4 mb-6 text-left">
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Candidate:</span>
                    <p className="font-medium">{selectedCandidate?.name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Block Number:</span>
                    <p className="font-mono">{voteResult.blockNumber.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Transaction Hash:</span>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="font-mono text-xs break-all">{voteResult.hash}</p>
                      <button onClick={copyHash} className="shrink-0 text-primary hover:text-primary/80">
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Button className="w-full" variant="outline" onClick={() => navigate(`/verify?hash=${voteResult.hash}`)}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Verify on Blockchain
                </Button>
                <Button className="w-full" onClick={() => navigate('/voter')}>
                  Return to Dashboard
                </Button>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-12">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">{election.title}</h1>
              <p className="text-muted-foreground">{election.description}</p>
            </div>

            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 mb-8 flex items-start gap-3">
              <Vote className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-foreground">Select your candidate</p>
                <p className="text-muted-foreground">
                  Your vote is encrypted and recorded on the blockchain. You can verify it anytime.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-8">
              {election.candidates.map((candidate) => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  isSelected={selectedCandidate?.id === candidate.id}
                  onSelect={setSelectedCandidate}
                />
              ))}
            </div>

            <div className="flex justify-end">
              <Button
                size="lg"
                disabled={!selectedCandidate}
                onClick={() => {
                  if (!is2FAVerified) {
                    setShow2FA(true);
                  } else {
                    setShowConfirmation(true);
                  }
                }}
              >
                <Vote className="h-5 w-5 mr-2" />
                {is2FAVerified ? 'Submit Vote' : 'Verify & Vote'}
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Your Vote</DialogTitle>
            <DialogDescription>
              Please review your selection before submitting. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {selectedCandidate && (
            <div className="py-4">
              <CandidateCard candidate={selectedCandidate} disabled />
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowConfirmation(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitVote} disabled={castVoteMutation.isPending}>
              {castVoteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Recording on Blockchain...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirm Vote
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <TwoFactorVerification
        open={show2FA}
        onOpenChange={setShow2FA}
        onVerified={() => {
          setIs2FAVerified(true);
          setShowConfirmation(true);
        }}
        userEmail={profile?.email || user?.email || ''}
      />

      <Footer />
    </div>
  );
}
