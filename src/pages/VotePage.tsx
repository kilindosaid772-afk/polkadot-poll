import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { CandidateCard } from '@/components/shared/CandidateCard';
import { mockElections, generateVoteHash } from '@/lib/mock-data';
import { useAuth } from '@/contexts/AuthContext';
import { Vote, AlertTriangle, CheckCircle, Copy, ExternalLink, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Candidate } from '@/types/election';

export default function VotePage() {
  const { electionId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [voteResult, setVoteResult] = useState<{ hash: string; blockNumber: number } | null>(null);

  const election = mockElections.find(e => e.id === electionId);

  if (!election) {
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

  const handleSubmitVote = async () => {
    if (!selectedCandidate) return;

    setIsSubmitting(true);

    // Simulate blockchain transaction
    await new Promise(resolve => setTimeout(resolve, 2000));

    const hash = generateVoteHash();
    const blockNumber = 15847350 + Math.floor(Math.random() * 100);

    setVoteResult({ hash, blockNumber });
    setIsSubmitting(false);
    setShowConfirmation(false);
    toast.success('Your vote has been recorded on the blockchain!');
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
              <div className="h-20 w-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6 animate-pulse-glow">
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
                variant="gradient"
                disabled={!selectedCandidate}
                onClick={() => setShowConfirmation(true)}
              >
                <Vote className="h-5 w-5 mr-2" />
                Submit Vote
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
            <Button onClick={handleSubmitVote} disabled={isSubmitting}>
              {isSubmitting ? (
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

      <Footer />
    </div>
  );
}
