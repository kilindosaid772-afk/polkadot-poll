import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { TransactionCard } from '@/components/shared/TransactionCard';
import { BlockchainStatus } from '@/components/shared/BlockchainStatus';
import { useBlockchainTransactions } from '@/hooks/useVotes';
import { useDashboardStats } from '@/hooks/useAdminData';
import { Box, Activity, Database, Zap, Loader2 } from 'lucide-react';

export default function Explorer() {
  const { data: transactions, isLoading } = useBlockchainTransactions();
  const { data: stats } = useDashboardStats();

  const blockHeight = stats?.blockchainHeight || 15847350;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-12">
        <div className="container">
          <div className="mb-12">
            <h1 className="text-3xl font-bold mb-2">
              <span className="gradient-text">Blockchain Explorer</span>
            </h1>
            <p className="text-muted-foreground">
              Real-time view of all election transactions on the blockchain
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Box className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Block Height</p>
                  <p className="text-lg font-bold font-mono">{blockHeight.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Network</p>
                  <p className="text-lg font-bold text-success">Online</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Database className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Votes</p>
                  <p className="text-lg font-bold">{(stats?.totalVotesCast || 0).toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Block Time</p>
                  <p className="text-lg font-bold">6.0s</p>
                </div>
              </div>
            </div>
          </div>

          {/* Network Status Bar */}
          <div className="rounded-xl border border-border bg-card p-4 mb-8">
            <BlockchainStatus />
          </div>

          {/* Transactions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Recent Transactions</h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
                </span>
                Live updates
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : transactions && transactions.length > 0 ? (
              <div className="space-y-3">
                {transactions.map((tx, index) => (
                  <div 
                    key={tx.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <TransactionCard transaction={tx} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border p-12 text-center">
                <Database className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground">No transactions yet</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
