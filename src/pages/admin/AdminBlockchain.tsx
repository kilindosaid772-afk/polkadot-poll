import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { TransactionCard } from '@/components/shared/TransactionCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { mockTransactions, generateVoteHash } from '@/lib/mock-data';
import { BlockchainTransaction } from '@/types/election';
import { Box, Activity, Database, Zap, Search, Download, RefreshCw } from 'lucide-react';

export default function AdminBlockchain() {
  const [transactions, setTransactions] = useState<BlockchainTransaction[]>(mockTransactions);
  const [blockHeight, setBlockHeight] = useState(15847350);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      setBlockHeight(prev => prev + 1);
      
      if (Math.random() > 0.6) {
        const newTx: BlockchainTransaction = {
          hash: generateVoteHash(),
          blockNumber: blockHeight + 1,
          timestamp: new Date().toISOString(),
          type: 'vote',
          data: { candidateId: String(Math.floor(Math.random() * 4) + 1), electionId: '1' },
          confirmations: 1,
        };
        setTransactions(prev => [newTx, ...prev.slice(0, 49)]);
      }

      setTransactions(prev => 
        prev.map(tx => ({ ...tx, confirmations: tx.confirmations + 1 }))
      );
    }, 6000);

    return () => clearInterval(interval);
  }, [blockHeight, isLive]);

  const filteredTransactions = transactions.filter(tx =>
    tx.hash.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tx.type.includes(searchQuery.toLowerCase())
  );

  const exportLogs = () => {
    const data = JSON.stringify(transactions, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blockchain-audit-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Blockchain Monitor</h1>
            <p className="text-muted-foreground">Real-time blockchain activity and audit logs</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setIsLive(!isLive)}>
              {isLive ? (
                <>
                  <span className="relative flex h-2 w-2 mr-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
                  </span>
                  Live
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Paused
                </>
              )}
            </Button>
            <Button variant="outline" onClick={exportLogs}>
              <Download className="h-4 w-4 mr-2" />
              Export Logs
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                <p className="text-sm text-muted-foreground">Network Status</p>
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
                <p className="text-sm text-muted-foreground">Transactions</p>
                <p className="text-lg font-bold">{transactions.length}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Zap className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Block Time</p>
                <p className="text-lg font-bold">6.0s</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by transaction hash or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Transactions */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/50 flex items-center justify-between">
            <h3 className="font-semibold">Transaction Log</h3>
            {isLive && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
                </span>
                Live updates
              </div>
            )}
          </div>
          <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
            {filteredTransactions.map((tx, index) => (
              <TransactionCard key={tx.hash + index} transaction={tx} />
            ))}
            {filteredTransactions.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No transactions found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
