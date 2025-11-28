import { Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { StatsCard } from '@/components/shared/StatsCard';
import { useAuth } from '@/contexts/AuthContext';
import { mockElections, mockVotes } from '@/lib/mock-data';
import { 
  Vote, CheckCircle, Calendar, Shield, 
  ChevronRight, Clock, FileText, History 
} from 'lucide-react';

export default function VoterDashboard() {
  const { user } = useAuth();

  const activeElection = mockElections.find(e => e.status === 'active');
  const userVote = mockVotes[0]; // Mock user's vote

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-12">
        <div className="container">
          {/* Welcome */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name?.split(' ')[0] || 'Voter'}!</h1>
            <p className="text-muted-foreground">Manage your voting activities and track elections</p>
          </div>

          {/* Status Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatsCard
              title="Voter Status"
              value={user?.isApproved ? 'Approved' : 'Pending'}
              icon={user?.isApproved ? CheckCircle : Clock}
              variant={user?.isApproved ? 'success' : 'warning'}
            />
            <StatsCard
              title="Active Elections"
              value={mockElections.filter(e => e.status === 'active').length}
              icon={Calendar}
              variant="primary"
            />
            <StatsCard
              title="Votes Cast"
              value={user?.hasVoted ? 1 : 0}
              icon={Vote}
              variant="accent"
            />
            <StatsCard
              title="Account Security"
              value="Verified"
              icon={Shield}
              variant="success"
            />
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Active Election */}
            <div className="lg:col-span-2 space-y-6">
              {activeElection && (
                <div className="rounded-xl border border-border bg-card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Active Election</h2>
                    <span className="px-3 py-1 rounded-full bg-success/10 text-success text-sm font-medium">
                      Voting Open
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium">{activeElection.title}</h3>
                      <p className="text-muted-foreground text-sm mt-1">{activeElection.description}</p>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Ends: {new Date(activeElection.endDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Vote className="h-4 w-4" />
                        <span>{activeElection.totalVotes.toLocaleString()} votes cast</span>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      {!user?.hasVoted ? (
                        <Button asChild>
                          <Link to={`/vote/${activeElection.id}`}>
                            Cast Your Vote
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Link>
                        </Button>
                      ) : (
                        <Button variant="secondary" disabled>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Vote Submitted
                        </Button>
                      )}
                      <Button variant="outline" asChild>
                        <Link to={`/results/${activeElection.id}`}>
                          View Results
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Vote History */}
              <div className="rounded-xl border border-border bg-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Vote History</h2>
                  <History className="h-5 w-5 text-muted-foreground" />
                </div>

                {userVote ? (
                  <div className="space-y-4">
                    <div className="rounded-lg bg-muted/50 p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">Presidential Election 2024</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Voted on {new Date(userVote.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="px-2 py-1 rounded bg-success/10 text-success text-xs font-medium">
                          Confirmed
                        </span>
                      </div>
                      <div className="mt-3 pt-3 border-t border-border">
                        <p className="text-xs text-muted-foreground mb-1">Transaction Hash</p>
                        <p className="font-mono text-xs break-all">{userVote.hash}</p>
                      </div>
                      <Button variant="outline" size="sm" className="mt-3" asChild>
                        <Link to={`/verify?hash=${userVote.hash}`}>
                          Verify on Blockchain
                        </Link>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Vote className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">No votes cast yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Profile Card */}
              <div className="rounded-xl border border-border bg-card p-6">
                <h2 className="text-lg font-semibold mb-4">Your Profile</h2>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Full Name</p>
                    <p className="font-medium">{user?.name || 'Voter User'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">National ID</p>
                    <p className="font-medium font-mono">{user?.nationalId || 'NID-2024-XXXX'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium">{user?.email || 'voter@email.com'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Phone</p>
                    <p className="font-medium">{user?.phone || '+1234567890'}</p>
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div className="rounded-xl border border-border bg-card p-6">
                <h2 className="text-lg font-semibold mb-4">Quick Links</h2>
                <div className="space-y-2">
                  <Link 
                    to="/elections" 
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <FileText className="h-5 w-5 text-primary" />
                    <span>View All Elections</span>
                  </Link>
                  <Link 
                    to="/verify" 
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <Shield className="h-5 w-5 text-primary" />
                    <span>Verify a Vote</span>
                  </Link>
                  <Link 
                    to="/explorer" 
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <Vote className="h-5 w-5 text-primary" />
                    <span>Blockchain Explorer</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
