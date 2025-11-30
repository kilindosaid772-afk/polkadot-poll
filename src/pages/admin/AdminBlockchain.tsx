import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { TransactionCard } from '@/components/shared/TransactionCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useBlockchainTransactions } from '@/hooks/useVotes';
import { useDashboardStats } from '@/hooks/useAdminData';
import { Box, Activity, Database, Zap, Search, Download, Loader2 } from 'lucide-react';

export default function AdminBlockchain() {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: transactions, isLoading } = useBlockchainTransactions();
  const { data: stats } = useDashboardStats();

  const blockHeight = stats?.blockchainHeight || 15847350;

  const filteredTransactions = transactions?.filter(tx =>
    tx.tx_hash.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tx.tx_type.includes(searchQuery.toLowerCase())
  ) || [];

  const exportLogs = () => {
    const data = JSON.stringify(transactions, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'blockchain-transactions.json';
    a.click();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Blockchain Monitor</h1>
            <p className="text-muted-foreground">Real-time blockchain activity and transactions</p>
          </div>
          <Button variant="outline" onClick={exportLogs}>
            <Download className="h-4 w-4 mr-2" />
            Export Logs
          </Button>
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
                <p className="text-sm text-muted-foreground">Transactions</p>
                <p className="text-lg font-bold">{transactions?.length || 0}</p>
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

        {/* Transactions */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by hash or type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
              </span>
              Live
            </div>
          </div>
          <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
            {isLoading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              </div>
            ) : filteredTransactions.length > 0 ? (
              filteredTransactions.map((tx) => (
                <TransactionCard key={tx.id} transaction={tx} />
              ))
            ) : (
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
