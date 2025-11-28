import { BlockchainTransaction } from '@/types/election';
import { Box, Clock, CheckCircle, FileText, UserPlus, Vote } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface TransactionCardProps {
  transaction: BlockchainTransaction;
}

const typeConfig = {
  vote: {
    icon: Vote,
    label: 'Vote Cast',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  election_created: {
    icon: FileText,
    label: 'Election Created',
    color: 'text-accent',
    bg: 'bg-accent/10',
  },
  candidate_added: {
    icon: UserPlus,
    label: 'Candidate Added',
    color: 'text-success',
    bg: 'bg-success/10',
  },
};

export function TransactionCard({ transaction }: TransactionCardProps) {
  const config = typeConfig[transaction.type];
  const Icon = config.icon;

  return (
    <div className="rounded-xl border border-border bg-card p-4 hover:shadow-lg transition-all duration-200">
      <div className="flex items-start gap-4">
        <div className={`p-2 rounded-lg ${config.bg}`}>
          <Icon className={`h-5 w-5 ${config.color}`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
            <div className="flex items-center gap-1 text-xs text-success">
              <CheckCircle className="h-3 w-3" />
              <span>{transaction.confirmations} confirmations</span>
            </div>
          </div>
          
          <p className="font-mono text-sm text-foreground mt-1 truncate">
            {transaction.hash}
          </p>
          
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Box className="h-3 w-3" />
              <span>Block #{transaction.blockNumber.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{formatDistanceToNow(new Date(transaction.timestamp), { addSuffix: true })}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
