import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { mockVotes, mockCandidates, mockElections } from '@/lib/mock-data';
import { Search, CheckCircle, XCircle, Box, Clock, Shield, Vote } from 'lucide-react';

export default function Verify() {
  const [searchParams] = useSearchParams();
  const initialHash = searchParams.get('hash') || '';
  
  const [hash, setHash] = useState(initialHash);
  const [searchedHash, setSearchedHash] = useState(initialHash);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setSearchedHash(hash);
    setIsSearching(false);
  };

  // Find matching vote (mock - in production would query blockchain)
  const vote = mockVotes.find(v => v.hash === searchedHash) || 
    (searchedHash.startsWith('0x') && searchedHash.length > 20 ? {
      id: 'verified',
      hash: searchedHash,
      electionId: '1',
      candidateId: '1',
      voterHash: '0x' + searchedHash.slice(2, 14),
      blockNumber: 15847293 + Math.floor(Math.random() * 100),
      timestamp: new Date().toISOString(),
      status: 'confirmed' as const,
    } : null);

  const candidate = vote ? mockCandidates.find(c => c.id === vote.candidateId) : null;
  const election = vote ? mockElections.find(e => e.id === vote.electionId) : null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-12">
        <div className="container">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-3xl font-bold mb-2">
                <span className="gradient-text">Verify Your Vote</span>
              </h1>
              <p className="text-muted-foreground">
                Enter your transaction hash to verify your vote on the blockchain
              </p>
            </div>

            <form onSubmit={handleSearch} className="mb-8">
              <div className="space-y-2">
                <Label htmlFor="hash">Transaction Hash</Label>
                <div className="flex gap-2">
                  <Input
                    id="hash"
                    placeholder="0x7f9e8d7c6b5a4938271605f4e3d2c1b0..."
                    value={hash}
                    onChange={(e) => setHash(e.target.value)}
                    className="font-mono"
                  />
                  <Button type="submit" disabled={!hash || isSearching}>
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </form>

            {searchedHash && (
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                {vote ? (
                  <>
                    <div className="p-6 border-b border-border bg-success/5">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                          <CheckCircle className="h-6 w-6 text-success" />
                        </div>
                        <div>
                          <h2 className="text-lg font-semibold text-success">Vote Verified</h2>
                          <p className="text-sm text-muted-foreground">
                            This transaction exists on the blockchain
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 space-y-6">
                      <div className="grid gap-4">
                        <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                          <Box className="h-5 w-5 text-primary mt-0.5" />
                          <div>
                            <p className="text-sm text-muted-foreground">Block Number</p>
                            <p className="font-mono font-medium">{vote.blockNumber.toLocaleString()}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                          <Clock className="h-5 w-5 text-primary mt-0.5" />
                          <div>
                            <p className="text-sm text-muted-foreground">Timestamp</p>
                            <p className="font-medium">{new Date(vote.timestamp).toLocaleString()}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                          <Vote className="h-5 w-5 text-primary mt-0.5" />
                          <div>
                            <p className="text-sm text-muted-foreground">Election</p>
                            <p className="font-medium">{election?.title || 'Presidential Election 2024'}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                          <Shield className="h-5 w-5 text-primary mt-0.5" />
                          <div>
                            <p className="text-sm text-muted-foreground">Voter Hash (Anonymous)</p>
                            <p className="font-mono text-sm">{vote.voterHash}</p>
                          </div>
                        </div>
                      </div>

                      {candidate && (
                        <div className="pt-4 border-t border-border">
                          <p className="text-sm text-muted-foreground mb-3">Vote Cast For:</p>
                          <div className="flex items-center gap-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
                            <img 
                              src={candidate.photo} 
                              alt={candidate.name}
                              className="h-12 w-12 rounded-full object-cover"
                            />
                            <div>
                              <p className="font-semibold">{candidate.name}</p>
                              <p className="text-sm text-primary">{candidate.party}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="text-sm text-muted-foreground">
                        <p className="font-medium mb-1">Transaction Hash:</p>
                        <p className="font-mono break-all">{vote.hash}</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-8 text-center">
                    <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                      <XCircle className="h-8 w-8 text-destructive" />
                    </div>
                    <h2 className="text-lg font-semibold text-destructive mb-2">Vote Not Found</h2>
                    <p className="text-muted-foreground">
                      No vote was found with this transaction hash. Please check the hash and try again.
                    </p>
                  </div>
                )}
              </div>
            )}

            {!searchedHash && (
              <div className="rounded-xl border border-dashed border-border p-12 text-center">
                <Search className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Enter a transaction hash to view vote details
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
